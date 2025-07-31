'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';

interface UrssafReportData {
  period: string;
  user: {
    name: string;
    siret: string;
    fiscalRegime: string;
    microEntrepreneurType: string;
  };
  caTotal: number;
  tauxUrssaf: number;
  cotisations: number;
  tauxImpot: number;
  impotRevenu: number;
  revenuNet: number;
  tvaApplicable: boolean;
  alerte: string;
  message: string;
}

export default function UrssafReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<UrssafReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleGenerateReport = async () => {
    setError(null);
    setReportData(null);
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/urssaf?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur inconnue' }));
        throw new Error(errorData.message || 'Échec de la génération du rapport URSSAF.');
      }
      const data: UrssafReportData = await response.json();
      setReportData(data);
    } catch (err: any) {
      console.error('Error generating URSSAF report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/urssaf-csv?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec du téléchargement du rapport CSV.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urssaf_report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading CSV report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/urssaf/pdf?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec du téléchargement du rapport PDF.');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urssaf_report_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTvaReport = async () => {
    setError(null);
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une date de début et une date de fin.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/tva?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Échec du téléchargement du rapport TVA.');
      }
      const data = await response.json();
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tva_report_${startDate}_to_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading TVA report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <h1 className="h1">Rapport URSSAF</h1>
      <div className="card shadow-subtle mb-4">
        <div className="card-body">
          <h2 className="h5 card-title">Sélectionnez une période</h2>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <label htmlFor="start-date" className="form-label">Date de début</label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control rounded-input"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="end-date" className="form-label">Date de fin</label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control rounded-input"
              />
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <button onClick={handleGenerateReport} disabled={loading} className="btn btn-primary">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Générer le rapport
            </button>
            <button onClick={handleDownloadCsv} disabled={loading || !reportData} className="btn btn-outline-secondary">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Télécharger (CSV)
            </button>
            <button onClick={handleDownloadPdf} disabled={loading || !reportData} className="btn btn-outline-secondary">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Télécharger (PDF)
            </button>
            <button onClick={handleDownloadTvaReport} disabled={loading} className="btn btn-outline-info">
              {loading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
              Rapport de TVA (CSV)
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {reportData && (
        <div className="card shadow-subtle">
          <div className="card-header">
            <h2 className="h5 card-title">Rapport pour {reportData.user.name}</h2>
            <p className="text-mediumGray mb-0">
              Période du {startDate} au {endDate}
            </p>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h3 className="h6">Informations utilisateur</h3>
                <p className="mb-1"><strong>SIRET:</strong> {reportData.user.siret}</p>
                <p className="mb-1"><strong>Régime fiscal:</strong> {reportData.user.fiscalRegime}</p>
                <p><strong>Type de micro-entrepreneur:</strong> {reportData.user.microEntrepreneurType}</p>
              </div>
              <div className="col-md-6">
                <h3 className="h6">Calcul des cotisations</h3>
                <p className="mb-1"><strong>Chiffre d'affaires total:</strong> {formatCurrency(reportData.caTotal)}</p>
                <p className="mb-1"><strong>Taux URSSAF:</strong> {reportData.tauxUrssaf}%</p>
                <p className="mb-1"><strong>Cotisations sociales:</strong> {formatCurrency(reportData.cotisations)}</p>
                <p className="mb-1"><strong>Taux d'imposition:</strong> {reportData.tauxImpot}%</p>
                <p className="mb-1"><strong>Impôt sur le revenu:</strong> {formatCurrency(reportData.impotRevenu)}</p>
                <p className="h5 mt-2"><strong>Revenu Net:</strong> {formatCurrency(reportData.revenuNet)}</p>
              </div>
            </div>
            {reportData.tvaApplicable && (
              <div className="alert bg-warning-light text-warning-dark mt-4" role="alert">
                <h4 className="alert-heading">TVA Applicable</h4>
                <p>Vous êtes redevable de la TVA. Pensez à faire votre déclaration.</p>
              </div>
            )}
            {reportData.alerte && (
              <div className="alert alert-danger mt-4" role="alert">
                <h4 className="alert-heading">Alerte</h4>
                <p>{reportData.alerte}</p>
              </div>
            )}
            <div className="alert bg-info-light text-info-dark mt-4" role="alert">
              <h4 className="alert-heading">Message</h4>
              <p>{reportData.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}