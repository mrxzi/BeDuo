import React from 'react';
import { Zap, ZapOff, Clock, Camera, RefreshCw, Sliders, X } from 'lucide-react';
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
  mode,
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
  const getModeBadge = () => {
    switch (mode) {
      case 'simultaneous':
        return { label: 'DUAL LIVE', Icon: Zap };
      case 'sequential':
        return { label: 'DUO SEQUENTIAL', Icon: Clock };
      case 'rear-only':
        return { label: 'SINGLE CAM', Icon: Camera };
      default:
        return { label: 'CAMERA', Icon: Camera };
    }
  };

  const badge = getModeBadge();
  const BadgeIcon = badge.Icon;

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

      <div className="camera-mode-badge">
        <BadgeIcon size={14} className="badge-icon" />
        <span className="badge-label">{badge.label}</span>
      </div>

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

        {onSwapCameras && (
          <button
            type="button"
            className="camera-icon-button"
            onClick={onSwapCameras}
            aria-label="Swap main camera view"
            title="Swap view"
          >
            <RefreshCw size={18} />
          </button>
        )}

        {showDebugToggle && onToggleDebug && (
          <button
            type="button"
            className="camera-icon-button"
            onClick={onToggleDebug}
            aria-label="Camera diagnostics"
            title="Diagnostics"
          >
            <Sliders size={18} />
          </button>
        )}
      </div>
    </header>
  );
};
