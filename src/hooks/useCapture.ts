// ============================================================
// useCapture — Capture flow state machine hook
// ============================================================

import { useState, useCallback, useRef } from 'react';
import type { CameraManager } from '../camera/CameraManager';
import type { CaptureState, CompositionResult, CameraError } from '../camera/types';
import { classifyCameraError } from '../camera/CameraFallback';

export interface UseCaptureReturn {
  /** Trigger capture — single shutter press */
  capture: () => Promise<void>;
  /** Current capture state */
  captureState: CaptureState;
  /** The captured/composited result */
  result: CompositionResult | null;
  /** Current phase description for UI */
  phaseLabel: string;
  /** Error during capture */
  error: CameraError | null;
  /** Clear the result and return to idle */
  reset: () => void;
  /** Whether capture is in progress */
  isCapturing: boolean;
}

const PHASE_LABELS: Record<string, string> = {
  idle: '',
  preparing: 'Preparing...',
  capturing: 'Capturing...',
  'capturing-rear': 'Capturing...',
  switching: 'Switching camera...',
  'switching-camera': 'Switching camera...',
  'capturing-front': 'Almost done...',
  processing: 'Processing...',
  compositing: 'Creating your photo...',
  preview: '',
  uploading: 'Uploading...',
  success: 'Posted!',
  error: 'Something went wrong',
};

export function useCapture(manager: CameraManager): UseCaptureReturn {
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [result, setResult] = useState<CompositionResult | null>(null);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [error, setError] = useState<CameraError | null>(null);
  const isCapturingRef = useRef(false);

  const capture = useCallback(async () => {
    // Prevent double-capture
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    setError(null);
    setCaptureState('preparing');
    setPhaseLabel(PHASE_LABELS.preparing);

    try {
      const compositionResult = await manager.capture((phase) => {
        const state = phase as CaptureState;
        setCaptureState(state);
        setPhaseLabel(PHASE_LABELS[phase] || '');
      });

      setResult(compositionResult);
      setCaptureState('preview');
      setPhaseLabel('');
    } catch (err) {
      const cameraError = err instanceof Object && 'type' in err
        ? err as CameraError
        : classifyCameraError(err);
      setError(cameraError);
      setCaptureState('error');
      setPhaseLabel(PHASE_LABELS.error);
    } finally {
      isCapturingRef.current = false;
    }
  }, [manager]);

  const reset = useCallback(() => {
    // Revoke previous result's object URL
    if (result?.objectUrl) {
      URL.revokeObjectURL(result.objectUrl);
    }
    setResult(null);
    setCaptureState('idle');
    setPhaseLabel('');
    setError(null);
  }, [result]);

  return {
    capture,
    captureState,
    result,
    phaseLabel,
    error,
    reset,
    isCapturing: captureState !== 'idle' && captureState !== 'preview' && captureState !== 'error',
  };
}
