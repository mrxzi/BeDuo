import React from 'react';
import { NavLink, useLocation } from 'react-router';
import { Home, Compass, Camera, Bell, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  // Hide bottom nav on camera screen or preview screen for fullscreen camera feel
  if (location.pathname === '/camera' || location.pathname === '/preview') {
    return null;
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <Home size={20} />
          <span className="nav-label">Feed</span>
        </NavLink>

        <NavLink
          to="/discover"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Compass size={20} />
          <span className="nav-label">Explore</span>
        </NavLink>

        <NavLink to="/camera" className="nav-item nav-camera-btn">
          <div className="camera-btn-ring">
            <Camera size={22} color="#000000" strokeWidth={2.5} />
          </div>
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Bell size={20} />
          <span className="nav-label">Activity</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span className="nav-label">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};
