import { Lock, Camera, AlertCircle, X } from 'lucide-react';
import type { CameraError, PermissionState } from '../../camera/types';

interface CameraPermissionScreenProps {
  permissionState: PermissionState;
  error: CameraError | null;
  onRequestPermission: () => void;
  onClose?: () => void;
  isLoading: boolean;
}

export function CameraPermissionScreen({
  permissionState,
  error,
  onRequestPermission,
  onClose,
  isLoading,
}: CameraPermissionScreenProps) {
  // Denied state
  if (permissionState === 'denied' || error?.type === 'permission-denied') {
    return (
      <div className="camera-permission" role="dialog" aria-labelledby="cam-perm-title">
        <div className="camera-permission__icon">
          <Lock size={36} color="#ef4444" />
        </div>
        <h2 className="camera-permission__title" id="cam-perm-title">
          Camera Access Required
        </h2>
        <p className="camera-permission__desc">
          BeDuo needs camera access to capture your front and rear photos.
        </p>

        <div className="camera-permission__steps">
          <p className="camera-permission__steps-title">To enable access:</p>
          <ol className="camera-permission__steps-list">
            <li>Tap the padlock icon in your browser address bar</li>
            <li>Select <strong>Permissions</strong> → <strong>Camera</strong></li>
            <li>Switch to <strong>Allow</strong> and refresh</li>
          </ol>
        </div>

        <button
          type="button"
          className="camera-permission__button camera-permission__button--primary"
          onClick={onRequestPermission}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Pre-permission prompt (default state)
  return (
    <div className="camera-permission" role="dialog" aria-labelledby="cam-perm-title">
      {onClose && (
        <button
          type="button"
          className="camera-permission__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      )}

      <div className="camera-permission__icon">
        <Camera size={40} color="#ffffff" />
      </div>

      <h2 className="camera-permission__title" id="cam-perm-title">
        Enable Camera
      </h2>

      <p className="camera-permission__desc">
        BeDuo captures dual photos using both cameras in a single tap.
      </p>

      {error && (
        <div className="camera-permission__error">
          <AlertCircle size={16} color="#ef4444" />
          <span>{error.userMessage}</span>
        </div>
      )}

      <button
        type="button"
        className="camera-permission__button camera-permission__button--primary"
        onClick={onRequestPermission}
        disabled={isLoading}
      >
        {isLoading ? 'Opening Camera...' : 'Allow Camera Access'}
      </button>

      <p className="camera-permission__privacy-note">
        Photos are captured only when you press the shutter button.
      </p>
    </div>
  );
}
