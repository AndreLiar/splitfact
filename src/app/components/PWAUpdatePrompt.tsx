'use client';

import { useState, useEffect } from 'react';

export default function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload page when new service worker takes control
        window.location.reload();
      });

      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdatePrompt(true);
              }
            });
          }
        });

        // Check if there's already a waiting service worker
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div 
      className="alert alert-info border-0 shadow-lg d-flex align-items-center justify-content-between"
      role="alert"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '400px',
        zIndex: 1060,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        color: 'white'
      }}
    >
      <div className="d-flex align-items-center">
        <div className="me-3">
          <i className="bi bi-arrow-clockwise fs-4"></i>
        </div>
        <div>
          <div className="fw-semibold mb-1">
            Mise à jour disponible
          </div>
          <div className="small opacity-90">
            Nouvelles fonctionnalités et améliorations
          </div>
        </div>
      </div>
      
      <div className="d-flex gap-2">
        <button 
          className="btn btn-light btn-sm" 
          onClick={handleUpdate}
          style={{ minWidth: '90px' }}
        >
          <i className="bi bi-download me-1"></i>
          Mettre à jour
        </button>
        <button 
          className="btn btn-outline-light btn-sm" 
          onClick={handleDismiss}
          aria-label="Plus tard"
          title="Plus tard"
        >
          <i className="bi bi-x"></i>
        </button>
      </div>
    </div>
  );
}