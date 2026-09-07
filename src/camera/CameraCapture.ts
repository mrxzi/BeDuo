// ============================================================
// CameraCapture — Frame capture from video elements via Canvas
// ============================================================

import type { CapturedFrame, CameraFacing } from './types';

/**
 * Capture a single frame from a video element with optional mirroring and zoom scaling.
 */
export async function captureFrame(
  videoElement: HTMLVideoElement,
  facing: CameraFacing,
  mirror: boolean = false,
  zoomFactor: number = 1.0
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

  if (zoomFactor > 1.0) {
    // Zoom in: crop center section according to zoom factor
    const cropWidth = width / zoomFactor;
    const cropHeight = height / zoomFactor;
    const cropX = (width - cropWidth) / 2;
    const cropY = (height - cropHeight) / 2;
    ctx.drawImage(videoElement, cropX, cropY, cropWidth, cropHeight, 0, 0, width, height);
  } else {
    ctx.drawImage(videoElement, 0, 0, width, height);
  }

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
