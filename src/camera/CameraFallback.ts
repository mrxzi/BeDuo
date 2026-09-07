// ============================================================
// CameraFallback — Error classification and user-friendly messaging
// ============================================================

import type { CameraError, CameraErrorType } from './types';

/**
 * Classify a raw error into a structured CameraError.
 */
export function classifyCameraError(err: unknown): CameraError {
  if (err instanceof DOMException) {
    return classifyDOMException(err);
  }

  if (err instanceof Error) {
    return classifyGenericError(err);
  }

  return {
    type: 'unknown',
    message: String(err),
    userMessage: 'Something went wrong with the camera. Please try again.',
    recoverable: true,
    originalError: err,
  };
}

function classifyDOMException(err: DOMException): CameraError {
  switch (err.name) {
    case 'NotAllowedError':
      return {
        type: 'permission-denied',
        message: err.message,
        userMessage: 'Camera access was denied. Please allow camera access in your browser settings and try again.',
        recoverable: true,
        originalError: err,
      };

    case 'NotFoundError':
      return {
        type: 'no-camera',
        message: err.message,
        userMessage: 'No camera was found on this device.',
        recoverable: false,
        originalError: err,
      };

    case 'NotReadableError':
    case 'AbortError':
      return {
        type: 'camera-in-use',
        message: err.message,
        userMessage: 'The camera is being used by another application. Please close other apps using the camera and try again.',
        recoverable: true,
        originalError: err,
      };

    case 'OverconstrainedError':
      return {
        type: 'stream-init-failed',
        message: err.message,
        userMessage: 'Could not open the camera with the requested settings. Please try again.',
        recoverable: true,
        originalError: err,
      };

    case 'SecurityError':
      return {
        type: 'insecure-context',
        message: err.message,
        userMessage: 'Camera access requires a secure connection (HTTPS). Please access this site via HTTPS.',
        recoverable: false,
        originalError: err,
      };

    default:
      return {
        type: 'unknown',
        message: err.message,
        userMessage: 'An unexpected camera error occurred. Please try again.',
        recoverable: true,
        originalError: err,
      };
  }
}

function classifyGenericError(err: Error): CameraError {
  const msg = err.message.toLowerCase();

  if (msg.includes('permission') || msg.includes('denied')) {
    return {
      type: 'permission-denied',
      message: err.message,
      userMessage: 'Camera access was denied. Please allow camera access in your browser settings.',
      recoverable: true,
      originalError: err,
    };
  }

  if (msg.includes('timeout') || msg.includes('readiness')) {
    return {
      type: 'video-timeout',
      message: err.message,
      userMessage: 'The camera took too long to respond. Please try again.',
      recoverable: true,
      originalError: err,
    };
  }

  if (msg.includes('switch') || msg.includes('front camera')) {
    return {
      type: 'switch-failed',
      message: err.message,
      userMessage: 'Failed to switch cameras. Please try again.',
      recoverable: true,
      originalError: err,
    };
  }

  if (msg.includes('composition') || msg.includes('canvas') || msg.includes('blob')) {
    return {
      type: 'composition-failed',
      message: err.message,
      userMessage: 'Failed to process the photo. Please try again.',
      recoverable: true,
      originalError: err,
    };
  }

  return {
    type: 'unknown',
    message: err.message,
    userMessage: 'Something went wrong. Please try again.',
    recoverable: true,
    originalError: err,
  };
}

/**
 * Check if the browser supports camera APIs at all.
 */
export function checkCameraApiSupport(): CameraError | null {
  if (typeof window === 'undefined') {
    return {
      type: 'api-not-supported',
      message: 'Window is not available',
      userMessage: 'Camera is not supported in this environment.',
      recoverable: false,
    };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    // Check if it's an insecure context issue
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      return {
        type: 'insecure-context',
        message: 'getUserMedia requires HTTPS',
        userMessage: 'Camera access requires a secure connection (HTTPS). Please access this site via HTTPS.',
        recoverable: false,
      };
    }

    return {
      type: 'api-not-supported',
      message: 'getUserMedia is not supported',
      userMessage: 'Your browser does not support camera access. Please try a modern browser like Chrome or Safari.',
      recoverable: false,
    };
  }

  return null; // All good
}

/**
 * Get an icon suggestion for an error type (for UI).
 */
export function getErrorIcon(type: CameraErrorType): string {
  switch (type) {
    case 'permission-denied':
    case 'permission-dismissed':
      return '🔒';
    case 'no-camera':
    case 'no-front-camera':
    case 'no-rear-camera':
      return '📷';
    case 'camera-in-use':
      return '⚠️';
    case 'insecure-context':
      return '🔐';
    case 'api-not-supported':
      return '🌐';
    default:
      return '❌';
  }
}
