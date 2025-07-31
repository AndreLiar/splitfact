'use client';

import { useState, useEffect } from 'react';
import UrssafReportsTable from '@/app/dashboard/components/UrssafReportsTable';
import UrssafReportModal from '@/app/dashboard/components/UrssafReportModal';

interface UrssafReportApi {
  id: string;
  reportData: any;
  periodStartDate: string;
  periodEndDate: string;
  isAutomatic: boolean;
  generatedAt: string;
  paidInvoicesDisclaimer?: string;
}

interface UrssafReportTableData {
  id: string;
  startDate: string;
  endDate: string;
  caTotal: number;
  cotisations: number;
  revenuNet: number;
  tvaApplicable: boolean;
  status: 'AUTO' | 'MANUAL';
  createdAt: string;
  pdfUrl?: string;
  csvUrl?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<UrssafReportTableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<UrssafReportApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default dates to current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports/urssaf-reports');
      const data: UrssafReportApi[] = await res.json();
      
      const mappedReports: UrssafReportTableData[] = data.map((report) => ({
        id: report.id,
        startDate: report.periodStartDate,
        endDate: report.periodEndDate,
        caTotal: report.reportData.caTotal,
        cotisations: report.reportData.cotisations,
        revenuNet: report.reportData.revenuNet,
        tvaApplicable: report.reportData.tvaApplicable,
        status: report.isAutomatic ? 'AUTO' : 'MANUAL',
        createdAt: report.generatedAt,
        pdfUrl: `/api/reports/urssaf/pdf?reportId=${report.id}`,
        csvUrl: `/api/reports/urssaf-csv?reportId=${report.id}`,
      }));
      
      const sortedReports = mappedReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setReports(sortedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Impossible de charger les rapports existants.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une période valide.');
      return;
    }

    setError(null);
    setGenerating(true);
    
    try {
      const res = await fetch(`/api/reports/urssaf?startDate=${startDate}&endDate=${endDate}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erreur lors de la génération du rapport');
      }
      
      const newReportApi: UrssafReportApi = await res.json();
      const newReportTableData: UrssafReportTableData = {
        id: newReportApi.id,
        startDate: newReportApi.periodStartDate,
        endDate: newReportApi.periodEndDate,
        caTotal: newReportApi.reportData.caTotal,
        cotisations: newReportApi.reportData.cotisations,
        revenuNet: newReportApi.reportData.revenuNet,
        tvaApplicable: newReportApi.reportData.tvaApplicable,
        status: newReportApi.isAutomatic ? 'AUTO' : 'MANUAL',
        createdAt: newReportApi.generatedAt,
        pdfUrl: `/api/reports/urssaf/pdf?reportId=${newReportApi.id}`,
        csvUrl: `/api/reports/urssaf-csv?reportId=${newReportApi.id}`,
      };

      setReports((prevReports) => [
        newReportTableData,
        ...prevReports.filter((r) => r.id !== newReportTableData.id),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewDetails = async (reportData: UrssafReportTableData) => {
    try {
      const res = await fetch(`/api/reports/urssaf-reports/${reportData.id}`);
      const data: UrssafReportApi = await res.json();
      setSelectedReport(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching report details:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleDownloadTvaReport = async () => {
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner une période pour télécharger le rapport TVA.');
      return;
    }

    try {
      const response = await fetch(`/api/reports/tva?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const data = await response.json();
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
      const csvContent = `${headers}\n${rows}`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport_tva_${startDate}_${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Erreur lors du téléchargement du rapport TVA.');
    }
  };

  return (
    <div className="main-container">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h2 mb-1">Rapports URSSAF</h1>
          <p className="text-muted mb-0">Générez et consultez vos déclarations URSSAF</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Generate New Report Card */}
      <div className="card shadow-subtle mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">
            <i className="bi bi-plus-circle me-2"></i>
            Générer un nouveau rapport
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-medium">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-medium">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <div className="d-flex gap-2 w-100">
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || !startDate || !endDate}
                  className="btn btn-primary flex-fill"
                >
                  {generating && <span className="spinner-border spinner-border-sm me-2"></span>}
                  <i className="bi bi-file-earmark-plus me-1"></i>
                  Générer
                </button>
                <button
                  onClick={handleDownloadTvaReport}
                  disabled={!startDate || !endDate}
                  className="btn btn-outline-info"
                  title="Télécharger rapport TVA"
                >
                  <i className="bi bi-file-earmark-spreadsheet"></i>
                  TVA
                </button>
              </div>
            </div>
          </div>
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Sélectionnez une période pour générer votre rapport URSSAF automatiquement
          </small>
        </div>
      </div>

      {/* Reports History */}
      <div className="card shadow-subtle">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Historique des rapports
          </h5>
          <span className="badge bg-light text-dark">{reports.length} rapport(s)</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="mt-3 text-muted">Chargement de vos rapports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x display-1 text-muted mb-3"></i>
              <h5 className="text-muted">Aucun rapport généré</h5>
              <p className="text-muted mb-4">Commencez par générer votre premier rapport URSSAF</p>
              <button 
                onClick={() => (document.querySelector('input[type="date"]') as HTMLInputElement)?.focus()}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-1"></i>
                Générer mon premier rapport
              </button>
            </div>
          ) : (
            <UrssafReportsTable reports={reports} onViewDetails={handleViewDetails} />
          )}
        </div>
      </div>

      {/* Modal */}
      <UrssafReportModal report={selectedReport} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
