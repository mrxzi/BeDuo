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
  const rearVideoRef = useRef<HTMLVideoElement>(null);
  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [currentLensIndex, setCurrentLensIndex] = useState(0);

  const {
    permissionState,
    capabilities,
    error: cameraError,
    mode,
    initialize,
    startRearCamera,
    startFrontCamera,
    manager,
    isLoading,
  } = useCamera();

  const { capture, captureState, result, error: captureError } = useCapture(manager);

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

  // Synchronously trigger and start both rear & front cameras
  const triggerCameras = useCallback(async () => {
    if (permissionState !== 'granted') return;

    try {
      if (rearVideoRef.current) {
        await startRearCamera(rearVideoRef.current, currentLensIndex);
      }
      // Small pause to allow hardware stream stabilization
      await new Promise((res) => setTimeout(res, 120));
      if (frontVideoRef.current) {
        await startFrontCamera(frontVideoRef.current);
      }
      rearVideoRef.current?.play().catch(() => {});
      frontVideoRef.current?.play().catch(() => {});
    } catch (e) {
      console.warn('[CameraView] Trigger sync error:', e);
    }
  }, [permissionState, currentLensIndex, startRearCamera, startFrontCamera]);

  // Initialize camera streams when permission granted
  useEffect(() => {
    if (permissionState === 'granted') {
      triggerCameras();
    }
  }, [permissionState, triggerCameras]);

  // Handle capture completion when result is available
  useEffect(() => {
    if (result) {
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
      if (rearVideoRef.current) {
        await startRearCamera(rearVideoRef.current, nextIndex);
      }
      await new Promise((res) => setTimeout(res, 120));
      if (frontVideoRef.current) {
        await startFrontCamera(frontVideoRef.current);
      }
      rearVideoRef.current?.play().catch(() => {});
      frontVideoRef.current?.play().catch(() => {});
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
        onSwapCameras={triggerCameras}
        onClose={onClose}
        onToggleDebug={() => setShowDebug(!showDebug)}
        rearLensCount={rearLensCount}
        currentLensIndex={currentLensIndex}
        onSwitchLens={handleSwitchLens}
      />

      {/* Main Fullscreen Rear Camera Preview with pinch-to-zoom */}
      <CameraPreview
        ref={rearVideoRef}
        zoom={zoom}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      />

      {/* Front Camera PiP Overlay — tap overlay to trigger/re-sync cameras */}
      <FrontCameraOverlay ref={frontVideoRef} onClick={triggerCameras} />

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
