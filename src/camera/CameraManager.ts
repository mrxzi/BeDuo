// ============================================================
// CameraManager — Central orchestrator
// ============================================================
// Coordinates: permission → discovery → streams → capture → composition → cleanup
// This is the single entry point for all camera operations.

import { detectCameraCapabilities, clearCapabilitiesCache } from './CameraCapabilities';
import { openStream, stopStream, attachStreamToVideo, detachStreamFromVideo, isStreamActive, applyTrackZoom } from './CameraSession';
import { captureFrame } from './CameraCapture';
import { performSequentialCapture } from './SequentialCapture';
import { composeImage } from './ImageComposer';
import { classifyCameraError, checkCameraApiSupport } from './CameraFallback';
import {
  type CameraCapabilities,
  type CameraMode,
  type CameraManagerConfig,
  type CameraError,
  type CapturedFrame,
  type CompositionResult,
  type CameraDebugInfo,
  type PermissionState,
  DEFAULT_CAMERA_CONFIG,
} from './types';

export class CameraManager {
  private config: CameraManagerConfig;
  private capabilities: CameraCapabilities | null = null;
  private rearStream: MediaStream | null = null;
  private frontStream: MediaStream | null = null;
  private rearVideoRef: HTMLVideoElement | null = null;
  private frontVideoRef: HTMLVideoElement | null = null;
  private sequentialVideoRef: HTMLVideoElement | null = null;
  private rearZoomLevel = 1.0;
  private mode: CameraMode = 'unsupported';
  private permissionState: PermissionState = 'prompt';
  private lastError: CameraError | null = null;
  private captureStartTime: number | null = null;
  private captureDuration: number | null = null;
  private _isInitialized = false;

  constructor(config?: Partial<CameraManagerConfig>) {
    this.config = { ...DEFAULT_CAMERA_CONFIG, ...config };
  }

  // ---- Getters & Zoom ----

  async setRearZoom(zoom: number): Promise<void> {
    this.rearZoomLevel = zoom;
    await applyTrackZoom(this.rearStream, zoom);
  }

  getRearZoom(): number {
    return this.rearZoomLevel;
  }

  getMode(): CameraMode {
    return this.mode;
  }

  getCapabilities(): CameraCapabilities | null {
    return this.capabilities;
  }

  getPermissionState(): PermissionState {
    return this.permissionState;
  }

  getLastError(): CameraError | null {
    return this.lastError;
  }

  isInitialized(): boolean {
    return this._isInitialized;
  }

  getRearStream(): MediaStream | null {
    return this.rearStream;
  }

  getFrontStream(): MediaStream | null {
    return this.frontStream;
  }

  getDebugInfo(): CameraDebugInfo {
    return {
      cameraCount: this.capabilities?.allDevices.length || 0,
      frontCameraDetected: this.capabilities?.hasFrontCamera || false,
      rearCameraDetected: this.capabilities?.hasRearCamera || false,
      simultaneousMode: this.mode === 'simultaneous',
      sequentialMode: this.mode === 'sequential',
      permissionState: this.permissionState,
      rearVideoDimensions: this.rearVideoRef
        ? { width: this.rearVideoRef.videoWidth, height: this.rearVideoRef.videoHeight }
        : null,
      frontVideoDimensions: this.frontVideoRef
        ? { width: this.frontVideoRef.videoWidth, height: this.frontVideoRef.videoHeight }
        : null,
      captureStartTime: this.captureStartTime,
      captureDuration: this.captureDuration,
      lastError: this.lastError,
    };
  }

  // ---- Initialization ----

  /**
   * Initialize the camera system:
   * 1. Check API support
   * 2. Detect capabilities
   * 3. Determine mode
   */
  async initialize(): Promise<CameraCapabilities> {
    this.lastError = null;

    // Check browser support
    const apiError = checkCameraApiSupport();
    if (apiError) {
      this.lastError = apiError;
      this.permissionState = 'unavailable';
      throw apiError;
    }

    try {
      this.capabilities = await detectCameraCapabilities();
      this.mode = this.capabilities.detectedMode;
      this.permissionState = 'granted';
      this._isInitialized = true;

      if (this.config.debugMode) {
        console.log('[CameraManager] Initialized:', {
          mode: this.mode,
          capabilities: this.capabilities,
        });
      }

      return this.capabilities;
    } catch (err) {
      const cameraError = classifyCameraError(err);
      this.lastError = cameraError;

      if (cameraError.type === 'permission-denied' || cameraError.type === 'permission-dismissed') {
        this.permissionState = 'denied';
      }

      throw cameraError;
    }
  }

  // ---- Stream Management ----

