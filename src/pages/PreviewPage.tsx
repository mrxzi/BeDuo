import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { RefreshCw, Send, Zap, Clock } from 'lucide-react';
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
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  if (!captureResult) {
    return (
      <div className="page-container preview-empty">
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
    setIsPosting(true);
    try {
      PostService.addPost({
        imageUrl: captureResult.compositedDataUrl,
        caption,
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

  const handleRetake = () => {
    onClearCapture();
    navigate('/camera');
  };

  return (
    <div className="preview-page-container">
      {/* Top Header */}
      <header className="preview-header">
        <button
          type="button"
          className="preview-icon-btn"
          onClick={handleRetake}
          disabled={isPosting}
        >
          <RefreshCw size={16} />
          <span>Retake</span>
        </button>

        <h3 className="preview-title">Preview BeDuo</h3>

        <button
          type="button"
          className="preview-post-btn"
          onClick={handlePost}
          disabled={isPosting}
        >
          <span>{isPosting ? 'Posting...' : 'Post'}</span>
          <Send size={16} />
        </button>
      </header>

      {/* Main Image Display */}
      <div className="preview-image-wrapper">
        <img
          src={captureResult.compositedDataUrl}
          alt="Composited BeDuo moment"
          className="preview-composited-image"
        />
        <div className="preview-badge">
          {captureResult.isSimultaneous ? (
            <>
              <Zap size={14} color="#ccff00" />
              <span>DUAL LIVE</span>
            </>
          ) : (
            <>
              <Clock size={14} color="#a1a1aa" />
              <span>DUO SEQUENTIAL</span>
            </>
          )}
        </div>
      </div>

      {/* Caption Form Bar */}
      <div className="preview-caption-bar">
        <input
          type="text"
          placeholder="Add a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="preview-caption-input"
          maxLength={150}
        />
      </div>
    </div>
  );
};
