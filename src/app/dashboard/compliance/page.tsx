'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCompliance } from '@/app/hooks/useApi';

const EVENT_LABELS: Record<string, string> = {
  missing_einvoice:    'Facture non soumise au PPF',
  late_submission:     'Dépôt tardif',
  e_reporting_missing: 'E-reporting manquant',
  invalid_format:      'Format invalide',
  siret_invalid:       'SIRET non validé',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

export default function CompliancePage() {
  const { status } = useSession();
  const router = useRouter();
  const { score, events, isLoading: loading } = useCompliance();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  if (loading || !score) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  const scoreColor = score.level === 'green' ? '#198754' : score.level === 'warning' ? '#fd7e14' : '#dc3545';
  const scoreBg = score.level === 'green' ? 'bg-success' : score.level === 'warning' ? 'bg-warning' : 'bg-danger';

  return (
    <div className="container-fluid mt-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">

          <div className="d-flex align-items-center gap-3 mb-4">
            <div>
              <h1 className="h3 mb-1">
                <i className="bi bi-shield-check me-2 text-primary"></i>
                Conformité e-facturation
              </h1>
              <p className="text-muted small mb-0">Score de conformité et exposition aux pénalités art. 1737 II CGI</p>
            </div>
          </div>

          {/* Score card + stats */}
          <div className="row g-4 mb-4">
            {/* Score gauge */}
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center py-4">
                  <div className="mb-2 text-muted small fw-semibold text-uppercase">Score de conformité</div>
                  <div style={{ fontSize: '4rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                    {score.score}
                  </div>
                  <div className="text-muted small">/ 100</div>
                  <div className="mt-3">
                    <span className={`badge fs-6 px-3 py-2 ${scoreBg}`}>
                      {score.level === 'green' ? 'Conforme' : score.level === 'warning' ? 'Attention requise' : 'Non conforme'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="progress" style={{ height: 8 }}>
                      <div
                        className={`progress-bar ${scoreBg}`}
                        style={{ width: `${score.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="col-md-8">
              <div className="row g-3 h-100">
                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="text-muted small mb-1">Factures émises (année)</div>
                      <div className="h2 mb-0 fw-bold">{score.issuedTotal}</div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="text-muted small mb-1">Soumises au PPF</div>
                      <div className="h2 mb-0 fw-bold text-success">{score.submittedToPpf}</div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="text-muted small mb-1">En attente PPF</div>
                      <div className={`h2 mb-0 fw-bold ${score.pendingSubmission > 0 ? 'text-warning' : 'text-success'}`}>
                        {score.pendingSubmission}
                      </div>
                      {score.pendingSubmission > 0 && (
                        <Link href="/dashboard/invoices" className="small text-warning">
                          Voir les factures →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`card border-0 shadow-sm h-100 ${score.penaltyExposure > 0 ? 'border-danger border' : ''}`}>
                    <div className="card-body">
                      <div className="text-muted small mb-1">Exposition aux pénalités</div>
                      <div className={`h3 mb-0 fw-bold ${score.penaltyExposure > 0 ? 'text-danger' : 'text-success'}`}>
                        {fmt(score.penaltyExposure)}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Max €45 000/an</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {score.pendingSubmission > 0 && (
            <div className="alert alert-warning d-flex gap-3 align-items-start mb-4">
              <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 flex-shrink-0"></i>
              <div>
                <div className="fw-semibold">{score.pendingSubmission} facture(s) B2B/B2G non soumise(s) à Chorus Pro</div>
                <div className="small">Chaque facture expose à une pénalité de €15 (art. 1737 II CGI).</div>
                <Link href="/dashboard/invoices" className="btn btn-sm btn-warning mt-2">
                  Voir et soumettre
                </Link>
              </div>
            </div>
          )}
          {score.unreportedB2C > 0 && (
            <div className="alert alert-warning d-flex gap-3 align-items-start mb-4">
              <i className="bi bi-exclamation-triangle-fill fs-5 mt-1 flex-shrink-0"></i>
              <div>
                <div className="fw-semibold">{score.unreportedB2C} transaction(s) B2C non déclarées en e-reporting</div>
                <Link href="/dashboard/e-reporting" className="btn btn-sm btn-warning mt-2">
                  Gérer l'e-reporting
                </Link>
              </div>
            </div>
          )}
          {score.score >= 80 && (
            <div className="alert alert-success d-flex gap-2 align-items-center mb-4">
              <i className="bi bi-check-circle-fill"></i>
              Votre conformité est satisfaisante. Continuez à soumettre vos factures dans les délais.
            </div>
          )}

          {/* Events log */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-semibold">Journal des événements de conformité</h5>
            </div>
            {events.length === 0 ? (
              <div className="card-body text-center text-muted py-5">
                <i className="bi bi-check2-circle fs-1 text-success mb-2 d-block"></i>
                Aucun événement de non-conformité enregistré.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th className="text-end">Pénalité</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td><span className="badge bg-secondary">{EVENT_LABELS[ev.type] ?? ev.type}</span></td>
                        <td className="small">{ev.description}</td>
                        <td className="text-end font-monospace small text-danger">{fmt(Number(ev.penaltyAmount))}</td>
                        <td>
                          {ev.resolvedAt
                            ? <span className="badge bg-success">Résolu</span>
                            : <span className="badge bg-warning text-dark">En cours</span>}
                        </td>
                        <td className="small text-muted">
                          {new Date(ev.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
