import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';
import type { CameraOverlayPosition } from '../../camera/types';

interface FrontCameraOverlayProps {
  position?: CameraOverlayPosition;
  isSwapped?: boolean;
  onClick?: () => void;
}

/**
 * Front camera PiP overlay with rounded corners, border, and shadow.
 * Tracks actual stream playing state via 'playing'/'emptied' events.
 */
export const FrontCameraOverlay = forwardRef<HTMLVideoElement, FrontCameraOverlayProps>(
  function FrontCameraOverlay({ position = 'top-left', isSwapped = false, onClick }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const internalRef = useRef<HTMLVideoElement | null>(null);

    const setRef = useCallback(
      (el: HTMLVideoElement | null) => {
        internalRef.current = el;
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLVideoElement | null>).current = el;
        }
      },
      [ref]
    );

    useEffect(() => {
      const video = internalRef.current;
      if (!video) return;

      const onPlaying = () => setIsPlaying(true);
      const onStopped = () => setIsPlaying(false);

      video.addEventListener('playing', onPlaying);
      video.addEventListener('pause', onStopped);
      video.addEventListener('ended', onStopped);
      video.addEventListener('emptied', onStopped);

      if (video.readyState >= 3 && !video.paused) {
        setIsPlaying(true);
      }

      return () => {
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('pause', onStopped);
        video.removeEventListener('ended', onStopped);
        video.removeEventListener('emptied', onStopped);
      };
    });

    const showPlaceholder = !isPlaying;

    return (
      <div
        className={`front-camera-overlay front-camera-overlay--${position}`}
        onClick={onClick}
        title="Tap to swap camera views"
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        aria-label="Front camera preview"
      >
        {showPlaceholder && (
          <div className="front-camera-overlay__placeholder">
            <Camera size={22} color="#ffffff" style={{ marginBottom: 4 }} />
            <span style={{ fontWeight: 700, fontSize: '0.68rem', color: '#ffffff', letterSpacing: '0.04em' }}>SELFIE SNAP</span>
            <span style={{ fontSize: '0.58rem', color: '#a1a1aa', marginTop: 2 }}>Auto Dual Capture</span>
          </div>
        )}
        <video
          ref={setRef}
          className="front-camera-overlay__video"
          autoPlay
          playsInline
          muted
          style={{
            display: showPlaceholder ? 'none' : 'block',
            transform: isSwapped ? 'none' : 'scaleX(-1)',
          }}
          aria-label="Front camera video feed"
        />
      </div>
    );
  }
);
