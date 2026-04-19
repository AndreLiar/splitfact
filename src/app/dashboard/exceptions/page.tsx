'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { evaluateInvoiceReadiness } from '@/lib/invoice-readiness';

type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number | string;
  status: string;
  workflowStatus?: string;
  clientId?: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  client?: { id?: string | null; name?: string | null; address?: string | null; email?: string | null } | null;
  items?: Array<{ id: string; description: string; quantity: number | string; unitPrice: number | string }>;
  issuerName?: string | null;
  issuerAddress?: string | null;
  legalMentions?: string | null;
};

const formatCurrency = (value: unknown) => {
  const numeric = Number(typeof value === 'string' ? value.replace(/\//g, '') : value || 0);
  if (Number.isNaN(numeric)) return '0,00 €';
  return numeric.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
};

function ExceptionCard({
  invoice,
  onResolved,
}: {
  invoice: InvoiceRecord & { readiness: ReturnType<typeof evaluateInvoiceReadiness> };
  onResolved: (id: string) => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    setResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Erreur lors de la résolution.');
      }
      onResolved(invoice.id);
    } catch (err: any) {
      setError(err.message);
      setResolving(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-xl">
      <div className="card-body p-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <h2 className="h5 mb-0">{invoice.invoiceNumber}</h2>
              <span className="badge bg-danger">Bloquée</span>
            </div>
            <div className="text-muted small mb-2">
              Client: <strong>{invoice.client?.name || invoice.clientName || 'Non renseigné'}</strong>
              {' '}• Échéance le {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="fw-semibold mb-3">{formatCurrency(invoice.totalAmount)}</div>

            {/* Blocking reasons */}
            <div className="mb-3">
              {invoice.readiness.blockingReasons.map((reason) => (
                <div key={reason.code} className="d-flex align-items-start gap-2 small text-danger mb-1">
                  <i className="bi bi-x-circle-fill flex-shrink-0 mt-1"></i>
                  <span>{reason.message}</span>
                </div>
              ))}
            </div>

            {/* Inline note + resolve */}
            {showNote && (
              <div className="mb-3">
                <textarea
                  className="form-control form-control-sm mb-2"
                  rows={2}
                  placeholder="Note optionnelle (ex: données complétées par le client)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {error && <div className="text-danger small mb-2">{error}</div>}
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    {resolving
                      ? <><span className="spinner-border spinner-border-sm me-1"></span>Résolution…</>
                      : <><i className="bi bi-check-lg me-1"></i>Confirmer la résolution</>}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => { setShowNote(false); setNote(''); setError(null); }}
                    disabled={resolving}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="d-flex flex-column gap-2 flex-shrink-0">
            {!showNote && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowNote(true)}
              >
                <i className="bi bi-check-lg me-1"></i>
                Marquer résolu
              </button>
            )}
            <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-outline-primary btn-sm">
              <i className="bi bi-pencil me-1"></i>
              Corriger les données
            </Link>
            {(invoice.client?.id || invoice.clientId) && (
              <Link
                href={`/dashboard/clients?highlight=${invoice.client?.id ?? invoice.clientId}`}
                className="btn btn-outline-secondary btn-sm"
              >
                <i className="bi bi-person-vcard me-1"></i>
                Fiche client
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/auth/signin'); return; }
    if (status === 'authenticated') void loadInvoices();
  }, [status, router]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('Impossible de charger les exceptions.');
      setInvoices(await res.json());
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolved = (id: string) => setResolvedIds((prev) => new Set([...prev, id]));

  const blockedInvoices = useMemo(() =>
    invoices
      .filter((inv) => inv.workflowStatus === 'blocked' && !resolvedIds.has(inv.id))
      .map((inv) => ({
        ...inv,
        readiness: evaluateInvoiceReadiness({
          clientName: inv.client?.name || inv.clientName,
          clientAddress: inv.client?.address || inv.clientAddress,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          issuerName: inv.issuerName,
          issuerAddress: inv.issuerAddress,
          legalMentions: inv.legalMentions,
          items: (inv.items || []).map((item) => ({
            description: item.description,
            quantity: Number(item.quantity || 0),
            unitPrice: Number(item.unitPrice || 0),
          })),
        }),
      })),
    [invoices, resolvedIds]
  );

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (error) {
    return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
  }

  const totalBlocked = blockedInvoices.reduce((s, inv) => s + Number(inv.totalAmount || 0), 0);

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-dark">Exceptions de facturation</h1>
          <p className="text-muted mb-0">Traitez les factures bloquées avant émission.</p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard/invoices?workflow=blocked" className="btn btn-outline-primary">
            Toutes les factures
          </Link>
          <Link href="/dashboard/create-invoice" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>Nouveau job
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Factures bloquées</div>
            <div className="fs-3 fw-bold text-danger">{blockedInvoices.length}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Montant bloqué</div>
            <div className="fs-3 fw-bold text-dark">{formatCurrency(totalBlocked)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Résolues cette session</div>
            <div className="fs-3 fw-bold text-success">{resolvedIds.size}</div>
          </div>
        </div>
      </div>

      {blockedInvoices.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-xl">
          <div className="card-body text-center py-5">
            <div className="mb-3 text-success fs-1"><i className="bi bi-check-circle"></i></div>
            <h4 className="text-dark">Aucune exception active</h4>
            <p className="text-muted mb-0">
              {resolvedIds.size > 0
                ? `${resolvedIds.size} exception(s) résolue(s) cette session.`
                : 'Toutes les factures sont prêtes pour revue ou déjà émises.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="vstack gap-3">
          {blockedInvoices.map((invoice) => (
            <ExceptionCard
              key={invoice.id}
              invoice={invoice}
              onResolved={handleResolved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
