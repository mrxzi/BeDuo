// ============================================================
// CameraCapture — Frame capture from video elements via Canvas
// ============================================================

import type { CapturedFrame, CameraFacing } from './types';

/**
 * Capture a single frame from a video element.
 * Uses an offscreen canvas for efficiency.
 */
export async function captureFrame(
  videoElement: HTMLVideoElement,
  facing: CameraFacing,
  mirror: boolean = false
): Promise<CapturedFrame> {
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;

  if (!width || !height) {
    throw new Error(`Video has no dimensions: ${width}x${height}`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Cannot get 2D canvas context');
  }

  // Apply mirroring for front camera if requested
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(videoElement, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob from canvas'));
      },
      'image/webp',
      0.92
    );
  });

  return {
    blob,
    width,
    height,
    timestamp: Date.now(),
    facing,
  };
}

/**
 * Wait for a video element to be in a state suitable for capture.
 * Checks that:
 * - Video has non-zero dimensions
 * - ReadyState is at least HAVE_CURRENT_DATA (2)
 */
export function waitForVideoReady(
  videoElement: HTMLVideoElement,
  timeoutMs: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const checkReady = () => {
      if (
        videoElement.readyState >= 2 &&
        videoElement.videoWidth > 0 &&
        videoElement.videoHeight > 0
      ) {
        return true;
      }
      return false;
    };

    // Already ready?
    if (checkReady()) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video readiness timeout'));
    }, timeoutMs);

    const onCanPlay = () => {
      if (checkReady()) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      videoElement.removeEventListener('canplay', onCanPlay);
      videoElement.removeEventListener('loadeddata', onCanPlay);
      videoElement.removeEventListener('playing', onCanPlay);
    };

    videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('loadeddata', onCanPlay);
    videoElement.addEventListener('playing', onCanPlay);
  });
}
