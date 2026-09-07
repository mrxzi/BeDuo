// ============================================================
// Camera System Type Definitions
// ============================================================

/** Camera facing direction */
export type CameraFacing = 'user' | 'environment';

/** Detected camera mode based on capability probing */
export type CameraMode = 'simultaneous' | 'sequential' | 'rear-only' | 'front-only' | 'unsupported';

/** Flash mode setting */
export type FlashMode = 'off' | 'on' | 'auto';

/** Camera overlay position for front camera PiP */
export type CameraOverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** Capture state machine */
export type CaptureState =
  | 'idle'
  | 'preparing'
  | 'capturing'
  | 'capturing-rear'
  | 'switching-facing'
  | 'capturing-front'
  | 'compositing'
  | 'switching-camera'
  | 'processing'
  | 'preview'
  | 'uploading'
  | 'success'
  | 'error';

/** Permission state */
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

/** Camera device info after classification */
export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
  facing: CameraFacing | 'unknown';
  groupId: string;
}

/** Capability detection result */
export interface CameraCapabilities {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasRearCamera: boolean;
  hasFlash?: boolean;
  supportsSimultaneousStreams: boolean;
  supportsFacingMode: boolean;
  isMobile: boolean;
  frontDevices: CameraDeviceInfo[];
  rearDevices: CameraDeviceInfo[];
  allDevices: CameraDeviceInfo[];
  detectedMode: CameraMode;
  recommendedMode?: CameraMode;
}

/** Active camera session state */
export interface CameraSessionState {
  rearStream: MediaStream | null;
  frontStream: MediaStream | null;
  isRearActive: boolean;
  isFrontActive: boolean;
  mode: CameraMode;
}

/** Captured frame data */
export interface CapturedFrame {
  blob: Blob;
  width: number;
  height: number;
  timestamp: number;
  facing: CameraFacing;
}

/** Image composition configuration */
export interface CompositionConfig {
  outputWidth: number;
  outputHeight: number;
  frontOverlayPosition: CameraOverlayPosition;
  frontOverlaySizeRatio: number; // e.g. 0.28 = 28% of output width
  frontOverlayMargin: number; // px
  frontOverlayBorderRadius: number; // px
  frontOverlayBorderWidth: number; // px
  frontOverlayBorderColor: string;
  mirrorFrontCapture: boolean;
  quality: number; // 0-1
  format: 'image/webp' | 'image/jpeg';
}

/** Composition result */
export interface CompositionResult {
  blob: Blob;
  objectUrl: string;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

/** Dual capture result for preview and saving */
export interface DualCaptureResult extends CompositionResult {
  compositedDataUrl: string;
  isSimultaneous?: boolean;
}

/** Camera error types */
export type CameraErrorType =
  | 'permission-denied'
  | 'permission-dismissed'
  | 'no-camera'
  | 'no-front-camera'
  | 'no-rear-camera'
  | 'camera-in-use'
  | 'insecure-context'
  | 'api-not-supported'
  | 'stream-init-failed'
  | 'track-failed'
  | 'video-timeout'
  | 'switch-failed'
  | 'simultaneous-failed'
  | 'composition-failed'
  | 'unknown';

/** Structured camera error */
export interface CameraError {
  type: CameraErrorType;
  message: string;
  userMessage: string;
  recoverable: boolean;
  originalError?: unknown;
}

/** Camera manager configuration */
export interface CameraManagerConfig {
  mirrorFrontPreview: boolean;
  mirrorFrontCapture: boolean;
  composition: CompositionConfig;
  videoReadinessTimeoutMs: number;
  debugMode: boolean;
  rearZoomLevel?: number;
}

/** Debug info for development panel */
export interface CameraDebugInfo {
  cameraCount: number;
  frontCameraDetected: boolean;
  rearCameraDetected: boolean;
  simultaneousMode: boolean;
  sequentialMode: boolean;
  permissionState: PermissionState;
  rearVideoDimensions: { width: number; height: number } | null;
  frontVideoDimensions: { width: number; height: number } | null;
  captureStartTime: number | null;
  captureDuration: number | null;
  lastError: CameraError | null;
}

/** Default composition config */
export const DEFAULT_COMPOSITION_CONFIG: CompositionConfig = {
  outputWidth: 1080,
  outputHeight: 1920,
  frontOverlayPosition: 'top-left',
  frontOverlaySizeRatio: 0.32,
  frontOverlayMargin: 24,
  frontOverlayBorderRadius: 10,
  frontOverlayBorderWidth: 2,
  frontOverlayBorderColor: '#000000',
  mirrorFrontCapture: true,
  quality: 0.85,
  format: 'image/webp',
};

/** Default camera manager config */
export const DEFAULT_CAMERA_CONFIG: CameraManagerConfig = {
  mirrorFrontPreview: true,
  mirrorFrontCapture: true,
  composition: DEFAULT_COMPOSITION_CONFIG,
  videoReadinessTimeoutMs: 5000,
  debugMode: import.meta.env.VITE_CAMERA_DEBUG === 'true',
};
