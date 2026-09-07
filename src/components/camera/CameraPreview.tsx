import { forwardRef } from 'react';

interface CameraPreviewProps {
  className?: string;
}

/**
 * Rear camera fullscreen preview video element.
 * Uses forwardRef so the parent can attach the stream.
 */
export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  function CameraPreview({ className = '' }, ref) {
    return (
      <div className={`camera-preview ${className}`}>
        <video
          ref={ref}
          className="camera-preview__video"
          autoPlay
          playsInline
          muted
          aria-label="Rear camera preview"
        />
      </div>
    );
  }
);