  /**
   * Start the rear camera stream and attach to video element.
   * Supports selecting specific rear device index for iPhone wide/ultra-wide lenses.
   */
  async startRearCamera(videoElement: HTMLVideoElement, rearDeviceIndex = 0): Promise<void> {
    this.rearVideoRef = videoElement;

    try {
      const rearDevices = this.capabilities?.rearDevices || [];
      const rearDevice = rearDeviceIndex > 0 ? rearDevices[rearDeviceIndex] : undefined;

      if (this.rearStream) {
        stopStream(this.rearStream);
        this.rearStream = null;
      }

      this.rearStream = await openStream({
        facing: 'environment',
        deviceId: rearDevice?.deviceId,
      });

      this.rearZoomLevel = 1.0;
      await applyTrackZoom(this.rearStream, 1.0);

      await attachStreamToVideo(videoElement, this.rearStream, this.config.videoReadinessTimeoutMs);

      if (this.config.debugMode) {
        console.log('[CameraManager] Rear camera started:', {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          deviceId: rearDevice?.deviceId,
        });
      }
    } catch (err) {
      this.lastError = classifyCameraError(err);
      throw this.lastError;
    }
  }

  /**
   * Start the front camera stream and attach to video element.
   * Only works in simultaneous mode.
   */
  async startFrontCamera(videoElement: HTMLVideoElement): Promise<void> {
    this.frontVideoRef = videoElement;

    // On rear-only or unsupported devices, skip entirely
    if (this.mode === 'rear-only' || this.mode === 'unsupported') {
      return;
    }

    // In front-only or simultaneous mode, front camera MUST succeed
    // In sequential mode (iOS), we still try to open the front camera for LIVE PREVIEW.
    // If it fails in sequential mode, we silently skip — capture still works via sequential switching.
    const isCritical = this.mode === 'simultaneous' || this.mode === 'front-only';

    try {
      const frontDevice = this.capabilities?.frontDevices[0];

      this.frontStream = await openStream({
        facing: 'user',
        deviceId: frontDevice?.deviceId,
      });

      await attachStreamToVideo(videoElement, this.frontStream, this.config.videoReadinessTimeoutMs);

      if (this.config.debugMode) {
        console.log('[CameraManager] Front camera preview started:', {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          mode: this.mode,
        });
      }
    } catch (err) {
      if (isCritical) {
        // Downgrade simultaneous → sequential when front camera fails
        if (this.mode === 'simultaneous') {
          this.mode = 'sequential';
          if (this.config.debugMode) {
            console.warn('[CameraManager] Front camera failed, downgraded to sequential mode');
          }
          return;
        }
        this.lastError = classifyCameraError(err);
        throw this.lastError;
      }
      // Sequential / preview failure: non-critical — PiP will stay as placeholder
      if (this.config.debugMode) {
        console.warn('[CameraManager] Front camera preview failed in sequential mode (non-critical):', err);
      }
    }
  }

  /**
   * Set the sequential video element reference (hidden element for front capture).
   */
  setSequentialVideoRef(videoElement: HTMLVideoElement): void {
    this.sequentialVideoRef = videoElement;
  }

  // ---- Capture ----

