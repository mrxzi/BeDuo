import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Sliders, X } from 'lucide-react';
import { useCamera } from '../../hooks/useCamera';
import { useCapture } from '../../hooks/useCapture';
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

  // Initialize camera system on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Attach rear video when element & capability ready
  useEffect(() => {
    if (rearVideoRef.current && permissionState === 'granted') {
      startRearCamera(rearVideoRef.current, currentLensIndex);
    }
  }, [permissionState, startRearCamera, currentLensIndex]);

  // Attach front video when in simultaneous mode
  useEffect(() => {
    if (frontVideoRef.current && mode === 'simultaneous' && permissionState === 'granted') {
      startFrontCamera(frontVideoRef.current);
    }
  }, [mode, permissionState, startFrontCamera]);

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

  const handleSwitchLens = () => {
    if (rearLensCount <= 1) return;
    const nextIndex = (currentLensIndex + 1) % rearLensCount;
    setCurrentLensIndex(nextIndex);
    if (rearVideoRef.current) {
      startRearCamera(rearVideoRef.current, nextIndex);
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
        onClose={onClose}
        onToggleDebug={() => setShowDebug(!showDebug)}
        rearLensCount={rearLensCount}
        currentLensIndex={currentLensIndex}
        onSwitchLens={handleSwitchLens}
      />

      {/* Main Fullscreen Rear Camera Preview */}
      <CameraPreview ref={rearVideoRef} />

      {/* Front Camera PiP Overlay */}
      <FrontCameraOverlay
        ref={frontVideoRef}
        mode={mode}
        isActive={mode === 'simultaneous'}
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
          </div>
        </div>
      )}
    </div>
  );
};
