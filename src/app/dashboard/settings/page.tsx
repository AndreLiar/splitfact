'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NotionStatus {
  connected: boolean;
  workspace?: string;
  lastSync?: Date;
  databases: number;
  errors?: string[];
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchNotionStatus();
      
      // Check for OAuth callback messages
      const params = new URLSearchParams(window.location.search);
      if (params.get('notion_connected') === 'true') {
        setMessage('Notion account connected successfully!');
        // Clean URL
        window.history.replaceState({}, '', '/dashboard/settings');
      } else if (params.get('notion_error')) {
        setMessage(`Error: ${params.get('notion_error')}`);
      }
    }
  }, [status, router]);

  const fetchNotionStatus = async () => {
    try {
      const response = await fetch('/api/integrations/notion/auth?action=status');
      if (response.ok) {
        const status = await response.json();
        setNotionStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch Notion status:', error);
    }
  };

  const handleConnectNotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notion/auth?action=connect');
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        setMessage('Failed to initiate Notion connection');
      }
    } catch (error) {
      console.error('Error connecting to Notion:', error);
      setMessage('Error connecting to Notion');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectNotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notion/auth?action=disconnect');
      if (response.ok) {
        setMessage('Notion account disconnected successfully');
        await fetchNotionStatus();
      } else {
        setMessage('Failed to disconnect Notion account');
      }
    } catch (error) {
      console.error('Error disconnecting Notion:', error);
      setMessage('Error disconnecting Notion');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNotion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/notion/sync?action=sync');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMessage('Notion data synced successfully!');
          await fetchNotionStatus();
        } else {
          setMessage(`Sync failed: ${result.error}`);
        }
      } else {
        setMessage('Failed to sync Notion data');
      }
    } catch (error) {
      console.error('Error syncing Notion:', error);
      setMessage('Error syncing Notion data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row">
        <div className="col-12">
          <h1 className="h3 mb-4">
            <i className="bi bi-gear-fill me-2 text-primary"></i>
            Paramètres
          </h1>

          {message && (
            <div className={`alert ${message.includes('Error') || message.includes('failed') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
              {message}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setMessage(null)}
              ></button>
            </div>
          )}

          {/* Notion Integration Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-journal-text me-2"></i>
                Intégration Notion
              </h5>
            </div>
            <div className="card-body">
              {notionStatus === null ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="d-flex align-items-center mb-2">
                        <span className={`badge me-2 ${notionStatus.connected ? 'bg-success' : 'bg-secondary'}`}>
                          {notionStatus.connected ? 'Connecté' : 'Non connecté'}
                        </span>
                        {notionStatus.workspace && (
                          <small className="text-muted">Workspace: {notionStatus.workspace}</small>
                        )}
                      </div>
                      
                      {notionStatus.connected && (
                        <div>
                          <small className="text-muted d-block">
                            Bases de données: {notionStatus.databases}
                          </small>
                          {notionStatus.lastSync && (
                            <small className="text-muted d-block">
                              Dernière sync: {new Date(notionStatus.lastSync).toLocaleString('fr-FR')}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="col-md-6 text-end">
                      {!notionStatus.connected ? (
                        <button 
                          className="btn btn-primary"
                          onClick={handleConnectNotion}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Connexion...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-plus-circle me-2"></i>
                              Connecter Notion
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="btn-group">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={handleSyncNotion}
                            disabled={loading}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Synchroniser
                              </>
                            )}
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={handleDisconnectNotion}
                            disabled={loading}
                          >
                            <i className="bi bi-x-circle me-2"></i>
                            Déconnecter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <hr />

                  <div className="row">
                    <div className="col-12">
                      <h6>Fonctionnalités disponibles avec Notion :</h6>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Synchronisation bidirectionnelle des revenus et dépenses
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Gestion centralisée des clients et projets
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Notes fiscales et rappels personnalisés
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Métriques business avancées
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-check-circle text-success me-2"></i>
                          Assistant fiscal enrichi avec vos données Notion
                        </li>
                      </ul>
                    </div>
                  </div>

                  {notionStatus.errors && notionStatus.errors.length > 0 && (
                    <div className="alert alert-warning mt-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Avertissements:</strong>
                      <ul className="mb-0 mt-2">
                        {notionStatus.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Web Search Section */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-search me-2"></i>
                Recherche Web Intelligente
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <p className="mb-3">
                    L'assistant fiscal peut maintenant accéder aux informations fiscales les plus récentes en temps réel.
                  </p>
                  
                  <h6>Fonctionnalités :</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Accès aux dernières réglementations URSSAF
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Seuils et taux de TVA à jour
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Sources officielles prioritaires (.gouv.fr)
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      Validation automatique des informations
                    </li>
                  </ul>
                </div>
                <div className="col-md-4 text-center">
                  <div className="badge bg-success fs-6 p-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Activé
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Recherche web active pour tous les conseils fiscaux
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}