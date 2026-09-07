import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Zap, Clock, Camera } from 'lucide-react';
import { DailyMomentService } from '../../services/dailyMoment';

export const DailyPromptCard: React.FC = () => {
  const navigate = useNavigate();
  const [timerText, setTimerText] = useState(DailyMomentService.getTimeRemainingText());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerText(DailyMomentService.getTimeRemainingText());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="daily-prompt-card">
      <div className="prompt-glow-bg" />
      <div className="prompt-content">
        <div className="prompt-header">
          <span className="prompt-badge">
            <Zap size={12} fill="#ccff00" color="#ccff00" />
            <span>BeDuo Window</span>
          </span>
          <span className="prompt-timer">
            <Clock size={13} />
            <span>{timerText}</span>
          </span>
        </div>

        <h2 className="prompt-title">Capture your moment</h2>
        <p className="prompt-subtitle">
          Front and rear perspectives in a single snap.
        </p>

        <button
          type="button"
          className="prompt-action-btn"
          onClick={() => navigate('/camera')}
        >
          <Camera size={18} />
          <span>Post Your BeDuo</span>
        </button>
      </div>
    </div>
  );
};
