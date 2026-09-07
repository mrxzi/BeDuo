import React from 'react';
import { Camera } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const HomePage: React.FC = () => {

  return (
    <div className="page-container feed-page">
      {/* Top App Bar */}
      <header className="app-header home-header-clean">
        <div className="brand-logo">
          <img src={logoImg} alt="BeDuo" className="brand-logo-img" />
        </div>
      </header>

      {/* Coming Soon feed */}
      <section className="coming-soon-page">
        <div className="coming-soon-icon">
          <Camera size={40} />
        </div>
        <h2 className="coming-soon-title">Feed</h2>
        <p className="coming-soon-text">Coming Soon</p>
      </section>
    </div>
  );
};
