import { forwardRef } from 'react';
import { Camera } from 'lucide-react';
import type { CameraOverlayPosition, CameraMode } from '../../camera/types';

interface FrontCameraOverlayProps {
  position?: CameraOverlayPosition;
  mode: CameraMode;
  isActive: boolean;
}

/**
 * Front camera PiP overlay with rounded corners, border, and shadow.
 * Defaults to top-left position per design specification.
 */
export const FrontCameraOverlay = forwardRef<HTMLVideoElement, FrontCameraOverlayProps>(
  function FrontCameraOverlay({ position = 'top-left', mode, isActive }, ref) {
    const showPlaceholder = mode === 'sequential' || !isActive;

    return (
      <div
        className={`front-camera-overlay front-camera-overlay--${position}`}
        aria-label="Front camera preview"
      >
        {showPlaceholder ? (
          <div className="front-camera-overlay__placeholder">
            <Camera size={18} color="#a1a1aa" />
          </div>
        ) : null}
        <video
          ref={ref}
          className="front-camera-overlay__video"
          autoPlay
          playsInline
          muted
          style={{
            display: showPlaceholder ? 'none' : 'block',
          }}
          aria-label="Front camera video feed"
        />
      </div>
    );
  }
);
