import React from 'react';
import { useNavigate } from 'react-router';
import { CameraView } from '../components/camera/CameraView';
import type { DualCaptureResult } from '../camera/types';

interface CameraPageProps {
  onCapture: (result: DualCaptureResult) => void;
}

export const CameraPage: React.FC<CameraPageProps> = ({ onCapture }) => {
  const navigate = useNavigate();

  const handleCaptureComplete = (result: DualCaptureResult) => {
    onCapture(result);
    navigate('/preview');
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="camera-page-wrapper">
      <CameraView
        onCaptureComplete={handleCaptureComplete}
        onClose={handleClose}
      />
    </div>
  );
};
