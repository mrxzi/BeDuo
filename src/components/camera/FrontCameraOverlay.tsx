import { forwardRef } from 'react';
import type { CameraOverlayPosition } from '../../camera/types';

interface FrontCameraOverlayProps {
  position?: CameraOverlayPosition;
  onClick?: () => void;
}

/**
 * Front camera PiP overlay displaying live stream preview.
 */
export const FrontCameraOverlay = forwardRef<HTMLVideoElement, FrontCameraOverlayProps>(
  function FrontCameraOverlay({ position = 'top-left', onClick }, ref) {
    return (
      <div
        className={`front-camera-overlay front-camera-overlay--${position}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        aria-label="Front camera preview"
      >
        <video
          ref={ref}
          className="front-camera-overlay__video"
          autoPlay
          playsInline
          muted
          aria-label="Front camera video feed"
        />
      </div>
    );
  }
);
