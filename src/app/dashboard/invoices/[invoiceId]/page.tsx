'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { evaluateInvoiceReadiness, type InvoiceReadinessReason } from '@/lib/invoice-readiness';

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number | string;
  status: string;
  paymentStatus: string;
  workflowStatus?: string;
  issuedAt?: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  clientSiret?: string | null;
  clientEmail?: string | null;
  collective?: { name?: string | null } | null;
  client?: {
    name?: string | null;
    email?: string | null;
    address?: string | null;
    siret?: string | null;
    tvaNumber?: string | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    tvaRate?: number | string;
  }>;
  shares?: Array<{
    id: string;
    shareType: string;
    shareValue: number | string;
    calculatedAmount: number | string;
    user?: { name?: string | null; email?: string | null } | null;
  }>;
  paymentTerms?: string | null;
  latePenaltyRate?: string | null;
  recoveryIndemnity?: number | string | null;
  legalMentions?: string | null;
  pdfUrl?: string | null;
  facturxPdfUrl?: string | null;
  facturxXmlUrl?: string | null;
  facturxStatus?: string | null;
  facturxGeneratedAt?: string | null;
  facturxValidationErrors?: string[] | InvoiceReadinessReason[] | null;
  transactionType?: string | null;
  ppfStatus?: string | null;
  ppfTrackingId?: string | null;
  ppfSubmittedAt?: string | null;
  ppfLastEventAt?: string | null;
  ppfError?: string | null;
  issuerName?: string | null;
  issuerAddress?: string | null;
  issuerSiret?: string | null;
  issuerTva?: string | null;
  issuerRcs?: string | null;
  issuerLegalStatus?: string | null;
  issuerShareCapital?: string | null;
  issuerApeCode?: string | null;
};

type SubInvoice = {
  id: string;
  amount: number | string;
  status: string;
  receiver?: { name?: string | null; email?: string | null } | null;
};

const formatCurrency = (value: unknown) => {
  const cleaned = typeof value === 'string' ? value.replace(/\//g, '') : value;
  const numeric = Number(cleaned || 0);
  if (Number.isNaN(numeric)) return '0,00 €';

  return numeric.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });
};

const formatStatus = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Brouillon';
    case 'sent':
      return 'Envoyée';
    case 'paid':
      return 'Payée';
    default:
      return status;
  }
};

const formatWorkflowStatus = (status?: string) => {
  switch (status) {
    case 'triggered':
      return 'Déclenchée';
    case 'collecting_data':
      return 'Collecte en cours';
    case 'blocked':
      return 'Bloquée';
    case 'ready_for_review':
      return 'Prête pour revue';
    case 'ready_to_issue':
      return "Prête à émettre";
    case 'issued':
      return 'Émise';
    default:
      return status || 'Non défini';
  }
};

