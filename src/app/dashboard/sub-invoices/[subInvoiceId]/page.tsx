'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubInvoiceDetailPage({ params: paramsPromise }: { params: Promise<{ subInvoiceId: string }> }) {
  const params = use(paramsPromise);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { subInvoiceId } = params;
  const [subInvoice, setSubInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSubInvoice();
    }
  }, [status, router, subInvoiceId]);

  const fetchSubInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sub-invoices/${subInvoiceId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setSubInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfGenerating(true);
    try {
      const response = await fetch(`/api/sub-invoices/${subInvoiceId}/pdf`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorText = await response.text(); // Get error as text
        throw new Error(`Failed to generate PDF: ${errorText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url); // Clean up the URL

      // Re-fetch sub-invoice to get the updated pdfUrl from the database
      await fetchSubInvoice();
      alert('PDF generated and displayed successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>;
  }

  if (!subInvoice) {
    return <div className="alert alert-warning">Sous-facture introuvable.</div>;
  }

  // Payment status is derived from parent invoice, no manual changes needed

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'unpaid': return 'bg-warning';
      case 'draft': return 'bg-secondary';
      case 'finalized': return 'bg-info';
      default: return 'bg-light';
    }
  };

  const isCurrentUserIssuer = session?.user?.id === subInvoice?.issuerId;
  const isCurrentUserReceiver = session?.user?.id === subInvoice?.receiverId;

  return (
    <div className="container-fluid py-3 py-lg-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-2 text-darkGray">Détails de la Sous-Facture</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link href="/dashboard" className="text-decoration-none">Dashboard</Link>
              </li>
              <li className="breadcrumb-item">
                <Link href="/dashboard/sub-invoices" className="text-decoration-none">Sous-factures</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">#{subInvoice.id.slice(-8)}</li>
            </ol>
          </nav>
        </div>
        <div className="d-flex gap-2">
          <span className={`badge ${getStatusBadgeClass(subInvoice.status)} px-3 py-2`}>
            {subInvoice.status.charAt(0).toUpperCase() + subInvoice.status.slice(1)}
          </span>
          <span className={`badge ${getStatusBadgeClass(subInvoice.paymentStatus)} px-3 py-2`}>
            {subInvoice.paymentStatus === 'paid' ? 'Payé' : 'Non payé'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-4 mb-4">
        {/* Sub-Invoice Details */}
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-xl mb-4">
            <div className="card-body p-4">
              <h5 className="card-title text-darkGray mb-3 d-flex align-items-center">
                <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                Informations de la sous-facture
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between">
                    <span className="text-mediumGray">ID:</span>
                    <span className="fw-semibold text-darkGray">#{subInvoice.id.slice(-8)}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between">
                    <span className="text-mediumGray">Montant:</span>
                    <span className="fw-bold fs-5 text-primary">
                      {Number(subInvoice.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between">
                    <span className="text-mediumGray">Créé le:</span>
                    <span className="fw-semibold text-darkGray">
                      {new Date(subInvoice.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between">
                    <span className="text-mediumGray">Statut:</span>
                    <span className={`badge ${getStatusBadgeClass(subInvoice.status)}`}>
                      {subInvoice.status.charAt(0).toUpperCase() + subInvoice.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="col-12">
                  <hr className="my-3" />
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-mediumGray">Facture parent:</span>
                    <Link 
                      href={`/dashboard/invoices/${subInvoice.parentInvoice.id}`}
                      className="text-decoration-none text-primary fw-semibold"
                    >
                      {subInvoice.parentInvoice.invoiceNumber} 
                      <span className="text-mediumGray ms-1">
                        ({subInvoice.parentInvoice.collective.name})
                      </span>
                      <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
                <div className="col-12">
                  <div className="alert alert-light border p-3 mt-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-diagram-3 me-2 text-info"></i>
                        <span className="small text-mediumGray">Relation de paiement:</span>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="small text-mediumGray me-2">Parent</span>
                        <i className="bi bi-arrow-right mx-2 text-mediumGray"></i>
                        <span className="small text-mediumGray">Sous-facture</span>
                      </div>
                    </div>
                    <small className="text-mediumGray d-block mt-2">
                      Cette sous-facture sera automatiquement payée lorsque la facture parent sera réglée par le client.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parties Information */}
          <div className="row g-3">
            {/* Issuer */}
            <div className="col-md-6">
              <div className="card shadow-sm border-0 rounded-xl h-100">
                <div className="card-body p-4">
                  <h6 className="card-title text-darkGray mb-3 d-flex align-items-center">
                    <i className="bi bi-person-badge me-2 text-success"></i>
                    Émetteur
                    {isCurrentUserIssuer && (
                      <span className="badge bg-success-light text-success-dark ms-2 small">Vous</span>
                    )}
                  </h6>
                  <div className="mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-person me-2 text-mediumGray"></i>
                      <span className="fw-semibold text-darkGray">{subInvoice.issuer.name}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope me-2 text-mediumGray"></i>
                      <span className="text-mediumGray">{subInvoice.issuer.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Receiver */}
            <div className="col-md-6">
              <div className="card shadow-sm border-0 rounded-xl h-100">
                <div className="card-body p-4">
                  <h6 className="card-title text-darkGray mb-3 d-flex align-items-center">
                    <i className="bi bi-person-check me-2 text-info"></i>
                    Destinataire
                    {isCurrentUserReceiver && (
                      <span className="badge bg-info-light text-info-dark ms-2 small">Vous</span>
                    )}
                  </h6>
                  <div className="mb-2">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-person me-2 text-mediumGray"></i>
                      <span className="fw-semibold text-darkGray">{subInvoice.receiver.name}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-envelope me-2 text-mediumGray"></i>
                      <span className="text-mediumGray">{subInvoice.receiver.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-xl">
            <div className="card-body p-4">
              <h6 className="card-title text-darkGray mb-3 d-flex align-items-center">
                <i className="bi bi-gear me-2 text-primary"></i>
                Actions disponibles
              </h6>

              {/* Payment Flow Information */}
              <div className="mb-4">
                <h6 className="small text-mediumGray text-uppercase mb-2">Flux de paiement</h6>
                <div className="alert alert-info p-3 mb-0">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-info-circle me-2 mt-1 text-info"></i>
                    <div>
                      <small className="text-info">
                        <strong>Paiement automatique:</strong><br />
                        Le statut de paiement de cette sous-facture est déterminé automatiquement 
                        par le statut de paiement de la facture parent du collectif.
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Actions */}
              <div className="mb-4">
                <h6 className="small text-mediumGray text-uppercase mb-2">Documents</h6>
                <div className="d-grid gap-2">
                  {subInvoice.pdfUrl && (
                    <a 
                      href={subInvoice.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                    >
                      <i className="bi bi-download me-2"></i>
                      Télécharger PDF
                    </a>
                  )}
                  <button 
                    onClick={handleGeneratePdf} 
                    className="btn btn-primary btn-sm d-flex align-items-center justify-content-center" 
                    disabled={pdfGenerating}
                  >
                    <i className={`bi ${pdfGenerating ? 'bi-hourglass-split' : 'bi-file-earmark-pdf'} me-2`}></i>
                    {pdfGenerating ? 'Génération...' : (subInvoice.pdfUrl ? 'Régénérer PDF' : 'Générer PDF')}
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h6 className="small text-mediumGray text-uppercase mb-2">Navigation</h6>
                <div className="d-grid gap-2">
                  <Link 
                    href="/dashboard/sub-invoices" 
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Retour aux sous-factures
                  </Link>
                  <Link 
                    href={`/dashboard/invoices/${subInvoice.parentInvoice.id}`}
                    className="btn btn-outline-info btn-sm d-flex align-items-center justify-content-center"
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Voir facture parent
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="card shadow-sm border-0 rounded-xl mt-3">
            <div className="card-body p-4">
              <h6 className="card-title text-darkGray mb-3 d-flex align-items-center">
                <i className="bi bi-credit-card me-2 text-primary"></i>
                Statut de paiement
              </h6>
              <div className="text-center mb-3">
                <div className={`badge ${getStatusBadgeClass(subInvoice.paymentStatus)} px-4 py-3 fs-6 mb-2`}>
                  <i className={`bi ${subInvoice.paymentStatus === 'paid' ? 'bi-check-circle' : 'bi-clock'} me-2`}></i>
                  {subInvoice.paymentStatus === 'paid' ? 'Payée' : 'En attente'}
                </div>
              </div>
              
              {/* Payment Flow Explanation */}
              <div className="border-top pt-3">
                <div className="d-flex align-items-center justify-content-between small mb-2">
                  <span className="text-mediumGray">Facture parent:</span>
                  <span className="fw-semibold">
                    {subInvoice.parentInvoice.invoiceNumber}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between small mb-2">
                  <span className="text-mediumGray">Collectif:</span>
                  <span className="fw-semibold">
                    {subInvoice.parentInvoice.collective.name}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between small">
                  <span className="text-mediumGray">Montant reçu:</span>
                  <span className="fw-bold text-primary">
                    {subInvoice.paymentStatus === 'paid' 
                      ? Number(subInvoice.amount).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                      : '0,00 €'
                    }
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-top">
                <p className="text-mediumGray small mb-0 text-center">
                  {subInvoice.paymentStatus === 'paid' 
                    ? 'Votre part a été versée suite au paiement de la facture collective.' 
                    : 'Votre paiement sera effectué dès que le client aura payé la facture collective.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