  /**
   * Capture a dual-camera photo.
   * Automatically uses simultaneous or sequential mode based on detected capabilities.
   * Returns a CompositionResult with the final composited image.
   */
  async capture(
    onPhase?: (phase: string) => void
  ): Promise<CompositionResult> {
    this.captureStartTime = Date.now();
    this.lastError = null;

    try {
      let rearFrame: CapturedFrame;
      let frontFrame: CapturedFrame | null = null;

      if (this.mode === 'simultaneous') {
        // --- Simultaneous capture ---
        onPhase?.('capturing');

        if (!this.rearVideoRef || !this.frontVideoRef) {
          throw new Error('Video elements not available for simultaneous capture');
        }

        if (!isStreamActive(this.rearStream) || !isStreamActive(this.frontStream)) {
          throw new Error('Camera streams not active for simultaneous capture');
        }

        // Capture both frames as close together as possible
        rearFrame = await captureFrame(this.rearVideoRef, 'environment', false);
        frontFrame = await captureFrame(
          this.frontVideoRef,
          'user',
          this.config.mirrorFrontCapture
        );

      } else if (this.mode === 'sequential') {
        // --- Sequential capture ---
        if (!this.rearVideoRef || !this.rearStream) {
          throw new Error('Rear camera not available for sequential capture');
        }

        // OPTIMIZATION: If front camera preview stream is already live (iOS preview),
        // capture both frames directly without switching — effectively simultaneous!
        if (this.frontVideoRef && isStreamActive(this.frontStream)) {
          onPhase?.('capturing');
          rearFrame = await captureFrame(this.rearVideoRef, 'environment', false, this.rearZoomLevel);
          frontFrame = await captureFrame(
            this.frontVideoRef,
            'user',
            this.config.mirrorFrontCapture
          );
        } else {
          // Fallback: Classic sequential camera switch (rear → stop → front)
          const seqVideo = this.sequentialVideoRef || document.createElement('video');
          seqVideo.setAttribute('playsinline', '');
          seqVideo.muted = true;

          // Temporarily add to DOM if not already there (needed for some browsers)
          let addedToDOM = false;
          if (!seqVideo.parentElement) {
            seqVideo.style.position = 'fixed';
            seqVideo.style.top = '-9999px';
            seqVideo.style.left = '-9999px';
            seqVideo.style.width = '1px';
            seqVideo.style.height = '1px';
            seqVideo.style.opacity = '0';
            document.body.appendChild(seqVideo);
            addedToDOM = true;
          }

          try {
            const result = await performSequentialCapture(
              this.rearVideoRef,
              this.rearStream,
              seqVideo,
              this.config,
              (phase) => onPhase?.(phase)
            );

            rearFrame = result.rearFrame;
            frontFrame = result.frontFrame;

            // Rear stream was stopped during sequential capture
            this.rearStream = null;
          } finally {
            // Clean up sequential video element
            detachStreamFromVideo(seqVideo);
            if (addedToDOM && seqVideo.parentElement) {
              seqVideo.parentElement.removeChild(seqVideo);
            }
          }
        }

      } else if (this.mode === 'rear-only' || this.mode === 'front-only') {
        // --- Single camera capture ---
        onPhase?.('capturing');

        const videoRef = this.mode === 'rear-only' ? this.rearVideoRef : this.frontVideoRef;
        const facing = this.mode === 'rear-only' ? 'environment' : 'user';
        const mirror = this.mode === 'front-only' ? this.config.mirrorFrontCapture : false;

        if (!videoRef) {
          throw new Error('Video element not available');
        }

        rearFrame = await captureFrame(videoRef, facing, mirror);

        // Capture a second frame or fallback for selfie overlay so front PiP overlay is ALWAYS rendered
        frontFrame = {
          ...rearFrame,
          facing: 'user',
        };
      } else {
        throw new Error('Camera mode unsupported');
      }

      // --- Composition ---
      onPhase?.('processing');

      // Guarantee front frame exists for composition
      if (!frontFrame) {
        frontFrame = {
          ...rearFrame,
          facing: 'user',
        };
      }

      const composition: CompositionResult = await composeImage(rearFrame, frontFrame, this.config.composition);

      this.captureDuration = Date.now() - this.captureStartTime;

      if (this.config.debugMode) {
        console.log('[CameraManager] Capture complete:', {
          mode: this.mode,
          duration: this.captureDuration,
          size: `${(composition.sizeBytes / 1024).toFixed(1)}KB`,
        });
      }

      return composition;
    } catch (err) {
      this.captureDuration = Date.now() - this.captureStartTime;
      const cameraError = classifyCameraError(err);
      this.lastError = cameraError;
      throw cameraError;
    }
  }

  // ---- Cleanup ----

  /**
   * Stop all camera streams and clean up resources.
   */
  cleanup(): void {
    if (this.config.debugMode) {
      console.log('[CameraManager] Cleaning up...');
    }

    stopStream(this.rearStream);
    stopStream(this.frontStream);

    this.rearStream = null;
    this.frontStream = null;

    detachStreamFromVideo(this.rearVideoRef);
    detachStreamFromVideo(this.frontVideoRef);
    detachStreamFromVideo(this.sequentialVideoRef);

    this.rearVideoRef = null;
    this.frontVideoRef = null;
    this.sequentialVideoRef = null;

    this._isInitialized = false;
  }

  /**
   * Restart the camera after capture (for retake flow).
   */
  async restart(rearVideoElement: HTMLVideoElement, frontVideoElement?: HTMLVideoElement): Promise<void> {
    this.cleanup();

    // Re-detect if cache was cleared
    if (!this.capabilities) {
      clearCapabilitiesCache();
      await this.initialize();
    } else {
      this._isInitialized = true;
    }

    await this.startRearCamera(rearVideoElement);

    if (frontVideoElement && this.mode === 'simultaneous') {
      await this.startFrontCamera(frontVideoElement);
    }
  }

  /**
   * Revoke an object URL created during composition.
   */
  static revokeObjectUrl(url: string): void {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
}

// Singleton for convenience (components can also create their own instances)
let _defaultManager: CameraManager | null = null;

export function getDefaultCameraManager(config?: Partial<CameraManagerConfig>): CameraManager {
  if (!_defaultManager) {
    _defaultManager = new CameraManager(config);
  }
  return _defaultManager;
}

export function resetDefaultCameraManager(): void {
  _defaultManager?.cleanup();
  _defaultManager = null;
}
