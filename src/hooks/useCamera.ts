// ============================================================
// useCamera — React hook wrapping CameraManager lifecycle
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { CameraManager } from '../camera/CameraManager';
import type {
  CameraCapabilities,
  CameraMode,
  CameraError,
  PermissionState,
  CameraDebugInfo,
} from '../camera/types';

export interface UseCameraReturn {
  /** Initialize camera system — must be called after user gesture */
  initialize: () => Promise<void>;
  /** Start rear camera on the given video element (optional lensIndex for wide/ultra-wide) */
  startRearCamera: (video: HTMLVideoElement, lensIndex?: number) => Promise<void>;
  /** Start front camera on the given video element (simultaneous mode only) */
  startFrontCamera: (video: HTMLVideoElement) => Promise<void>;
  /** Start main and overlay streams with explicit facing assignment */
  startStreams: (mainVideo: HTMLVideoElement, overlayVideo: HTMLVideoElement | null, isSwapped?: boolean, lensIndex?: number) => Promise<void>;
  /** Set the hidden video element for sequential capture */
  setSequentialVideoRef: (video: HTMLVideoElement) => void;
  /** Clean up all camera resources */
  cleanup: () => void;
  /** Restart camera after capture */
  restart: (rearVideo: HTMLVideoElement, frontVideo?: HTMLVideoElement) => Promise<void>;
  /** The CameraManager instance */
  manager: CameraManager;
  /** Detected capabilities */
  capabilities: CameraCapabilities | null;
  /** Current camera mode */
  mode: CameraMode;
  /** Permission state */
  permissionState: PermissionState;
  /** Last error */
  error: CameraError | null;
  /** Whether camera is initialized and ready */
  isReady: boolean;
  /** Whether initialization is in progress */
  isLoading: boolean;
  /** Debug info */
  debugInfo: CameraDebugInfo | null;
}

export function useCamera(): UseCameraReturn {
  const managerRef = useRef<CameraManager>(new CameraManager());
  const [capabilities, setCapabilities] = useState<CameraCapabilities | null>(null);
  const [mode, setMode] = useState<CameraMode>('unsupported');
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [error, setError] = useState<CameraError | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<CameraDebugInfo | null>(null);

  const manager = managerRef.current;

  const updateDebugInfo = useCallback(() => {
    setDebugInfo(manager.getDebugInfo());
  }, [manager]);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const caps = await manager.initialize();
      setCapabilities(caps);
      setMode(manager.getMode());
      setPermissionState('granted');
      setIsReady(true);
      updateDebugInfo();
    } catch (err) {
      const cameraErr = err as CameraError;
      setError(cameraErr);
      setPermissionState(manager.getPermissionState());
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  }, [manager, updateDebugInfo]);

  const startRearCamera = useCallback(async (video: HTMLVideoElement, lensIndex = 0) => {
    try {
      await manager.startRearCamera(video, lensIndex);
      setMode(manager.getMode());
      updateDebugInfo();
    } catch (err) {
      setError(err as CameraError);
    }
  }, [manager, updateDebugInfo]);

  const startFrontCamera = useCallback(async (video: HTMLVideoElement) => {
    try {
      await manager.startFrontCamera(video);
      setMode(manager.getMode());
      updateDebugInfo();
    } catch (err) {
      setError(err as CameraError);
    }
  }, [manager, updateDebugInfo]);

  const startStreams = useCallback(async (mainVideo: HTMLVideoElement, overlayVideo: HTMLVideoElement | null, isSwapped = false, lensIndex = 0) => {
    try {
      await manager.startStreams(mainVideo, overlayVideo, isSwapped, lensIndex);
      setMode(manager.getMode());
      updateDebugInfo();
    } catch (err) {
      setError(err as CameraError);
    }
  }, [manager, updateDebugInfo]);

  const setSequentialVideoRef = useCallback((video: HTMLVideoElement) => {
    manager.setSequentialVideoRef(video);
  }, [manager]);

  const cleanup = useCallback(() => {
    manager.cleanup();
    setIsReady(false);
    updateDebugInfo();
  }, [manager, updateDebugInfo]);

  const restart = useCallback(async (rearVideo: HTMLVideoElement, frontVideo?: HTMLVideoElement) => {
    setError(null);
    try {
      await manager.restart(rearVideo, frontVideo);
      setMode(manager.getMode());
      setIsReady(true);
      updateDebugInfo();
    } catch (err) {
      setError(err as CameraError);
    }
  }, [manager, updateDebugInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      managerRef.current.cleanup();
    };
  }, []);

  // Handle page visibility change — stop camera when hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Don't fully cleanup, just note it
        // Some browsers pause streams automatically
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    initialize,
    startRearCamera,
    startFrontCamera,
    startStreams,
    setSequentialVideoRef,
    cleanup,
    restart,
    manager,
    capabilities,
    mode,
    permissionState,
    error,
    isReady,
    isLoading,
    debugInfo,
  };
}
