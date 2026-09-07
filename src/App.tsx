import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { HomePage } from './pages/HomePage';
import { CameraPage } from './pages/CameraPage';
import { PreviewPage } from './pages/PreviewPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BottomNav } from './components/navigation/BottomNav';
import type { DualCaptureResult } from './camera/types';
import './App.css';

export function App() {
  const [captureResult, setCaptureResult] = useState<DualCaptureResult | null>(null);

  const handleCapture = useCallback((result: DualCaptureResult) => {
    setCaptureResult(result);
  }, []);

  const handleClearCapture = useCallback(() => {
    setCaptureResult(null);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <main className="app-main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/camera"
              element={<CameraPage onCapture={handleCapture} />}
            />
            <Route
              path="/preview"
              element={
                <PreviewPage
                  captureResult={captureResult}
                  onClearCapture={handleClearCapture}
                />
              }
            />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
