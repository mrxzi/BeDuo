import React from 'react';
import { Zap, ZapOff, X } from 'lucide-react';
import type { CameraMode, FlashMode } from '../../camera/types';

interface CameraStatusBarProps {
  mode: CameraMode;
  flashMode: FlashMode;
  hasFlash: boolean;
  onToggleFlash: () => void;
  onSwapCameras?: () => void;
  onClose?: () => void;
  onToggleDebug?: () => void;
  showDebugToggle?: boolean;
  rearLensCount?: number;
  currentLensIndex?: number;
  onSwitchLens?: () => void;
}

export const CameraStatusBar: React.FC<CameraStatusBarProps> = ({
  flashMode,
  hasFlash,
  onToggleFlash,
  onSwapCameras,
  onClose,
  onToggleDebug,
  showDebugToggle = true,
  rearLensCount = 1,
  currentLensIndex = 0,
  onSwitchLens,
}) => {


  return (
    <header className="camera-status-bar">
      {onClose && (
        <button
          type="button"
          className="camera-icon-button"
          onClick={onClose}
          aria-label="Close camera"
        >
          <X size={20} />
        </button>
      )}


      <div className="camera-status-actions">
        {/* iPhone Lens switch button (0.5x / 1x Wide lens) */}
        {rearLensCount > 1 && onSwitchLens && (
          <button
            type="button"
            className="camera-icon-button lens-toggle-btn"
            onClick={onSwitchLens}
            aria-label="Switch camera lens"
            title="Switch Wide Lens"
            style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--color-accent)' }}
          >
            {currentLensIndex === 0 ? '1x' : '0.5x'}
          </button>
        )}

        {hasFlash && (
          <button
            type="button"
            className={`camera-icon-button ${flashMode !== 'off' ? 'active' : ''}`}
            onClick={onToggleFlash}
            aria-label={`Toggle flash (${flashMode})`}
          >
            {flashMode === 'off' ? <ZapOff size={18} /> : <Zap size={18} />}
          </button>
        )}


      </div>
    </header>
  );
};
