import React from 'react';
import { Camera, ArrowRight, User } from 'lucide-react';
import type { CaptureState } from '../../camera/types';

interface CaptureAnimationProps {
  captureState: CaptureState;
}

export const CaptureAnimation: React.FC<CaptureAnimationProps> = ({ captureState }) => {
  const stateStr = captureState as string;
  const isFlashing = stateStr === 'capturing' || stateStr === 'capturing-rear' || stateStr === 'capturing-front';
  const isSwitching = stateStr === 'switching' || stateStr === 'switching-camera' || stateStr === 'switching-facing';
  const isCompositing = stateStr === 'processing' || stateStr === 'compositing';

  if (captureState === 'idle') return null;

  return (
    <div className="capture-animation-layer">
      {/* Screen flash on capture */}
      <div className={`screen-flash ${isFlashing ? 'flash-active' : ''}`} />

      {/* Sequential transition prompt */}
      {isSwitching && (
        <div className="sequential-prompt-overlay">
          <div className="sequential-card">
            <div className="sequential-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Camera size={24} color="#ffffff" />
              <ArrowRight size={18} color="#ccff00" />
              <User size={24} color="#ffffff" />
            </div>
            <h3>Rear Captured</h3>
            <p>Smile! Capturing front camera next...</p>
            <div className="progress-bar">
              <div className="progress-bar-fill" />
            </div>
          </div>
        </div>
      )}

      {/* Compositing loader overlay */}
      {isCompositing && (
        <div className="compositing-overlay">
          <div className="compositing-card">
            <div className="duo-spinner" />
            <p>Compositing BeDuo photo...</p>
          </div>
        </div>
      )}
    </div>
  );
};
