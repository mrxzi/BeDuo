import React from 'react';
import type { CaptureState } from '../../camera/types';
import logoImg from '../../assets/logo.png';

interface ShutterButtonProps {
  onCapture: () => void;
  captureState: CaptureState;
  disabled?: boolean;
  isSequential?: boolean;
}

export const ShutterButton: React.FC<ShutterButtonProps> = ({
  onCapture,
  captureState,
  disabled = false,
}) => {
  const isCapturing = captureState !== 'idle' && captureState !== 'error' && captureState !== 'preview';

  const getStatusText = () => {
    const stateStr = captureState as string;
    switch (stateStr) {
      case 'preparing':
        return 'Readying...';
      case 'capturing':
      case 'capturing-rear':
        return 'Capturing Rear...';
      case 'switching':
      case 'switching-camera':
      case 'switching-facing':
        return 'Smile! Selfie next...';
      case 'capturing-front':
        return 'Capturing Selfie...';
      case 'processing':
      case 'compositing':
        return 'Compositing...';
      default:
        return null;
    }
  };

  const statusText = getStatusText();

  const handleClick = () => {
    if (disabled || isCapturing) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // ignore
      }
    }
    onCapture();
  };

  return (
    <div className="shutter-container">
      {/* Brand logo image positioned above the shutter button */}
      <div className="shutter-brand-badge">
        <img src={logoImg} alt="BeDuo" className="shutter-logo-img" />
        {statusText && <span className="shutter-status-text">{statusText}</span>}
      </div>

      <button
        type="button"
        className={`shutter-button ${isCapturing ? 'capturing' : ''}`}
        onClick={handleClick}
        disabled={disabled || isCapturing}
        aria-label="Take BeDuo dual camera photo"
        title="Tap to capture BeDuo photo"
      >
        <div className="shutter-inner">
          {isCapturing && <div className="shutter-spinner" />}
        </div>
      </button>
    </div>
  );
};
