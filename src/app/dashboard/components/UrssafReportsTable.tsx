'use client';

import React from 'react';

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

interface UrssafReportsTableProps {
  reports: UrssafReportTableData[];
  onViewDetails: (report: UrssafReportTableData) => void;
}

const UrssafReportsTable: React.FC<UrssafReportsTableProps> = ({ reports, onViewDetails }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th scope="col">
              <i className="bi bi-calendar-range me-1"></i>
              Période
            </th>
            <th scope="col">
              <i className="bi bi-graph-up me-1"></i>
              CA Total
            </th>
            <th scope="col">
              <i className="bi bi-calculator me-1"></i>
              Cotisations
            </th>
            <th scope="col">
              <i className="bi bi-cash-coin me-1"></i>
              Revenu Net
            </th>
            <th scope="col">
              <i className="bi bi-percent me-1"></i>
              TVA
            </th>
            <th scope="col">
              <i className="bi bi-gear me-1"></i>
              Type
            </th>
            <th scope="col" className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>
                <div className="small">
                  <strong>{new Date(report.startDate).toLocaleDateString('fr-FR')}</strong>
                  <br />
                  <span className="text-muted">au {new Date(report.endDate).toLocaleDateString('fr-FR')}</span>
                </div>
              </td>
              <td>
                <span className="fw-semibold text-success">{report.caTotal.toFixed(2)} €</span>
              </td>
              <td>
                <span className="fw-semibold text-warning">{report.cotisations.toFixed(2)} €</span>
              </td>
              <td>
                <span className="fw-bold text-primary">{report.revenuNet.toFixed(2)} €</span>
              </td>
              <td>
                {report.tvaApplicable ? (
                  <span className="badge bg-danger">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Applicable
                  </span>
                ) : (
                  <span className="badge bg-success">
                    <i className="bi bi-x-circle-fill me-1"></i>
                    Non applicable
                  </span>
                )}
              </td>
              <td>
                <span className={`badge ${report.status === 'AUTO' ? 'bg-success' : 'bg-info'}`}>
                  <i className={`bi ${report.status === 'AUTO' ? 'bi-gear-fill' : 'bi-person-fill'} me-1`}></i>
                  {report.status === 'AUTO' ? 'Auto' : 'Manuel'}
                </span>
              </td>
              <td className="text-end">
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    onClick={() => onViewDetails(report)}
                    className="btn btn-outline-primary"
                    title="Voir les détails"
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-danger"
                    title="Télécharger PDF"
                  >
                    <i className="bi bi-file-earmark-pdf"></i>
                  </a>
                  <a
                    href={report.csvUrl}
                    target="_blank"
                    rel="noopener noreferrer"  
                    className="btn btn-outline-secondary"
                    title="Télécharger CSV"
                  >
                    <i className="bi bi-file-earmark-spreadsheet"></i>
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UrssafReportsTable;