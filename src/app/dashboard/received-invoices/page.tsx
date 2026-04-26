'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useReceivedInvoices, revalidateReceivedInvoices } from '@/app/hooks/useApi';
import type { ReceivedInvoice } from '@/app/hooks/useApi';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  DEPOSEE:            { label: 'Déposée',       color: 'bg-secondary' },
  EN_COURS_DE_ROUTAGE:{ label: 'En routage',    color: 'bg-info' },
  RECUE:              { label: 'Reçue',          color: 'bg-success' },
  REJETEE:            { label: 'Rejetée',        color: 'bg-danger' },
  REFUSEE:            { label: 'Refusée',        color: 'bg-danger' },
  APPROUVEE:          { label: 'Approuvée',      color: 'bg-primary' },
  PAYEE:              { label: 'Payée',          color: 'bg-success' },
};

function fmtAmount(amount: number, currency = 'EUR') {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency });
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ReceivedInvoicesPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { invoices, error, isLoading: loading } = useReceivedInvoices(filter === 'unread');

  const unreadCount = invoices.filter((i: ReceivedInvoice) => !i.isRead).length;

  const markRead = async (id: string) => {
    await fetch(`/api/received-invoices/${id}`, { method: 'PATCH' });
    await revalidateReceivedInvoices();
  };

  const markAllRead = async () => {
    await fetch('/api/received-invoices', { method: 'PATCH' });
    await revalidateReceivedInvoices();
  };

  if (error?.status === 403) {
    return (
      <div className="container-fluid mt-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-6 text-center py-5">
            <i className="bi bi-lock-fill fs-1 text-warning mb-3 d-block"></i>
            <h2 className="h4 mb-2">Factures reçues — Plan Pro requis</h2>
            <p className="text-muted mb-4">
              La réception de factures via Chorus Pro est disponible avec le plan Pro.
            </p>
            <Link href="/dashboard/settings#billing" className="btn btn-warning fw-semibold">
              Passer au Pro — 14 jours offerts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1 className="h2 mb-1">
            <i className="bi bi-inbox me-2"></i>
            Factures reçues
          </h1>
          <p className="text-muted mb-0">
            Factures entrantes via Chorus Pro (PPF) — conformité réforme Sep 2026
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline-primary" onClick={markAllRead}>
            <i className="bi bi-check-all me-1"></i>
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm text-center py-3">
            <div className="h3 fw-bold text-primary mb-0">{invoices.length}</div>
            <small className="text-muted">Factures reçues</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm text-center py-3">
            <div className="h3 fw-bold text-warning mb-0">{unreadCount}</div>
            <small className="text-muted">Non lues</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm text-center py-3">
            <div className="h3 fw-bold text-success mb-0">
              {invoices.filter((i: ReceivedInvoice) => i.ppfStatus === 'RECUE' || i.ppfStatus === 'APPROUVEE').length}
            </div>
            <small className="text-muted">Statut conforme</small>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card shadow-subtle mb-4">
        <div className="card-body p-2">
          <div className="btn-group w-100" role="group">
            <input type="radio" className="btn-check" name="recv-filter" id="recv-all"
              checked={filter === 'all'} onChange={() => setFilter('all')} />
            <label className="btn btn-outline-primary" htmlFor="recv-all">
              <i className="bi bi-list me-1"></i>Toutes ({invoices.length})
            </label>
            <input type="radio" className="btn-check" name="recv-filter" id="recv-unread"
              checked={filter === 'unread'} onChange={() => setFilter('unread')} />
            <label className="btn btn-outline-primary" htmlFor="recv-unread">
              <i className="bi bi-dot me-1"></i>Non lues ({unreadCount})
            </label>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card shadow-subtle">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted mb-3"></i>
              <h5 className="text-muted">
                {filter === 'unread' ? 'Aucune facture non lue' : 'Aucune facture reçue'}
              </h5>
              <p className="text-muted">
                Les factures envoyées par vos fournisseurs via Chorus Pro apparaîtront ici.
              </p>
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                La synchronisation s'effectue chaque nuit à 07h00.
              </small>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {invoices.map((inv: ReceivedInvoice) => {
                const badge = STATUS_BADGE[inv.ppfStatus] ?? { label: inv.ppfStatus, color: 'bg-secondary' };
                return (
                  <div
                    key={inv.id}
                    className={`list-group-item position-relative ${!inv.isRead ? 'bg-light border-start border-primary border-3' : ''}`}
                  >
                    <div className="d-flex align-items-start gap-3">
                      <div className={`mt-1 ${!inv.isRead ? 'text-primary' : 'text-muted'}`}>
                        <i className="bi bi-file-earmark-arrow-down fs-4"></i>
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className={`mb-0 ${!inv.isRead ? 'fw-bold' : ''}`}>
                            {inv.supplierName}
                          </h6>
                          <div className="d-flex align-items-center gap-2 ms-2 flex-shrink-0">
                            <span className={`badge ${badge.color} text-white`}>{badge.label}</span>
                            {!inv.isRead && <span className="badge bg-primary">Nouveau</span>}
                          </div>
                        </div>

                        <div className="d-flex flex-wrap gap-3 text-muted small mb-2">
                          <span>
                            <i className="bi bi-hash me-1"></i>
                            {inv.invoiceNumber || '—'}
                          </span>
                          {inv.supplierSiret && (
                            <span>
                              <i className="bi bi-building me-1"></i>
                              SIRET {inv.supplierSiret}
                            </span>
                          )}
                          <span>
                            <i className="bi bi-calendar3 me-1"></i>
                            Reçue le {fmtDate(inv.depositedAt ?? inv.createdAt)}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-semibold text-dark">
                            {fmtAmount(Number(inv.totalAmountTTC), inv.currency)}
                          </span>
                          <div className="btn-group btn-group-sm">
                            {!inv.isRead && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => markRead(inv.id)}
                                title="Marquer comme lu"
                              >
                                <i className="bi bi-check"></i>
                              </button>
                            )}
                            <button
                              className="btn btn-outline-secondary"
                              onClick={async () => {
                                const res = await fetch(`/api/received-invoices/${inv.id}`);
                                const data = await res.json();
                                if (data.rawXml) {
                                  const blob = new Blob([data.rawXml], { type: 'application/xml' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${inv.invoiceNumber || inv.cppId}.xml`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                } else {
                                  alert('XML non disponible pour cette facture.');
                                }
                                if (!inv.isRead) markRead(inv.id);
                              }}
                              title="Télécharger XML Factur-X"
                            >
                              <i className="bi bi-download me-1"></i>XML
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info callout */}
      <div className="alert alert-info mt-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Réforme e-invoicing — Sep 2026 :</strong> Toute entreprise assujettie à la TVA doit être capable
        de recevoir des factures électroniques. Cette inbox centralise les factures entrantes depuis Chorus Pro.
      </div>
    </div>
  );
}
