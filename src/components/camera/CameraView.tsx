import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Sliders, X } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useCapture } from '../../hooks/useCapture';
import { useZoom } from '../../hooks/useZoom';
import { CameraPreview } from './CameraPreview';
import { FrontCameraOverlay } from './FrontCameraOverlay';
import { ShutterButton } from './ShutterButton';
import { CameraStatusBar } from './CameraStatusBar';
import { CaptureAnimation } from './CaptureAnimation';
import { CameraPermissionScreen } from './CameraPermissionScreen';
import type { DualCaptureResult, FlashMode } from '../../camera/types';
import './camera.css';

interface CameraViewProps {
  onCaptureComplete: (result: DualCaptureResult) => void;
  onClose?: () => void;
}

/**
 * Synthesizes a crisp camera shutter sound using Web Audio API.
 */
function playShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
    whiteNoise.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Audio Context blocked or unavailable
  }
}


export const CameraView: React.FC<CameraViewProps> = ({ onCaptureComplete, onClose }) => {
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [currentLensIndex, setCurrentLensIndex] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);

  const {
    permissionState,
    capabilities,
    error: cameraError,
    mode,
    initialize,
    startStreams,
    manager,
    isLoading,
  } = useCamera();

  const { capture, captureState, result, error: captureError } = useCapture(manager);

  const handleToggleSwap = useCallback((targetSwapped?: boolean) => {
    const nextSwapped = targetSwapped !== undefined ? targetSwapped : !isSwapped;
    setIsSwapped(nextSwapped);
    manager.setIsSwapped(nextSwapped);
  }, [isSwapped, manager]);

  const handleOverlayClick = useCallback(() => {
    // Tapping small overlay opens the camera currently in the inset box as the main view
    handleToggleSwap(!isSwapped);
  }, [isSwapped, handleToggleSwap]);

  const handleMainClick = useCallback(() => {
    // Tapping big main preview switches back to rear camera if front camera is currently active
    if (isSwapped) {
      handleToggleSwap(false);
    }
  }, [isSwapped, handleToggleSwap]);

  // Zoom hook: syncs with manager and applies both native + digital zoom
  const handleZoomChange = useCallback(
    async (zoom: number) => {
      await manager.setRearZoom(zoom);
    },
    [manager]
  );

  const { zoom, setZoom, onTouchStart, onTouchMove, onTouchEnd } = useZoom(handleZoomChange);

  // Initialize camera system on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Synchronously trigger and start both rear & front cameras using startStreams
  const triggerCameras = useCallback(async () => {
    if (permissionState !== 'granted') return;
    if (!mainVideoRef.current) return;

    try {
      await startStreams(mainVideoRef.current, overlayVideoRef.current, isSwapped, currentLensIndex);
    } catch (e) {
      console.warn('[CameraView] Trigger sync error:', e);
    }
  }, [permissionState, currentLensIndex, isSwapped, startStreams]);

  // Initialize camera streams when permission granted or swapped state changes
  useEffect(() => {
    if (permissionState === 'granted') {
      triggerCameras();
    }
  }, [permissionState, isSwapped, triggerCameras]);

  const handledCaptureRef = useRef(false);

  // Handle capture completion when result is available
  useEffect(() => {
    if (result && !handledCaptureRef.current) {
      handledCaptureRef.current = true;
      const dualResult: DualCaptureResult = {
        ...result,
        compositedDataUrl: result.objectUrl,
        isSimultaneous: mode === 'simultaneous',
      };
      onCaptureComplete(dualResult);
    }
  }, [result, mode, onCaptureComplete]);

  const handleCaptureClick = useCallback(() => {
    playShutterSound();
    capture();
  }, [capture]);

  const toggleFlash = () => {
    setFlashMode((prev) => (prev === 'off' ? 'on' : 'off'));
  };

  const rearLensCount = capabilities?.rearDevices.length || 1;

  const handleSwitchLens = async () => {
    if (rearLensCount <= 1) return;
    const nextIndex = (currentLensIndex + 1) % rearLensCount;
    setCurrentLensIndex(nextIndex);
    setZoom(1.0);

    try {
      if (mainVideoRef.current) {
        await startStreams(mainVideoRef.current, overlayVideoRef.current, isSwapped, nextIndex);
      }
    } catch (e) {
      console.warn('[CameraView] Switch lens error:', e);
    }
  };

  if (permissionState !== 'granted') {
    return (
      <CameraPermissionScreen
        permissionState={permissionState}
        error={cameraError}
        onRequestPermission={initialize}
        onClose={onClose}
        isLoading={isLoading}
      />
    );
  }

  const activeError = cameraError || captureError;

  return (
    <div className="camera-view-container">
      {/* Top Header */}
      <CameraStatusBar
        mode={mode}
        flashMode={flashMode}
        hasFlash={capabilities?.hasFlash ?? false}
        onToggleFlash={toggleFlash}
        onSwapCameras={handleOverlayClick}
        onClose={onClose}
        onToggleDebug={() => setShowDebug(!showDebug)}
        rearLensCount={rearLensCount}
        currentLensIndex={currentLensIndex}
        onSwitchLens={handleSwitchLens}
      />

      {/* Main Fullscreen Camera Preview (Rear by default, Front when swapped) */}
      <CameraPreview
        ref={mainVideoRef}
        zoom={isSwapped ? 1 : zoom}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleMainClick}
      />

      {/* Camera PiP Overlay (Front by default, Rear when swapped) */}
      <FrontCameraOverlay
        ref={overlayVideoRef}
        onClick={handleOverlayClick}
      />

      {/* Flash & State Transition Animations */}
      <CaptureAnimation captureState={captureState} />

      {/* Active error banner */}
      {activeError && (
        <div className="camera-error-banner">
          <AlertTriangle size={16} color="#ef4444" />
          <span>{activeError.userMessage}</span>
        </div>
      )}

      {/* Bottom Control Bar */}
      <footer className="camera-controls-bar">
        <ShutterButton
          onCapture={handleCaptureClick}
          captureState={captureState}
          disabled={!!activeError && permissionState !== 'granted'}
          isSequential={mode === 'sequential'}
        />
      </footer>

      {/* Diagnostics Modal overlay */}
      {showDebug && capabilities && (
        <div className="debug-modal-backdrop" onClick={() => setShowDebug(false)}>
          <div className="debug-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} color="#ccff00" />
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Diagnostics</h3>
              </div>
              <button type="button" onClick={() => setShowDebug(false)}>
                <X size={18} />
              </button>
            </div>
            <pre>{JSON.stringify(capabilities, null, 2)}</pre>
            <div className="debug-row">
              <strong>Active Mode:</strong> {mode}
            </div>
            <div className="debug-row">
              <strong>Permission:</strong> {permissionState}
            </div>
            <div className="debug-row">
              <strong>Zoom:</strong> {zoom.toFixed(1)}×
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
