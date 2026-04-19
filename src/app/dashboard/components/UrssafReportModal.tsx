'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface UrssafReport {
  id: string;
  reportData: any;
  periodStartDate: string;
  periodEndDate: string;
  isAutomatic: boolean;
  generatedAt: string;
  paidInvoicesDisclaimer?: string;
}

interface UrssafReportModalProps {
  report: UrssafReport | null;
  isOpen: boolean;
  onClose: () => void;
}

const UrssafReportModal: React.FC<UrssafReportModalProps> = ({ report, isOpen, onClose }) => {
  if (!report) return null;

  const { reportData, periodStartDate, periodEndDate, isAutomatic, generatedAt } = report;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails du Rapport URSSAF</DialogTitle>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        </DialogHeader>
        
        <div className="modal-body">
          {/* Period and Generation Info */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h6 className="fw-bold text-primary">Période</h6>
              <p className="mb-1">
                <i className="bi bi-calendar-range me-2 text-muted"></i>
                {new Date(periodStartDate).toLocaleDateString('fr-FR')} - {new Date(periodEndDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="col-md-6">
              <h6 className="fw-bold text-primary">Généré le</h6>
              <p className="mb-1">
                <i className="bi bi-clock me-2 text-muted"></i>
                {new Date(generatedAt).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="mb-4">
            <h6 className="fw-bold text-primary">Statut</h6>
            <span className={`badge ${isAutomatic ? 'bg-success' : 'bg-info'}`}>
              <i className={`bi ${isAutomatic ? 'bi-gear-fill' : 'bi-person-fill'} me-1`}></i>
              {isAutomatic ? 'Généré Automatiquement' : 'Généré Manuellement'}
            </span>
          </div>

          {/* Financial Summary */}
          <div className="border-top pt-4 mb-4">
            <h6 className="fw-bold text-primary mb-3">
              <i className="bi bi-graph-up me-2"></i>
              Résumé Financier
            </h6>
            
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <h6 className="card-title text-muted mb-1">Chiffre d'Affaires Total</h6>
                    <p className="card-text h5 text-success mb-0">{reportData.caTotal.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <h6 className="card-title text-muted mb-1">Cotisations URSSAF</h6>
                    <p className="card-text h5 text-warning mb-0">{reportData.cotisations.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <h6 className="card-title text-muted mb-1">Revenu Net</h6>
                    <p className="card-text h5 text-primary mb-0">{reportData.revenuNet.toFixed(2)} €</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="card border-0 bg-light">
                  <div className="card-body p-3">
                    <h6 className="card-title text-muted mb-1">TVA Applicable</h6>
                    <p className="card-text h5 mb-0">
                      {reportData.tvaApplicable ? (
                        <span className="text-danger">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Oui
                        </span>
                      ) : (
                        <span className="text-success">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Non
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts and Messages */}
          {reportData.alerte && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>Alerte TVA:</strong> {reportData.alerte}
            </div>
          )}
          
          {reportData.message && (
            <div className="alert alert-info" role="alert">
              <i className="bi bi-info-circle-fill me-2"></i>
              <strong>Information:</strong> {reportData.message}
            </div>
          )}

          {/* Disclaimers */}
          {(reportData.disclaimer || report.paidInvoicesDisclaimer) && (
            <div className="border-top pt-4">
              <h6 className="fw-bold text-primary mb-3">
                <i className="bi bi-info-square me-2"></i>
                Mentions Importantes
              </h6>
              {reportData.disclaimer && (
                <p className="small text-muted mb-2">{reportData.disclaimer}</p>
              )}
              {report.paidInvoicesDisclaimer && (
                <p className="small text-muted mb-2">{report.paidInvoicesDisclaimer}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="d-flex gap-2 flex-wrap">
            <a
              href={`/api/reports/urssaf/pdf?reportId=${report.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <i className="bi bi-file-earmark-pdf me-1"></i>
              Télécharger PDF
            </a>
            <a
              href={`/api/reports/urssaf-csv?reportId=${report.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-secondary"
            >
              <i className="bi bi-file-earmark-spreadsheet me-1"></i>
              Télécharger CSV
            </a>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fermer
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UrssafReportModal;