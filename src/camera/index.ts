// Camera module barrel export
export { CameraManager, getDefaultCameraManager, resetDefaultCameraManager } from './CameraManager';
export { detectCameraCapabilities, clearCapabilitiesCache } from './CameraCapabilities';
export { openStream, stopStream, attachStreamToVideo, detachStreamFromVideo } from './CameraSession';
export { captureFrame, waitForVideoReady } from './CameraCapture';
export { performSequentialCapture } from './SequentialCapture';
export { composeImage, composeSingleImage } from './ImageComposer';
export { classifyCameraError, checkCameraApiSupport, getErrorIcon } from './CameraFallback';
export * from './types';