const getWorkflowBadgeClass = (status?: string) => {
  switch (status) {
    case 'issued':
      return 'bg-success';
    case 'ready_for_review':
    case 'ready_to_issue':
      return 'bg-primary';
    case 'blocked':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

const formatFacturxStatus = (status?: string | null) => {
  switch (status) {
    case 'not_started':
      return 'Non généré';
    case 'generating':
      return 'Génération en cours';
    case 'generated':
      return 'Généré';
    case 'validation_failed':
      return 'Validation échouée';
    default:
      return status || 'Non défini';
  }
};

const getFacturxBadgeClass = (status?: string | null) => {
  switch (status) {
    case 'generated':
      return 'bg-success';
    case 'generating':
      return 'bg-primary';
    case 'validation_failed':
      return 'bg-danger';
    default:
      return 'bg-secondary';
  }
};

const ppfStatusLabel = (status?: string | null): string => {
  switch (status) {
    case 'not_submitted':     return 'Non déposée';
    case 'pending_retry':     return 'Dépôt en attente';
    case 'deposee':           return 'Déposée sur Chorus Pro';
    case 'en_cours_de_routage': return 'En cours de routage';
    case 'recue':             return 'Reçue par le destinataire';
    case 'rejetee':           return 'Rejetée';
    case 'refusee':           return 'Refusée';
    case 'approuvee':         return 'Approuvée';
    case 'payee':             return 'Payée (PPF)';
    default:                  return status ?? 'Non déposée';
  }
};

const ppfBadgeClass = (status?: string | null): string => {
  switch (status) {
    case 'deposee':
    case 'en_cours_de_routage': return 'bg-primary';
    case 'recue':
    case 'approuvee':
    case 'payee':             return 'bg-success';
    case 'rejetee':
    case 'refusee':           return 'bg-danger';
    case 'pending_retry':     return 'bg-warning text-dark';
    default:                  return 'bg-secondary';
  }
};

const paymentBadge = (paymentStatus: string, dueDate: string) => {
  if (paymentStatus === 'paid') {
    return { label: 'Payée', className: 'bg-success' };
  }

  if (new Date(dueDate) < new Date()) {
    return { label: 'En retard', className: 'bg-danger' };
  }

  return { label: 'En attente', className: 'bg-warning text-dark' };
};

export default function InvoiceDetailPage({ params: paramsPromise }: { params: Promise<{ invoiceId: string }> }) {
  const params = use(paramsPromise);
  const { status } = useSession();
  const router = useRouter();
  const { invoiceId } = params;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [subInvoices, setSubInvoices] = useState<SubInvoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; action: string; createdAt: string; metadata?: any; user?: { name?: string | null; email?: string | null } }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [subInvoiceGenerating, setSubInvoiceGenerating] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [issuingInvoice, setIssuingInvoice] = useState(false);
  const [submittingPpf, setSubmittingPpf] = useState(false);
  const [ppfError, setPpfError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      void loadInvoice();
    }
  }, [status, router, invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const [invoiceResponse, subInvoicesResponse, activityResponse, userResponse] = await Promise.all([
        fetch(`/api/invoices/${invoiceId}`),
        fetch(`/api/invoices/${invoiceId}/sub-invoices`),
        fetch(`/api/invoices/${invoiceId}/activity`),
        fetch('/api/users/me'),
      ]);

      if (!invoiceResponse.ok) {
        const errorData = await invoiceResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impossible de charger la facture.');
      }

      const invoiceData = await invoiceResponse.json();
      setInvoice(invoiceData);

      if (subInvoicesResponse.ok) {
        const subInvoicesData = await subInvoicesResponse.json();
        setSubInvoices(subInvoicesData || []);
      } else {
        setSubInvoices([]);
      }

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivityLogs(activityData.logs || []);
      }

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setStripeConnected(!!userData?.stripeAccountId);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la facture.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfGenerating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impossible de générer le PDF.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleGenerateSubInvoices = async () => {
    setSubInvoiceGenerating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/generate-subinvoice`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impossible de générer les sous-factures.');
      }

      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubInvoiceGenerating(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentStatus: 'paid' | 'pending') => {
    setUpdatingPayment(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Impossible de mettre à jour le statut de paiement.');
      }

      await loadInvoice();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPayment(false);
    }
  };

  const readiness = useMemo(() => {
    if (!invoice) return null;

    return evaluateInvoiceReadiness({
      clientName: invoice.client?.name || invoice.clientName,
      clientAddress: invoice.client?.address || invoice.clientAddress,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      issuerName: invoice.issuerName,
      issuerAddress: invoice.issuerAddress,
      legalMentions: invoice.legalMentions,
      items: (invoice.items || []).map((item) => ({
        description: item.description,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      })),
    });
  }, [invoice]);

  const handleIssueInvoice = async () => {
    setIssuingInvoice(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/issue`, {
        method: 'POST',
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "Impossible d'émettre la facture.");
      }

      await loadInvoice();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'émission.");
    } finally {
      setIssuingInvoice(false);
    }
  };

  const handleSubmitPpf = async () => {
    setSubmittingPpf(true);
    setPpfError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/submit-ppf`, { method: 'POST' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Échec du dépôt sur Chorus Pro');
      await loadInvoice();
    } catch (err: any) {
      setPpfError(err.message);
    } finally {
      setSubmittingPpf(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <div className="fw-semibold mb-2">Erreur</div>
          <div>{error}</div>
          <div className="mt-3 d-flex gap-2">
            <Link href="/dashboard/invoices" className="btn btn-primary">
              Retour aux factures
            </Link>
            <button onClick={() => void loadInvoice()} className="btn btn-outline-primary">
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="alert alert-warning mt-4">Facture introuvable.</div>;
  }

  const payment = paymentBadge(invoice.paymentStatus, invoice.dueDate);
  const isEditable = ['triggered', 'collecting_data', 'blocked', 'ready_for_review'].includes(invoice.workflowStatus ?? '');

  const handleStartEdit = () => {
    setEditFields({
      clientName: invoice.clientName ?? invoice.client?.name ?? '',
      clientAddress: invoice.clientAddress ?? invoice.client?.address ?? '',
      clientEmail: invoice.clientEmail ?? invoice.client?.email ?? '',
      clientSiret: invoice.clientSiret ?? invoice.client?.siret ?? '',
      dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
      legalMentions: invoice.legalMentions ?? '',
      paymentTerms: invoice.paymentTerms ?? '',
    });
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      });
      if (!res.ok) throw new Error('Échec de la mise à jour.');
      await loadInvoice();
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="container-fluid py-3 py-lg-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <div className="text-muted small mb-2">Facture</div>
          <h1 className="mb-1 text-darkGray">{invoice.invoiceNumber}</h1>
          <p className="text-muted mb-0">
            Créée le {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')} • échéance le{' '}
            {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link href="/dashboard/invoices" className="btn btn-outline-secondary">
            Retour
          </Link>
          {isEditable && !editing && (
            <button className="btn btn-outline-primary" onClick={handleStartEdit}>
              <i className="bi bi-pencil me-1"></i>Modifier
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleIssueInvoice}
            disabled={issuingInvoice || readiness?.status === 'blocked' || invoice.workflowStatus === 'issued'}
          >
            {issuingInvoice ? 'Émission...' : invoice.workflowStatus === 'issued' ? 'Déjà émise' : 'Émettre la facture'}
          </button>
          <button className="btn btn-outline-primary" onClick={handleGeneratePdf} disabled={pdfGenerating}>
            {pdfGenerating ? 'Génération...' : 'Générer le PDF'}
          </button>
          <button
            className="btn btn-outline-success"
            onClick={() => handleUpdatePaymentStatus(invoice.paymentStatus === 'paid' ? 'pending' : 'paid')}
            disabled={updatingPayment}
          >
            {invoice.paymentStatus === 'paid' ? 'Repasser en attente' : 'Marquer comme payée'}
          </button>
          {invoice.workflowStatus === 'issued' && invoice.paymentStatus !== 'paid' && stripeConnected && (
            <a
              href={`/invoices/${invoice.id}/pay`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-success"
            >
              <i className="bi bi-credit-card me-1"></i>
              Lien de paiement
            </a>
          )}
          {invoice.workflowStatus === 'issued' && (invoice.facturxPdfUrl || invoice.pdfUrl) && (
            <a
              href={invoice.facturxPdfUrl ?? invoice.pdfUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-success"
              download
            >
              <i className="bi bi-download me-1"></i>
              Télécharger Factur-X
            </a>
          )}
          {invoice.workflowStatus === 'issued' && invoice.facturxPdfUrl && (
            <button
              className="btn btn-primary"
              onClick={handleSubmitPpf}
              disabled={
                submittingPpf ||
                (!!invoice.ppfStatus && !['not_submitted', 'pending_retry'].includes(invoice.ppfStatus))
              }
              title="Déposer sur le Portail Public de Facturation (Chorus Pro)"
            >
              {submittingPpf ? (
                <><span className="spinner-border spinner-border-sm me-1" />Dépôt...</>
              ) : invoice.ppfStatus && invoice.ppfStatus !== 'not_submitted' ? (
                <><i className="bi bi-building-check me-1"></i>{ppfStatusLabel(invoice.ppfStatus)}</>
              ) : (
                <><i className="bi bi-send me-1"></i>Déposer sur Chorus Pro</>
              )}
            </button>
          )}
          {invoice.workflowStatus === 'issued' && invoice.paymentStatus !== 'paid' && (
            <button
              className={`btn ${reminderSent ? 'btn-success' : 'btn-outline-warning'}`}
              onClick={async () => {
                setSendingReminder(true);
                try {
                  const res = await fetch(`/api/invoices/${invoiceId}/remind`, { method: 'POST' });
                  if (res.ok) {
                    setReminderSent(true);
                    setActivityLogs((prev) => [{
                      id: Date.now().toString(),
                      action: 'reminder_sent',
                      createdAt: new Date().toISOString(),
                      user: undefined,
                    }, ...prev]);
                  }
                } finally {
                  setSendingReminder(false);
                }
              }}
              disabled={sendingReminder || reminderSent}
            >
              <i className="bi bi-envelope me-1"></i>
              {reminderSent ? 'Rappel enregistré' : sendingReminder ? 'Envoi...' : 'Envoyer un rappel'}
            </button>
          )}
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Montant</div>
            <div className="fs-3 fw-bold text-primary">{formatCurrency(invoice.totalAmount)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Paiement</div>
            <div><span className={`badge ${payment.className}`}>{payment.label}</span></div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Statut facture</div>
            <div className="fw-semibold">{formatStatus(invoice.status)}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-xl p-4 h-100">
            <div className="text-muted small mb-2">Workflow</div>
            <div>
              <span className={`badge ${getWorkflowBadgeClass(invoice.workflowStatus)}`}>
                {formatWorkflowStatus(invoice.workflowStatus)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="card border-0 shadow-sm rounded-xl p-4 mb-4 border-start border-primary border-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0"><i className="bi bi-pencil-square me-2 text-primary"></i>Modifier la facture</h2>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditing(false)}>Annuler</button>
          </div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Nom du client</label>
              <input className="form-control form-control-sm" value={editFields.clientName ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, clientName: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Email client</label>
              <input type="email" className="form-control form-control-sm" value={editFields.clientEmail ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, clientEmail: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Adresse client</label>
              <input className="form-control form-control-sm" value={editFields.clientAddress ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, clientAddress: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">SIRET client</label>
              <input className="form-control form-control-sm" value={editFields.clientSiret ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, clientSiret: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Date d'échéance</label>
              <input type="date" className="form-control form-control-sm" value={editFields.dueDate ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Conditions de paiement</label>
              <input className="form-control form-control-sm" value={editFields.paymentTerms ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, paymentTerms: e.target.value }))} />
            </div>
            <div className="col-12">
              <label className="form-label small fw-semibold">Mentions légales</label>
              <textarea className="form-control form-control-sm" rows={2} value={editFields.legalMentions ?? ''} onChange={(e) => setEditFields((p) => ({ ...p, legalMentions: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3">
            <button className="btn btn-primary btn-sm me-2" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Lignes de facture</h2>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qté</th>
                    <th>PU</th>
                    <th>TVA</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).length > 0 ? (
                    invoice.items!.map((item) => (
                      <tr key={item.id}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{Number(item.tvaRate || 0)}%</td>
                        <td>{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">Aucune ligne de facture</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {invoice.shares && invoice.shares.length > 0 && (
            <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Répartition collective</h2>
                <button className="btn btn-sm btn-outline-primary" onClick={handleGenerateSubInvoices} disabled={subInvoiceGenerating}>
                  {subInvoiceGenerating ? 'Génération...' : 'Générer les sous-factures'}
                </button>
              </div>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Membre</th>
                      <th>Type</th>
                      <th>Valeur</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.shares.map((share) => (
                      <tr key={share.id}>
                        <td>{share.user?.name || share.user?.email || 'Membre inconnu'}</td>
                        <td>{share.shareType}</td>
                        <td>{share.shareType === 'percent' ? `${share.shareValue}%` : formatCurrency(share.shareValue)}</td>
                        <td>{formatCurrency(share.calculatedAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subInvoices.length > 0 && (
            <div className="card border-0 shadow-sm rounded-xl p-4">
              <h2 className="h5 mb-3">Sous-factures générées</h2>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Destinataire</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subInvoices.map((subInvoice) => (
                      <tr key={subInvoice.id}>
                        <td><code>{subInvoice.id.slice(0, 8)}...</code></td>
                        <td>{subInvoice.receiver?.name || subInvoice.receiver?.email || 'N/A'}</td>
                        <td>{formatCurrency(subInvoice.amount)}</td>
                        <td>{formatStatus(subInvoice.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Préparation à l'émission</h2>
            {readiness && (
              <div className="vstack gap-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span>État global</span>
                  <span className={`badge ${readiness.status === 'ready' ? 'bg-success' : 'bg-danger'}`}>
                    {readiness.status === 'ready' ? 'Prête à émettre' : 'Bloquée'}
                  </span>
                </div>
                {readiness.status === 'blocked' ? (
                  readiness.blockingReasons.map((reason) => (
                    <div key={reason.code} className="small text-muted">
                      • {reason.message}
                    </div>
                  ))
                ) : (
                  <div className="small text-muted">
                    Les données minimales d'émission sont présentes.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Sortie Factur-X</h2>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">Statut</span>
              <span className={`badge ${getFacturxBadgeClass(invoice.facturxStatus)}`}>
                {formatFacturxStatus(invoice.facturxStatus)}
              </span>
            </div>
            {invoice.facturxGeneratedAt && (
              <div className="small text-muted mb-3">
                Généré le {new Date(invoice.facturxGeneratedAt).toLocaleDateString('fr-FR')} à{' '}
                {new Date(invoice.facturxGeneratedAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
            <div className="d-grid gap-2">
              <a
                href={invoice.facturxPdfUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-outline-primary ${invoice.facturxPdfUrl ? '' : 'disabled'}`}
              >
                Télécharger le PDF Factur-X
              </a>
              <a
                href={invoice.facturxXmlUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn btn-outline-secondary ${invoice.facturxXmlUrl ? '' : 'disabled'}`}
              >
                Télécharger le XML CII
              </a>
              <a
                href={`/api/invoices/${invoice.id}/ubl`}
                className="btn btn-outline-secondary"
                download
              >
                <i className="bi bi-file-code me-1"></i>Télécharger UBL 2.1
              </a>
            </div>
            {Array.isArray(invoice.facturxValidationErrors) && invoice.facturxValidationErrors.length > 0 && (
              <div className="mt-3">
                <div className="text-muted small mb-2">Erreurs de validation</div>
                <div className="small text-danger">
                  {invoice.facturxValidationErrors.map((error, index) => (
                    <div key={index}>• {typeof error === 'string' ? error : error.message}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PPF / Chorus Pro status card */}
          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">
              <i className="bi bi-building me-2 text-primary"></i>
              Chorus Pro (PPF)
            </h2>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-muted small">Statut</span>
              <span className={`badge ${ppfBadgeClass(invoice.ppfStatus)}`}>
                {ppfStatusLabel(invoice.ppfStatus)}
              </span>
            </div>
            {invoice.ppfTrackingId && (
              <div className="text-muted small mb-2">
                Identifiant CPP : <code>{invoice.ppfTrackingId}</code>
              </div>
            )}
            {invoice.ppfSubmittedAt && (
              <div className="text-muted small mb-2">
                Déposée le {new Date(invoice.ppfSubmittedAt).toLocaleDateString('fr-FR')}
              </div>
            )}
            {invoice.ppfLastEventAt && invoice.ppfSubmittedAt !== invoice.ppfLastEventAt && (
              <div className="text-muted small mb-2">
                Dernier événement le {new Date(invoice.ppfLastEventAt).toLocaleDateString('fr-FR')}
              </div>
            )}
            {invoice.ppfError && (
              <div className="alert alert-danger small mb-2 py-2">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {invoice.ppfError}
              </div>
            )}
            {ppfError && (
              <div className="alert alert-danger small mb-2 py-2">
                <i className="bi bi-exclamation-triangle me-1"></i>
                {ppfError}
              </div>
            )}
            {invoice.workflowStatus === 'issued' && invoice.facturxPdfUrl &&
              (!invoice.ppfStatus || ['not_submitted', 'pending_retry'].includes(invoice.ppfStatus)) && (
              <button
                className="btn btn-primary btn-sm w-100 mt-2"
                onClick={handleSubmitPpf}
                disabled={submittingPpf}
              >
                {submittingPpf
                  ? <><span className="spinner-border spinner-border-sm me-1" />Dépôt en cours...</>
                  : <><i className="bi bi-send me-1"></i>Déposer sur Chorus Pro</>}
              </button>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Client</h2>
            <div className="mb-2 fw-semibold">{invoice.client?.name || invoice.clientName || 'Client non renseigné'}</div>
            <div className="text-muted small mb-2">{invoice.client?.email || invoice.clientEmail || 'Email non renseigné'}</div>
            <div className="text-muted small mb-2">{invoice.client?.address || invoice.clientAddress || 'Adresse non renseignée'}</div>
            <div className="text-muted small">SIRET: {invoice.client?.siret || invoice.clientSiret || 'Non renseigné'}</div>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Émission</h2>
            <div className="text-muted small mb-2">Date d'émission</div>
            <div className="mb-3">
              {invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('fr-FR') : 'Non émise'}
            </div>
            <div className="text-muted small mb-2">Collectif</div>
            <div>{invoice.collective?.name || 'Aucun collectif'}</div>
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4 mb-4">
            <h2 className="h5 mb-3">Historique des actions</h2>
            {activityLogs.length === 0 ? (
              <div className="text-muted small">Aucune action enregistrée.</div>
            ) : (
              <div style={{ borderLeft: '2px solid #e9ecef', paddingLeft: '1rem' }}>
                {activityLogs.map((log) => (
                  <div key={log.id} className="mb-3 position-relative">
                    <div
                      style={{
                        width: 10, height: 10,
                        borderRadius: '50%',
                        background: log.action === 'issued' ? '#198754' : log.action === 'blocked' ? '#dc3545' : '#6c757d',
                        position: 'absolute', left: '-1.4rem', top: 4,
                      }}
                    />
                    <div className="fw-semibold small">
                      {log.action === 'issued' && '✓ Facture émise'}
                      {log.action === 'blocked' && '⚠ Facture bloquée'}
                      {log.action === 'exception_resolved' && '↩ Exception résolue'}
                      {log.action === 'reminder_sent' && '📧 Rappel envoyé'}
                      {log.action === 'facturx_generated' && '✓ Factur-X généré'}
                      {log.action === 'facturx_failed' && '✗ Génération Factur-X échouée'}
                      {log.action === 'workflow_updated' && '→ Workflow mis à jour'}
                      {log.action === 'readiness_changed' && '→ Readiness modifiée'}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {log.user?.name || log.user?.email || 'Système'} — {new Date(log.createdAt).toLocaleDateString('fr-FR')} {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {log.metadata?.note && (
                      <div className="small text-muted fst-italic mt-1">"{log.metadata.note}"</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card border-0 shadow-sm rounded-xl p-4">
            <h2 className="h5 mb-3">Conditions et mentions</h2>
            <div className="mb-3">
              <div className="text-muted small">Conditions de paiement</div>
              <div>{invoice.paymentTerms || 'Non spécifiées'}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small">Pénalités de retard</div>
              <div>{invoice.latePenaltyRate || 'Non spécifiées'}</div>
            </div>
            <div className="mb-3">
              <div className="text-muted small">Indemnité de recouvrement</div>
              <div>{formatCurrency(invoice.recoveryIndemnity || 0)}</div>
            </div>
            <div>
              <div className="text-muted small">Mentions légales</div>
              <div className="small">{invoice.legalMentions || 'Aucune mention enregistrée'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
