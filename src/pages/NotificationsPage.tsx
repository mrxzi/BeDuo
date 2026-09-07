import React from 'react';
import { Bell } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-icon">
        <Bell size={40} />
      </div>
      <h2 className="coming-soon-title">Activity</h2>
      <p className="coming-soon-text">Coming Soon</p>
    </div>
  );
};
