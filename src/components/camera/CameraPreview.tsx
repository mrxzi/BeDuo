import { forwardRef } from 'react';

interface CameraPreviewProps {
  className?: string;
  zoom?: number;
  isSwapped?: boolean;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onClick?: () => void;
}

/**
 * Main camera fullscreen preview video element.
 * Supports digital zoom and selfie mirror transform.
 */
export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  function CameraPreview(
    { className = '', zoom = 1, isSwapped = false, onTouchStart, onTouchMove, onTouchEnd, onClick },
    ref
  ) {
    return (
      <div
        className={`camera-preview ${className}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
        // allow gesture tracking without scroll interference
        style={{ touchAction: 'none', overflow: 'hidden' }}
      >
        <video
          ref={ref}
          className="camera-preview__video"
          autoPlay
          playsInline
          muted
          aria-label="Main camera preview"
          style={{
            transform: `scale(${zoom}) ${isSwapped ? 'scaleX(-1)' : ''}`,
            transformOrigin: 'center center',
            transition: zoom === 1 ? 'none' : 'transform 0.05s linear',
          }}
        />
      </div>
    );
  }
);
