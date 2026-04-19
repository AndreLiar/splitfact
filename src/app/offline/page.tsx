'use client';

import Link from 'next/link';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export default function OfflinePage() {
  const { isOnline } = useOfflineStatus();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 text-center">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                <div className="mb-4">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle mb-3"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <i className="bi bi-wifi-off text-warning" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  
                  <h1 className="h3 fw-bold text-dark mb-3">
                    Mode hors ligne
                  </h1>
                  
                  <p className="text-muted mb-4 lh-base">
                    Vous êtes actuellement hors ligne. Certaines fonctionnalités de Splitfact 
                    ne sont pas disponibles, mais vous pouvez encore :
                  </p>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-center p-3 bg-light rounded-3">
                      <i className="bi bi-file-earmark-plus text-primary me-3 fs-5"></i>
                      <div className="text-start">
                        <div className="fw-semibold small">Brouillons</div>
                        <div className="text-muted small">Créer des factures</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="d-flex align-items-center p-3 bg-light rounded-3">
                      <i className="bi bi-people text-success me-3 fs-5"></i>
                      <div className="text-start">
                        <div className="fw-semibold small">Clients</div>
                        <div className="text-muted small">Voir vos données</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="d-flex align-items-center p-3 bg-light rounded-3">
                      <i className="bi bi-calculator text-info me-3 fs-5"></i>
                      <div className="text-start">
                        <div className="fw-semibold small">Calculateur</div>
                        <div className="text-muted small">URSSAF & TVA</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="d-flex align-items-center p-3 bg-light rounded-3">
                      <i className="bi bi-journal-text text-purple me-3 fs-5"></i>
                      <div className="text-start">
                        <div className="fw-semibold small">Historique</div>
                        <div className="text-muted small">Données locales</div>
                      </div>
                    </div>
                  </div>
                </div>

                {isOnline ? (
                  <div className="alert alert-success d-flex align-items-center mb-4">
                    <i className="bi bi-wifi me-2"></i>
                    <span>Connexion rétablie ! Vous pouvez retourner à l'application.</span>
                  </div>
                ) : (
                  <div className="alert alert-warning d-flex align-items-center mb-4">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <span>Vérifiez votre connexion internet pour accéder à toutes les fonctionnalités.</span>
                  </div>
                )}

                <div className="d-flex gap-3 justify-content-center">
                  <Link 
                    href="/dashboard" 
                    className="btn btn-primary px-4"
                  >
                    <i className="bi bi-house me-2"></i>
                    Retour au tableau de bord
                  </Link>
                  
                  <button 
                    className="btn btn-outline-secondary px-4"
                    onClick={() => window.location.reload()}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Réessayer
                  </button>
                </div>
                
                <hr className="my-4" />
                
                <div className="text-muted">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    Vos données seront synchronisées automatiquement une fois la connexion rétablie.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}