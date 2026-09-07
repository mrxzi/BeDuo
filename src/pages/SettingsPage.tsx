import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Check, X, Zap, Clock } from 'lucide-react';
import { CameraCapabilitiesDetector } from '../camera/CameraCapabilities';
import type { CameraCapabilities } from '../camera/types';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [caps, setCaps] = useState<CameraCapabilities | null>(null);
  const [loadingCaps, setLoadingCaps] = useState(false);

  const runDiagnostics = async () => {
    setLoadingCaps(true);
    try {
      const res = await CameraCapabilitiesDetector.detect();
      setCaps(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCaps(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="page-container settings-page">
      <header className="page-header">
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => navigate('/profile')}
          aria-label="Back"
        >
          <ChevronLeft size={20} />
        </button>
        <h2>Settings & Diagnostics</h2>
        <div style={{ width: 40 }} />
      </header>

      <section className="settings-section">
        <h3>Camera Capabilities</h3>
        <p className="settings-desc">
          Diagnostic details of your browser's camera support:
        </p>

        {loadingCaps ? (
          <div className="settings-card">Testing cameras...</div>
        ) : caps ? (
          <div className="settings-card">
            <div className="setting-row">
              <span>Camera Available:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {caps.hasCamera ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                <span>{caps.hasCamera ? 'Yes' : 'No'}</span>
              </strong>
            </div>
            <div className="setting-row">
              <span>Front Camera:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {caps.hasFrontCamera ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                <span>{caps.hasFrontCamera ? 'Detected' : 'None'}</span>
              </strong>
            </div>
            <div className="setting-row">
              <span>Rear Camera:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {caps.hasRearCamera ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                <span>{caps.hasRearCamera ? 'Detected' : 'None'}</span>
              </strong>
            </div>
            <div className="setting-row">
              <span>Simultaneous Dual Stream:</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {caps.supportsSimultaneousStreams ? <Zap size={14} color="#ccff00" /> : <Clock size={14} color="#a1a1aa" />}
                <span>{caps.supportsSimultaneousStreams ? 'Supported' : 'Sequential Fallback'}</span>
              </strong>
            </div>
            <div className="setting-row">
              <span>Active Mode:</span>
              <strong className="badge-highlight">{caps.detectedMode}</strong>
            </div>

            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: 12 }}
              onClick={runDiagnostics}
            >
              Re-run Camera Probe
            </button>
          </div>
        ) : null}
      </section>

      <section className="settings-section">
        <h3>About BeDuo</h3>
        <div className="settings-card">
          <div className="setting-row">
            <span>Version:</span>
            <strong>1.0.0 (Production)</strong>
          </div>
          <div className="setting-row">
            <span>Engine:</span>
            <strong>WebRTC / Canvas 2D</strong>
          </div>
          <div className="setting-row">
            <span>Composition Output:</span>
            <strong>1080 × 1920 WebP</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
