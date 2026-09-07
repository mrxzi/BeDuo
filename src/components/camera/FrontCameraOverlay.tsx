import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';
import type { CameraOverlayPosition } from '../../camera/types';

interface FrontCameraOverlayProps {
  position?: CameraOverlayPosition;
}

/**
 * Front camera PiP overlay with rounded corners, border, and shadow.
 * Defaults to top-left position per design specification.
 *
 * Tracks actual stream playing state via 'playing'/'emptied' events
 * so it works correctly on both iOS (sequential) and Android (simultaneous).
 */
export const FrontCameraOverlay = forwardRef<HTMLVideoElement, FrontCameraOverlayProps>(
  function FrontCameraOverlay({ position = 'top-left' }, ref) {
    const [isPlaying, setIsPlaying] = useState(false);
    const internalRef = useRef<HTMLVideoElement | null>(null);

    // Stable ref callback that assigns to both internal ref and forwarded ref
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

    // Track actual playback state via video events
    useEffect(() => {
      const video = internalRef.current;
      if (!video) return;

      const onPlaying = () => setIsPlaying(true);
      const onStopped = () => setIsPlaying(false);

      video.addEventListener('playing', onPlaying);
      video.addEventListener('pause', onStopped);
      video.addEventListener('ended', onStopped);
      video.addEventListener('emptied', onStopped);

      // Sync immediately in case the stream was already attached before mount
      if (video.readyState >= 3 && !video.paused) {
        setIsPlaying(true);
      }

      return () => {
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('pause', onStopped);
        video.removeEventListener('ended', onStopped);
        video.removeEventListener('emptied', onStopped);
      };
    });  // No dependency array → re-runs each render so it always has the current element

    const showPlaceholder = !isPlaying;

    return (
      <div
        className={`front-camera-overlay front-camera-overlay--${position}`}
        aria-label="Front camera preview"
      >
        {showPlaceholder && (
          <div className="front-camera-overlay__placeholder">
            <Camera size={18} color="#a1a1aa" />
          </div>
        )}
        <video
          ref={setRef}
          className="front-camera-overlay__video"
          autoPlay
          playsInline
          muted
          style={{ display: showPlaceholder ? 'none' : 'block' }}
          aria-label="Front camera video feed"
        />
      </div>
    );
  }
);
