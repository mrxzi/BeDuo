// ============================================================
// CameraSession — Stream lifecycle management
// ============================================================
// Handles opening/closing camera streams, track management,
// portrait orientation, and wide-angle lens selection for iPhone.

import type { CameraFacing } from './types';

export interface StreamOptions {
  facing?: CameraFacing;
  deviceId?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

/**
 * Open a camera stream with the given options.
 * Prefers deviceId if provided, falls back to facingMode.
 */
export async function openStream(options: StreamOptions = {}): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: buildVideoConstraints(options),
  };

  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Build video constraints optimized for mobile portrait view (iPhone & Android)
 * and wide-angle lens preference.
 */
function buildVideoConstraints(options: StreamOptions): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {};

  if (options.deviceId) {
    constraints.deviceId = { exact: options.deviceId };
  } else if (options.facing) {
    constraints.facingMode = { ideal: options.facing };
  }

  // Use ideal resolution without hard aspect ratio lock to prevent native sensor crop
  constraints.width = { ideal: 1920 };
  constraints.height = { ideal: 1080 };

  return constraints;
}

/**
 * Attempt native hardware zoom on active video track.
 */
export async function applyTrackZoom(stream: MediaStream | null, zoomLevel: number): Promise<boolean> {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track) return false;

  try {
    const capabilities = (track.getCapabilities?.() || {}) as { zoom?: { min: number; max: number } };
    if (capabilities.zoom) {
      const minZoom = capabilities.zoom.min || 1;
      const maxZoom = capabilities.zoom.max || 5;
      const clampedZoom = Math.min(Math.max(zoomLevel, minZoom), maxZoom);
      await track.applyConstraints({
        advanced: [{ zoom: clampedZoom } as unknown as MediaTrackConstraintSet],
      });
      return true;
    }
  } catch (e) {
    // Hardware track zoom unavailable — fallback to digital scale
  }
  return false;
}

/**
 * Stop all tracks in a stream and release resources.
 */
export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Stop all tracks of a specific kind in a stream.
 */
export function stopVideoTracks(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getVideoTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Check if a stream is still active (has live tracks).
 */
export function isStreamActive(stream: MediaStream | null): boolean {
  if (!stream) return false;
  return stream.getVideoTracks().some((track) => track.readyState === 'live');
}

/**
 * Attach a stream to a video element and wait until it's ready to display.
 */
export async function attachStreamToVideo(
  videoElement: HTMLVideoElement,
  stream: MediaStream,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise<void>((resolve) => {
    videoElement.srcObject = stream;
    videoElement.defaultMuted = true;
    videoElement.muted = true;
    videoElement.setAttribute('muted', '');
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('autoplay', 'true');

    const tryPlay = () => {
      videoElement.play().catch(() => {
        // Autoplay policy or gesture required — will play on user tap
      });
    };

    tryPlay();

    const timeout = setTimeout(() => {
      resolve();
    }, timeoutMs);

    const onReady = () => {
      clearTimeout(timeout);
      videoElement.removeEventListener('loadedmetadata', onReady);
      videoElement.removeEventListener('playing', onReady);
      resolve();
    };

    if (videoElement.readyState >= 2) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    videoElement.addEventListener('loadedmetadata', onReady, { once: true });
    videoElement.addEventListener('playing', onReady, { once: true });
  });
}

/**
 * Detach stream from a video element and clean up.
 */
export function detachStreamFromVideo(videoElement: HTMLVideoElement | null): void {
  if (!videoElement) return;
  videoElement.pause();
  videoElement.srcObject = null;
  videoElement.removeAttribute('src');
  videoElement.load();
}

/**
 * Get the actual video dimensions from a stream's track settings.
 */
export function getStreamDimensions(stream: MediaStream): { width: number; height: number } | null {
  const track = stream.getVideoTracks()[0];
  if (!track) return null;
  const settings = track.getSettings();
  return {
    width: settings.width || 0,
    height: settings.height || 0,
  };
}
