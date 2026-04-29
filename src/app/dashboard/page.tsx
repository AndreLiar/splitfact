'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import PWAInstallPrompt from "@/app/components/PWAInstallPrompt";
import ReformReadinessWidget from "@/app/components/ReformReadinessWidget";
import { useRecentInvoices, useAllInvoices, useClients, useCurrentUser, useQuota } from "@/app/hooks/useApi";
import { useEffect, useState } from "react";


export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const enabled = status === 'authenticated';
  const { invoices: recentInvoices, isLoading: recentLoading, error: recentError } = useRecentInvoices(6);
  const { invoices: allInvoices, isLoading: allLoading } = useAllInvoices();
  const { clients, isLoading: clientsLoading } = useClients();
  const { userProfile } = useCurrentUser();
  const { quota } = useQuota();

  const loading = recentLoading || allLoading || clientsLoading;

  // Chorus Pro banner: Pro user + has issued B2G invoice + no credentials configured yet
  const [pisteConfigured, setPisteConfigured] = useState<boolean | null>(null);
  const hasIssuedB2G = allInvoices.some(
    (i) => (i as any).transactionType === 'B2G' && (i as any).workflowStatus === 'issued'
  );
  useEffect(() => {
    if (quota?.plan !== 'pro' || !hasIssuedB2G) return;
    fetch('/api/settings/piste-credentials')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setPisteConfigured(!!(d.pisteClientSecretSet && d.cproTechPasswordSet));
      })
      .catch(() => {});
  }, [quota?.plan, hasIssuedB2G]);
  const error = recentError?.message ?? null;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Redirect to onboarding when data loaded and user has no activity
  useEffect(() => {
    if (!enabled || loading) return;
    const hasClients = clients.length > 0;
    const hasInvoices = allInvoices.length > 0;
    if (!hasClients && !hasInvoices) {
      router.push('/dashboard/onboarding');
    }
  }, [enabled, loading, clients.length, allInvoices.length, router]);

  const metrics = useMemo(() => {
    const today = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(today.getDate() + 7);
    const PPF_TERMINAL = new Set(['approuvee', 'payee', 'rejetee']);

    return allInvoices.reduce(
      (acc, invoice) => {
        const amount = Number(invoice.totalAmount || 0);

        acc.total += amount;

        if (invoice.paymentStatus === "paid") {
          acc.received += amount;
        } else {
          acc.pending += amount;
          // Outstanding = issued invoices that are unpaid (money actually owed)
          if (invoice.workflowStatus === 'issued') {
            acc.outstanding += amount;
          }
        }

        if (invoice.status === "draft") {
          acc.drafts += 1;
        }

        const dueDate = new Date(invoice.dueDate);
        if (invoice.paymentStatus !== "paid" && dueDate < today) {
          acc.overdue += 1;
          if (invoice.workflowStatus === 'issued') {
            acc.overdueAmount += amount;
          }
        }

        if (invoice.paymentStatus !== "paid" && dueDate >= today && dueDate <= inSevenDays) {
          acc.dueSoon += 1;
        }

        // Issued invoices not yet accepted/rejected by Chorus Pro
        if (invoice.workflowStatus === 'issued' && !PPF_TERMINAL.has(invoice.ppfStatus ?? '')) {
          acc.pendingPpf += 1;
        }

        return acc;
      },
      { total: 0, received: 0, pending: 0, outstanding: 0, overdueAmount: 0, drafts: 0, overdue: 0, dueSoon: 0, pendingPpf: 0 }
    );
  }, [allInvoices]);

  if (status === "loading" || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>;
  }

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h1 className="mb-2 text-darkGray">
            <i className="bi bi-grid-1x2-fill me-3 text-primary"></i>
            Cockpit de facturation
          </h1>
          <p className="text-muted mb-0">
            Suivez vos factures, vos encaissements et les points de blocage avant émission.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/dashboard/create-invoice" className="btn btn-primary">
            <i className="bi bi-file-earmark-plus me-2"></i>
            Nouvelle facture
          </Link>
          <Link href="/dashboard/clients" className="btn btn-outline-primary">
            <i className="bi bi-person-vcard me-2"></i>
            Gérer les clients
          </Link>
        </div>
      </div>

      <div className="d-none d-lg-block mb-4">
        <PWAInstallPrompt />
      </div>

      <ReformReadinessWidget />

      {/* ── Chorus Pro credentials missing ─────────────────── */}
      {quota?.plan === 'pro' && hasIssuedB2G && pisteConfigured === false && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between py-2 mb-3" style={{ fontSize: '0.875rem' }}>
          <span>
            <i className="bi bi-shield-exclamation me-2"></i>
            Vous avez des factures B2G émises — configurez vos identifiants Chorus Pro pour les déposer sur le PPF.
          </span>
          <Link href="/dashboard/settings#chorus-pro" className="btn btn-sm btn-warning text-nowrap ms-3">
            Configurer
          </Link>
        </div>
      )}

      {/* ── Free plan quota ────────────────────────────────── */}
      {quota?.plan === 'free' && quota.limit !== null && (
        <div className={`alert d-flex align-items-center justify-content-between py-2 mb-3 ${quota.remaining === 0 ? 'alert-danger' : quota.remaining! <= 2 ? 'alert-warning' : 'alert-info'}`} style={{ fontSize: '0.875rem' }}>
          <span>
            <i className={`bi ${quota.remaining === 0 ? 'bi-x-circle-fill' : 'bi-info-circle-fill'} me-2`}></i>
            {quota.remaining === 0
              ? `Limite mensuelle atteinte — ${quota.used}/${quota.limit} factures. Passez au Pro pour continuer.`
              : `Plan gratuit — ${quota.used}/${quota.limit} factures ce mois (${quota.remaining} restante${quota.remaining! > 1 ? 's' : ''})`}
          </span>
          {quota.remaining === 0 && (
            <Link href="/dashboard/settings" className="btn btn-sm btn-danger text-nowrap ms-3">
              Passer au Pro
            </Link>
          )}
        </div>
      )}

      {/* ── Compliance Readiness ───────────────────────────── */}
      {userProfile && (() => {
        const p = userProfile as any;
        const checks = [
          { label: "SIRET renseigné", done: !!p.siret },
          { label: "Adresse complète", done: !!p.address },
          { label: "Statut juridique", done: !!p.legalStatus },
          { label: "Code APE", done: !!p.apeCode },
          { label: "Numéro de TVA", done: !!p.tvaNumber },
          { label: "Régime fiscal", done: !!p.fiscalRegime },
        ];
        const done = checks.filter(c => c.done).length;
        const pct = Math.round((done / checks.length) * 100);
        if (pct === 100) return null;
        return (
          <div className="card shadow-sm border-0 rounded-xl p-4 mb-4" style={{ borderLeft: "3px solid #D4921A" }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h2 className="h6 mb-1 d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-warning"></i>
                  Conformité réforme 2026
                </h2>
                <p className="text-muted small mb-0">
                  Complétez votre profil pour que vos factures passent le portail PPF sans rejet.
                </p>
              </div>
              <Link href="/dashboard/settings" className="btn btn-sm btn-outline-warning text-nowrap">
                Compléter
              </Link>
            </div>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="progress flex-grow-1" style={{ height: "8px" }}>
                <div
                  className={`progress-bar ${pct === 100 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-danger"}`}
                  style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                />
              </div>
              <span className="fw-semibold text-nowrap" style={{ fontSize: "0.875rem" }}>{done}/{checks.length}</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {checks.map(c => (
                <span key={c.label} className={`badge rounded-pill ${c.done ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"}`}
                      style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                  <i className={`bi ${c.done ? "bi-check-circle-fill" : "bi-x-circle-fill"} me-1`}></i>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-primary">
            <div className="section-label mb-2">Volume facturé</div>
            <div className="metric-value text-primary">{formatCurrency(metrics.total)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-success">
            <div className="section-label mb-2">Encaissements</div>
            <div className="metric-value text-success">{formatCurrency(metrics.received)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-warning">
            <div className="section-label mb-2">Créances en cours</div>
            <div className="metric-value text-warning">{formatCurrency(metrics.outstanding)}</div>
            {metrics.overdueAmount > 0 && (
              <div className="text-danger small mt-1">
                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                {formatCurrency(metrics.overdueAmount)} en retard
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card h-100 p-4 stat-card-secondary">
            <div className="section-label mb-2">Brouillons</div>
            <div className="metric-value">{metrics.drafts}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3">État du workflow</h2>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Brouillons à compléter</span>
              <strong>{metrics.drafts}</strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Factures à risque</span>
              <strong className="text-danger">{metrics.overdue}</strong>
            </div>
            <div className="d-flex justify-content-between py-2 border-bottom">
              <span className="text-muted">Échéance sous 7 jours</span>
              <strong className="text-warning">{metrics.dueSoon}</strong>
            </div>
            {metrics.pendingPpf > 0 && (
              <div className="d-flex justify-content-between align-items-center py-2">
                <span className="text-muted d-flex align-items-center gap-1">
                  <i className="bi bi-building-check" style={{ color: '#D4921A' }}></i>
                  En attente Chorus Pro
                </span>
                <Link href="/dashboard/invoices" className="badge text-decoration-none" style={{ backgroundColor: 'rgba(212,146,26,0.15)', color: '#D4921A', fontWeight: 600 }}>
                  {metrics.pendingPpf} à soumettre
                </Link>
              </div>
            )}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3">Actions prioritaires</h2>
            <div className="d-grid gap-2">
              <Link href="/dashboard/create-invoice" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Créer une nouvelle facture
              </Link>
              <Link href="/dashboard/invoices" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Revoir les factures en attente
              </Link>
              <Link href="/dashboard/clients" className="btn btn-outline-primary text-start">
                <i className="bi bi-arrow-right-circle me-2"></i>
                Vérifier les données client
              </Link>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl p-4 h-100">
            <h2 className="h5 mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-danger"></i>
              Relances à faire
            </h2>
            {metrics.overdue === 0 && metrics.dueSoon === 0 ? (
              <p className="text-muted small mb-0">
                <i className="bi bi-check-circle text-success me-1"></i>
                Aucune facture en retard ou à relancer.
              </p>
            ) : (
              <>
                {metrics.overdue > 0 && (
                  <div className="alert alert-danger py-2 mb-2 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span><strong>{metrics.overdue}</strong> facture{metrics.overdue > 1 ? 's' : ''} en retard</span>
                  </div>
                )}
                {metrics.dueSoon > 0 && (
                  <div className="alert alert-warning py-2 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-hourglass-split"></i>
                    <span><strong>{metrics.dueSoon}</strong> facture{metrics.dueSoon > 1 ? 's' : ''} à échéance sous 7j</span>
                  </div>
                )}
                <Link href="/dashboard/invoices?paymentStatus=pending" className="btn btn-sm btn-outline-danger">
                  Voir les factures à relancer
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-xl p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h5 mb-1">Factures récentes</h2>
            <p className="text-muted small mb-0">Vos dernières factures créées ou en cours de suivi.</p>
          </div>
          <Link href="/dashboard/invoices" className="btn btn-sm btn-outline-primary">
            Voir toutes les factures
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="text-center py-5">
            <div className="bg-light rounded-3 p-4 d-inline-block mb-3">
              <i className="bi bi-receipt display-4 text-muted"></i>
            </div>
            <h6 className="text-dark mb-2">Aucune facture pour l'instant</h6>
            <p className="text-muted small mb-3">Créez votre première facture pour lancer votre workflow de billing.</p>
            <Link href="/dashboard/create-invoice" className="btn btn-primary rounded-3">
              <i className="bi bi-plus-circle me-2"></i>
              Créer une facture
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Facture</th>
                  <th>Client</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => {
                  const amount = Number(invoice.totalAmount || 0);
                  const overdue = invoice.paymentStatus !== "paid" && new Date(invoice.dueDate) < new Date();

                  return (
                    <tr key={invoice.id}>
                      <td>
                        <div className="fw-semibold">{invoice.invoiceNumber || invoice.id.slice(0, 8)}</div>
                        <small className="text-muted">{new Date(invoice.invoiceDate).toLocaleDateString("fr-FR")}</small>
                      </td>
                      <td>{invoice.client?.name || "Client non renseigné"}</td>
                      <td className="fw-semibold">{formatCurrency(amount)}</td>
                      <td>
                        <span className={`badge ${invoice.paymentStatus === "paid" ? "bg-success" : overdue ? "bg-danger" : "bg-warning text-dark"}`}>
                          {invoice.paymentStatus === "paid" ? "Payée" : overdue ? "En retard" : "En attente"}
                        </span>
                      </td>
                      <td className="text-end">
                        <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-sm btn-outline-secondary">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
