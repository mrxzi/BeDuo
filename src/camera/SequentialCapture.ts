// ============================================================
// SequentialCapture — Seamless sequential fallback
// ============================================================
// When simultaneous camera streams are not supported,
// this module handles: rear capture → switch → front capture
// automatically with a single shutter press.

import { openStream, stopStream, attachStreamToVideo } from './CameraSession';
import { captureFrame } from './CameraCapture';
import type { CapturedFrame, CameraManagerConfig } from './types';

export interface SequentialCaptureResult {
  rearFrame: CapturedFrame;
  frontFrame: CapturedFrame;
  totalDurationMs: number;
}

export type SequentialCaptureCallback = (phase: SequentialCapturePhase) => void;

export type SequentialCapturePhase =
  | 'capturing-rear'
  | 'switching'
  | 'capturing-front'
  | 'compositing'
  | 'done';

/**
 * Perform a sequential dual capture:
 * 1. Capture rear frame from existing stream
 * 2. Stop rear stream
 * 3. Open front camera
 * 4. Wait for readiness
 * 5. Capture front frame
 * 6. Stop front stream
 *
 * The caller provides the rear video element (already streaming)
 * and a temporary video element for the front camera.
 */
export async function performSequentialCapture(
  rearVideoElement: HTMLVideoElement,
  rearStream: MediaStream,
  targetVideoElement: HTMLVideoElement,
  config: CameraManagerConfig,
  onPhase?: SequentialCaptureCallback
): Promise<SequentialCaptureResult> {
  const startTime = Date.now();

  // Phase 1: Capture rear frame from active rearVideoElement
  onPhase?.('capturing-rear');
  const rearFrame = await captureFrame(rearVideoElement, 'environment', false, config.rearZoomLevel || 1.0);

  // Phase 2: Switch cameras
  onPhase?.('switching');

  // Stop rear stream immediately to release camera hardware for front camera
  stopStream(rearStream);

  // Open front camera
  let frontFrame: CapturedFrame;
  let frontStream: MediaStream | null = null;
  try {
    frontStream = await openStream({ facing: 'user' });

    await attachStreamToVideo(
      targetVideoElement,
      frontStream,
      config.videoReadinessTimeoutMs
    );

    // Give iOS a brief moment (200ms) to decode & render the first front frame
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    onPhase?.('capturing-front');
    frontFrame = await captureFrame(
      targetVideoElement,
      'user',
      config.mirrorFrontCapture
    );
  } catch (err) {
    console.warn('[SequentialCapture] Front camera switch failed, fallback selfie frame:', err);
    frontFrame = {
      ...rearFrame,
      facing: 'user',
    };
  } finally {
    if (frontStream) {
      stopStream(frontStream);
    }
  }

  const totalDurationMs = Date.now() - startTime;

  onPhase?.('done');

  return {
    rearFrame,
    frontFrame,
    totalDurationMs,
  };
}
