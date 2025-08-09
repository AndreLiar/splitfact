'use client';

import { useOfflineStatus } from '@/hooks/useOfflineStatus';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
}

export default function OfflineIndicator({ 
  className = '', 
  showOnlineStatus = false 
}: OfflineIndicatorProps) {
  const { isOnline, wasOffline } = useOfflineStatus();

  // Show online status briefly after being offline
  const showOnline = showOnlineStatus && isOnline && wasOffline;
  
  if (isOnline && !showOnline) {
    return null;
  }

  return (
    <div 
      className={`alert border-0 shadow-sm d-flex align-items-center ${
        isOnline 
          ? 'alert-success' 
          : 'alert-warning'
      } ${className}`}
      role="alert"
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1060,
        minWidth: '300px',
        borderRadius: '50px',
        animation: isOnline ? 'slideInOut 3s ease-in-out' : 'slideIn 0.3s ease-out'
      }}
    >
      <div className="d-flex align-items-center justify-content-center w-100">
        {isOnline ? (
          <>
            <i className="bi bi-wifi text-success me-2"></i>
            <span className="fw-semibold">Connexion rétablie</span>
          </>
        ) : (
          <>
            <i className="bi bi-wifi-off text-warning me-2"></i>
            <span className="fw-semibold">Mode hors ligne</span>
            <small className="ms-2 opacity-75">Certaines fonctionnalités sont limitées</small>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
        }
        
        @keyframes slideInOut {
          0% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
          }
          15%, 85% { 
            opacity: 1; 
            transform: translateX(-50%) translateY(0); 
          }
          100% { 
            opacity: 0; 
            transform: translateX(-50%) translateY(-20px); 
          }
        }
      `}</style>
    </div>
  );
}

// Compact status indicator for the navbar
export function NetworkStatus() {
  const { isOnline } = useOfflineStatus();

  return (
    <div className="d-flex align-items-center">
      <div 
        className={`rounded-circle me-2 ${
          isOnline ? 'bg-success' : 'bg-warning'
        }`}
        style={{ width: '8px', height: '8px' }}
        title={isOnline ? 'En ligne' : 'Hors ligne'}
      />
      <small className={`text-muted d-none d-md-inline ${isOnline ? '' : 'text-warning'}`}>
        {isOnline ? 'En ligne' : 'Hors ligne'}
      </small>
    </div>
  );
}