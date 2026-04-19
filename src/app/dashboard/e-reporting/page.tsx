'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface EReportingPeriod {
  id?: string;
  period: string;
  status: string;
  transactionCount: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  numeroFluxDepot?: string | null;
  submittedAt?: string | null;
  errorMessage?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Brouillon',  cls: 'bg-secondary' },
  ready:     { label: 'Prêt',       cls: 'bg-info text-dark' },
  submitted: { label: 'Soumis',     cls: 'bg-primary' },
  accepted:  { label: 'Accepté',    cls: 'bg-success' },
  rejected:  { label: 'Rejeté',     cls: 'bg-danger' },
};

function getPreviousMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function nextDueDate(): string {
  const now = new Date();
  // Due on the 2nd of the following month
  const due = new Date(now.getFullYear(), now.getMonth() + 1, 2);
  return due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function EReportingPage() {
  const { status } = useSession();
  const router = useRouter();

  const [periods, setPeriods] = useState<EReportingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    const months = getPreviousMonths(6);
    const results = await Promise.all(
      months.map(async (period) => {
        const res = await fetch(`/api/e-reporting?period=${period}`);
        if (!res.ok) return { period, status: 'draft', transactionCount: 0, totalHT: 0, totalTVA: 0, totalTTC: 0 };
        return res.json();
      })
    );
    setPeriods(results);
    setLoading(false);
  }, []);

  useEffect(() => { if (status === 'authenticated') loadPeriods(); }, [status, loadPeriods]);

  const handleGenerate = async (period: string) => {
    setSubmitting(period);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/e-reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, submit: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur génération');
      setSuccess(`Rapport ${period} généré.`);
      loadPeriods();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleSubmit = async (period: string) => {
    setSubmitting(period);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/e-reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, submit: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erreur soumission');
      setSuccess(`Rapport ${period} soumis — flux n° ${data.numeroFluxDepot}`);
      loadPeriods();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  const fmtPeriod = (p: string) => {
    const [y, m] = p.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h1 className="h3 mb-1">
                <i className="bi bi-file-earmark-bar-graph me-2 text-primary"></i>
                E-Reporting B2C
              </h1>
              <p className="text-muted mb-0 small">
                Déclaration mensuelle des transactions B2C non soumises à la facturation électronique (art. 290 CGI)
              </p>
            </div>
          </div>

          {/* Next due date alert */}
          <div className="alert alert-info d-flex align-items-center gap-3 mb-4">
            <i className="bi bi-calendar-check fs-4"></i>
            <div>
              <div className="fw-semibold">Prochaine échéance</div>
              <div className="small">Le rapport du mois en cours doit être soumis avant le <strong>{nextDueDate()}</strong></div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger alert-dismissible">
              {error}
              <button className="btn-close" onClick={() => setError(null)} />
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible">
              {success}
              <button className="btn-close" onClick={() => setSuccess(null)} />
            </div>
          )}

          {/* Periods table */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex align-items-center justify-content-between py-3">
              <h5 className="mb-0 fw-semibold">Historique des rapports (6 derniers mois)</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadPeriods}>
                <i className="bi bi-arrow-clockwise me-1"></i>Actualiser
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Période</th>
                    <th className="text-end">Transactions</th>
                    <th className="text-end">Total HT</th>
                    <th className="text-end">TVA</th>
                    <th className="text-end">Total TTC</th>
                    <th>Statut</th>
                    <th>N° Flux</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p) => {
                    const st = STATUS_LABELS[p.status] ?? { label: p.status, cls: 'bg-secondary' };
                    const isSubmitting = submitting === p.period;
                    const canSubmit = ['draft', 'ready', 'rejected'].includes(p.status);
                    const isSubmitted = ['submitted', 'accepted'].includes(p.status);

                    return (
                      <tr key={p.period}>
                        <td className="fw-medium">{fmtPeriod(p.period)}</td>
                        <td className="text-end">
                          {p.transactionCount === 0
                            ? <span className="text-muted">—</span>
                            : p.transactionCount}
                        </td>
                        <td className="text-end font-monospace small">{p.transactionCount > 0 ? fmt(p.totalHT) : '—'}</td>
                        <td className="text-end font-monospace small">{p.transactionCount > 0 ? fmt(p.totalTVA) : '—'}</td>
                        <td className="text-end font-monospace small fw-semibold">{p.transactionCount > 0 ? fmt(p.totalTTC) : '—'}</td>
                        <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                        <td>
                          {p.numeroFluxDepot
                            ? <span className="font-monospace small text-muted">{p.numeroFluxDepot}</span>
                            : <span className="text-muted">—</span>}
                        </td>
                        <td>
                          {isSubmitted ? (
                            <span className="text-success small">
                              <i className="bi bi-check-circle me-1"></i>
                              {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('fr-FR') : 'Soumis'}
                            </span>
                          ) : p.transactionCount === 0 ? (
                            <span className="text-muted small">Aucune transaction B2C</span>
                          ) : (
                            <div className="d-flex gap-2">
                              {p.status === 'draft' && (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => handleGenerate(p.period)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-calculator me-1"></i>Générer</>}
                                </button>
                              )}
                              {canSubmit && p.status !== 'draft' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleSubmit(p.period)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-send me-1"></i>Soumettre</>}
                                </button>
                              )}
                              {p.status === 'draft' && (
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleSubmit(p.period)}
                                  disabled={isSubmitting}
                                >
                                  {isSubmitting ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-send me-1"></i>Générer & Soumettre</>}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            Seules les factures B2C émises sont incluses. Les factures B2B et B2G sont couvertes par la facturation électronique obligatoire.
          </div>
        </div>
      </div>
    </div>
  );
}
