import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Send } from 'lucide-react';
import type { DualCaptureResult } from '../camera/types';
import { PostService } from '../services/posts';

interface PreviewPageProps {
  captureResult: DualCaptureResult | null;
  onClearCapture: () => void;
}

/** Simple geolocation city resolver — works offline gracefully */
function useLocationLabel() {
  const [label, setLabel] = useState<string>('My Location');

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Reverse-geocode via nominatim (free, no key required)
        const { latitude, longitude } = pos.coords;
        fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'Accept-Language': 'en' } }
        )
          .then((r) => r.json())
          .then((data) => {
            const city =
              data?.address?.city ||
              data?.address?.town ||
              data?.address?.village ||
              data?.address?.county ||
              'My Location';
            const country = data?.address?.country_code?.toUpperCase() || '';
            setLabel(country ? `${city}, ${country}` : city);
          })
          .catch(() => {
            setLabel('My Location');
          });
      },
      () => {
        setLabel('My Location');
      },
      { timeout: 5000 }
    );
  }, []);

  return label;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({
  captureResult,
  onClearCapture,
}) => {
  const navigate = useNavigate();
  const [isPosting, setIsPosting] = useState(false);
  const locationLabel = useLocationLabel();

  if (!captureResult) {
    return (
      <div className="page-container preview-empty" style={{ background: '#000000' }}>
        <h2>No photo captured yet</h2>
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate('/camera')}
        >
          Open Camera
        </button>
      </div>
    );
  }

  const handlePost = async () => {
    if (isPosting) return;
    setIsPosting(true);
    try {
      PostService.addPost({
        imageUrl: captureResult.compositedDataUrl,
        caption: '',
        location: locationLabel,
      });
      onClearCapture();
      navigate('/');
    } catch (e) {
      console.error('Failed to post', e);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="preview-page-container">
      {/* Top Header with Logo in Center */}
      <header className="preview-header-logo-only">
        <img
          src="/logo.png"
          alt="BeDuo Logo"
          className="preview-top-logo"
        />
      </header>

      {/* Main Image Display */}
      <div className="preview-image-wrapper">
        <img
          src={captureResult.compositedDataUrl}
          alt="Composited BeDuo moment"
          className="preview-composited-image"
        />

        {/* Center Info Overlay: Location + My Friends — centered, slightly below middle */}
        <div className="preview-center-info">
          <div className="preview-friends-badge">
            <span className="preview-friends-text">My Friends</span>
          </div>
          <div className="preview-location-badge">
            <span className="preview-location-text">{locationLabel}</span>
          </div>
        </div>

      </div>

      {/* Bottom Send Action Button Bar */}
      <div className="preview-send-bar">
        <button
          type="button"
          className="preview-send-btn"
          onClick={handlePost}
          disabled={isPosting}
          aria-label="Send photo"
        >
          <span className="preview-send-text">{isPosting ? 'SENDING...' : 'SEND'}</span>
          <Send size={24} className="preview-send-icon" />
        </button>
      </div>
    </div>
  );
};
