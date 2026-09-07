import React from 'react';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">
        <User size={40} />
      </div>
      <h2 className="coming-soon-title">Profile</h2>
      <p className="coming-soon-text">Coming Soon</p>
    </div>
  );
};
