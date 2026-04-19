'use client';

import React from 'react';
import NotificationCenter from './NotificationCenter';

const FixedNotificationCenter: React.FC = () => {
  return (
    <>
      {/* Desktop notification bell - more prominent */}
      <div 
        className="d-none d-md-block"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1060, // Higher than sidebar (1020) and navbar (1030)
        }}
      >
        <div className="notification-bell-container">
          <NotificationCenter className="notification-bell-enhanced" />
        </div>
      </div>
      
      {/* Mobile notification bell - visible on mobile */}
      <div 
        className="d-md-none"
        style={{
          position: 'fixed',
          top: '15px',
          right: '15px',
          zIndex: 1060,
        }}
      >
        <div className="notification-bell-container">
          <NotificationCenter className="notification-bell-mobile" />
        </div>
      </div>
    </>
  );
};

export default FixedNotificationCenter;