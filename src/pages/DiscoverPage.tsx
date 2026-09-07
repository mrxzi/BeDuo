import React from 'react';
import { Compass } from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">
        <Compass size={40} />
      </div>
      <h2 className="coming-soon-title">Explore</h2>
      <p className="coming-soon-text">Coming Soon</p>
    </div>
  );
};
