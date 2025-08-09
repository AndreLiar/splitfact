'use client';

import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallPromptProps {
  className?: string;
  onInstall?: () => void;
  onDismiss?: () => void;
}

export default function PWAInstallPrompt({ 
  className = '', 
  onInstall, 
  onDismiss 
}: PWAInstallPromptProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if already installed, not installable, or dismissed
  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success && onInstall) {
      onInstall();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <div className={`alert alert-primary border-0 shadow-sm d-flex align-items-center justify-content-between ${className}`} 
         role="alert" 
         style={{ 
           background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
           color: 'white',
           borderRadius: '12px'
         }}>
      <div className="d-flex align-items-center">
        <div className="me-3">
          <i className="bi bi-download fs-4"></i>
        </div>
        <div>
          <div className="fw-semibold mb-1">
            <i className="bi bi-phone me-2"></i>
            Installer Splitfact
          </div>
          <div className="small opacity-90">
            Accès rapide depuis votre écran d'accueil
          </div>
        </div>
      </div>
      
      <div className="d-flex gap-2">
        <button 
          className="btn btn-light btn-sm" 
          onClick={handleInstall}
          style={{ minWidth: '80px' }}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Installer
        </button>
        <button 
          className="btn btn-outline-light btn-sm" 
          onClick={handleDismiss}
          aria-label="Fermer"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
}

// Compact version for mobile
export function PWAInstallBadge({ className = '' }: { className?: string }) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    await promptInstall();
  };

  return (
    <button 
      className={`btn btn-primary btn-sm shadow-lg ${className}`}
      onClick={handleInstall}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1050,
        borderRadius: '50px',
        animation: 'pulse 2s infinite'
      }}
    >
      <i className="bi bi-download me-1"></i>
      <span className="d-none d-sm-inline">Installer l'app</span>
      <span className="d-sm-none">App</span>
      
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>
    </button>
  );
}