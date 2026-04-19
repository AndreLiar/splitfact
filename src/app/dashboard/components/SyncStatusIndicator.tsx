'use client';

import { useState, useEffect } from 'react';

interface SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  error?: string;
}

interface SyncStatusIndicatorProps {
  type: 'notion' | 'web';
  className?: string;
}

export default function SyncStatusIndicator({ type, className = '' }: SyncStatusIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>({ isConnected: false, isSyncing: false });

  useEffect(() => {
    if (type === 'notion') {
      fetchNotionStatus();
      // Poll for status updates every 30 seconds
      const interval = setInterval(fetchNotionStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [type]);

  const fetchNotionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/notion/auth?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus({
          isConnected: data.connected,
          isSyncing: false, // This would come from the API in a real implementation
          lastSync: data.lastSync ? new Date(data.lastSync) : undefined,
          error: data.error
        });
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
      setStatus(prev => ({ ...prev, error: 'Erreur de connexion' }));
    }
  };

  const triggerSync = async () => {
    if (type !== 'notion' || !status.isConnected) return;

    setStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const response = await fetch('/api/integrations/notion/sync?action=sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            lastSync: new Date(),
            error: undefined 
          }));
        } else {
          setStatus(prev => ({ 
            ...prev, 
            isSyncing: false, 
            error: result.error 
          }));
        }
      }
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        error: 'Erreur de synchronisation' 
      }));
    }
  };

  if (type === 'web') {
    return (
      <div className={`d-flex align-items-center ${className}`}>
        <div className="status-dot bg-success me-2" style={{width: '8px', height: '8px', borderRadius: '50%'}}></div>
        <small className="text-muted">Recherche Web</small>
        <i className="bi bi-check-circle text-success ms-1" style={{fontSize: '12px'}}></i>
      </div>
    );
  }

  return (
    <div className={`d-flex align-items-center ${className}`}>
      <div 
        className={`status-dot me-2 ${
          status.error ? 'bg-danger' : 
          status.isSyncing ? 'bg-warning' :
          status.isConnected ? 'bg-success' : 'bg-secondary'
        }`} 
        style={{width: '8px', height: '8px', borderRadius: '50%'}}
      ></div>
      
      <small className="text-muted me-1">Notion</small>
      
      {status.isSyncing ? (
        <div className="spinner-border spinner-border-sm text-warning" role="status" style={{width: '12px', height: '12px'}}></div>
      ) : status.error ? (
        <i className="bi bi-exclamation-triangle text-danger" style={{fontSize: '12px'}} title={status.error}></i>
      ) : status.isConnected ? (
        <button 
          className="btn btn-link p-0 border-0 text-success"
          style={{fontSize: '12px'}}
          onClick={triggerSync}
          title="Synchroniser maintenant"
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      ) : (
        <i className="bi bi-x-circle text-secondary" style={{fontSize: '12px'}} title="Non connecté"></i>
      )}
      
      {status.lastSync && !status.isSyncing && (
        <small className="text-muted ms-1" style={{fontSize: '10px'}}>
          {status.lastSync.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </small>
      )}
    </div>
  );
}