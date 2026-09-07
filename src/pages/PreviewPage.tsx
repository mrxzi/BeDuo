import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Send } from 'lucide-react';
import type { DualCaptureResult } from '../camera/types';
import { PostService } from '../services/posts';

interface PreviewPageProps {
  captureResult: DualCaptureResult | null;
  onClearCapture: () => void;
}

export const PreviewPage: React.FC<PreviewPageProps> = ({
  captureResult,
  onClearCapture,
}) => {
  const navigate = useNavigate();
  const [isPosting, setIsPosting] = useState(false);

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
        location: 'Local Moment',
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
