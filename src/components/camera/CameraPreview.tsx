import { forwardRef } from 'react';

interface CameraPreviewProps {
  className?: string;
  zoom?: number;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
}

/**
 * Rear camera fullscreen preview video element.
 * Supports digital zoom via CSS scale transform.
 */
export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  function CameraPreview(
    { className = '', zoom = 1, onTouchStart, onTouchMove, onTouchEnd },
    ref
  ) {
    return (
      <div
        className={`camera-preview ${className}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        // allow gesture tracking without scroll interference
        style={{ touchAction: 'none', overflow: 'hidden' }}
      >
        <video
          ref={ref}
          className="camera-preview__video"
          autoPlay
          playsInline
          muted
          aria-label="Rear camera preview"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: zoom === 1 ? 'none' : 'transform 0.05s linear',
          }}
        />
      </div>
    );
  }
);
