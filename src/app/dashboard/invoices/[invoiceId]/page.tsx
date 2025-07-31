'use client';

import { use, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';

export default function InvoiceDetailPage({ params: paramsPromise }: { params: Promise<{ invoiceId: string }> }) {
  const params = use(paramsPromise);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { invoiceId } = params;
  
  // Safe currency formatting function
  const formatCurrency = (value: any) => {
    // Clean any potential malformed string values
    let cleanValue = value;
    if (typeof value === 'string') {
      // Replace slashes with empty string to handle malformed data like "1/800"
      cleanValue = value.replace(/\//g, '');
    }
    const numValue = Number(cleanValue || 0);
    if (isNaN(numValue)) return '0,00 €';
    return numValue.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };
  const [invoice, setInvoice] = useState<any>(null);
  const [subInvoices, setSubInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [subInvoiceGenerating, setSubInvoiceGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const handleCopyLink = () => {
    const publicPaymentLink = `${window.location.origin}/invoices/${invoiceId}/pay`;
    navigator.clipboard.writeText(publicPaymentLink).then(() => {
      setCopySuccess('Lien copié!');
      setTimeout(() => setCopySuccess(''), 2000);
    }).catch(err => {
      setCopySuccess('Échec de la copie!');
      console.error('Could not copy text: ', err);
    });
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchInvoice();
      fetchSubInvoices();
    }
  }, [status, router, invoiceId]);

  const fetchSubInvoices = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/sub-invoices`);
      
      if (!response.ok) {
        // Sub-invoices are optional - silently fail if no access
        setSubInvoices([]);
        return;
      }
      
      const data = await response.json();
      setSubInvoices(data || []);
    } catch (err: any) {
      // Don't break the page if sub-invoices fail to load
      setSubInvoices([]);
    }
  };

  const handleGenerateSubInvoices = async () => {
    setSubInvoiceGenerating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/generate-subinvoice`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate sub-invoices');
      }
      alert('Sub-invoices generated successfully!');
      fetchSubInvoices(); // Refresh the list of sub-invoices
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubInvoiceGenerating(false);
    }
  };

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 404) {
          throw new Error('Facture introuvable. Vérifiez que l\'ID de la facture est correct.');
        }
        if (response.status === 401) {
          throw new Error('Vous devez être connecté pour accéder à cette facture');
        }
        if (response.status === 403) {
          throw new Error('Vous n\'avez pas accès à cette facture');
        }
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement de la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfGenerating(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Update the local state to reflect that the PDF is available
      setInvoice({ ...invoice, pdfUrl: url });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentStatus: string) => {
    setUpdatingPayment(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      await fetchInvoice(); // Refresh invoice data
      await fetchSubInvoices(); // Refresh sub-invoices data
      alert(`Facture marquée comme ${paymentStatus === 'paid' ? 'payée' : 'en attente'}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingPayment(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="card border-danger">
          <div className="card-body text-center">
            <i className="bi bi-exclamation-triangle-fill text-danger display-4 mb-3"></i>
            <h4 className="text-danger mb-3">Erreur</h4>
            <p className="text-muted mb-4">{error}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Link href="/dashboard/invoices" className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Retour aux factures
              </Link>
              <button 
                onClick={() => {
                  setError(null);
                  fetchInvoice();
                }} 
                className="btn btn-outline-primary"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="alert alert-warning">Facture introuvable.</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Détails de la Facture: {invoice.invoiceNumber}</h1>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Informations de l'Émetteur</h5>
          <p><strong>Nom:</strong> {invoice.issuerName}</p>
          <p><strong>Adresse:</strong> {invoice.issuerAddress}</p>
          {invoice.issuerSiret && <p><strong>SIRET:</strong> {invoice.issuerSiret}</p>}
          {invoice.issuerTva && <p><strong>Numéro de TVA:</strong> {invoice.issuerTva}</p>}
          {invoice.issuerRcs && <p><strong>RCS:</strong> {invoice.issuerRcs}</p>}
          {invoice.issuerLegalStatus && <p><strong>Statut Légal:</strong> {invoice.issuerLegalStatus}</p>}
          {invoice.issuerShareCapital && <p><strong>Capital Social:</strong> {invoice.issuerShareCapital}</p>}
          {invoice.issuerApeCode && <p><strong>Code APE:</strong> {invoice.issuerApeCode}</p>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Informations du Client</h5>
          <p><strong>Nom:</strong> {invoice.client?.name || 'N/A'}</p>
          <p><strong>Adresse:</strong> {invoice.client?.address || 'N/A'}</p>
          {invoice.client?.siret && <p><strong>SIRET:</strong> {invoice.client.siret}</p>}
          {invoice.client?.tvaNumber && <p><strong>Numéro de TVA:</strong> {invoice.client.tvaNumber}</p>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Détails de la Facture</h5>
          <p><strong>Numéro de Facture:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date de Facture:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Date d'échéance:</strong> {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Montant Total:</strong> {formatCurrency(invoice.totalAmount)}</p>
          <p><strong>Statut:</strong> {invoice.status}</p>
          <p><strong>Statut de Paiement:</strong> {invoice.paymentStatus}</p>
          <p><strong>Collectif:</strong> {invoice.collective?.name || 'N/A'}</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Articles</h5>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantité</th>
                <th>Prix Unitaire</th>
                <th>Taux de TVA</th>
                <th>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{(Number(item.tvaRate || 0) * 100).toFixed(0)}%</td>
                    <td>{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted">Aucun article trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {invoice.shares && invoice.shares.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Parts</h5>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Type de Part</th>
                  <th>Valeur de la Part</th>
                  <th>Montant Calculé</th>
                </tr>
              </thead>
              <tbody>
                {invoice.shares && invoice.shares.length > 0 ? (
                  invoice.shares.map((share: any) => (
                    <tr key={share.id}>
                      <td>{share.user?.name || share.user?.email || 'N/A'}</td>
                      <td>{share.shareType}</td>
                      <td>{share.shareValue}{share.shareType === 'percent' ? '%' : '€'}</td>
                      <td>{formatCurrency(share.calculatedAmount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-muted">Aucune part définie</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Conditions de Paiement & Mentions Légales</h5>
          <p><strong>Conditions de Paiement:</strong> {invoice.paymentTerms || 'Non spécifié'}</p>
          <p><strong>Taux de Pénalité de Retard:</strong> {invoice.latePenaltyRate || 'Non spécifié'}</p>
          <p><strong>Indemnité de Recouvrement:</strong> {formatCurrency(invoice.recoveryIndemnity || 0)}</p>
          {invoice.legalMentions && <p><strong>Mentions Légales:</strong> {invoice.legalMentions}</p>}
        </div>
      </div>

      {invoice.shares && invoice.shares.length > 0 && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Sous-Factures</h5>
            <button
              onClick={handleGenerateSubInvoices}
              className="btn btn-primary mb-3"
              disabled={subInvoiceGenerating}
            >
              {subInvoiceGenerating ? 'Génération des Sous-Factures...' : 'Générer les Sous-Factures'}
            </button>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Destinataire</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>PDF</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {subInvoices && subInvoices.length > 0 ? (
                  subInvoices.map((subInvoice: any) => (
                    <tr key={subInvoice.id}>
                      <td>{subInvoice.receiver?.email || 'N/A'}</td>
                      <td>{formatCurrency(subInvoice.amount)}</td>
                      <td>{subInvoice.status}</td>
                      <td>
                        {subInvoice.pdfUrl ? (
                          <a href={subInvoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success">Voir PDF</a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <Link href={`/dashboard/sub-invoices/${subInvoice.id}`} className="btn btn-sm btn-info">Détails</Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-3">
                      Aucune sous-facture générée pour cette facture
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Status Management */}
      <div className="card mb-4 border-warning">
        <div className="card-body">
          <h5 className="card-title d-flex align-items-center">
            <i className="bi bi-credit-card me-2 text-warning"></i>
            Gestion du paiement
          </h5>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <p className="mb-2">
                <strong>Statut actuel:</strong> 
                <span className={`badge ms-2 ${invoice.paymentStatus === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                  {invoice.paymentStatus === 'paid' ? 'Payée' : 'En attente'}
                </span>
              </p>
              <small className="text-muted">
                {invoice.paymentStatus === 'paid' 
                  ? 'Cette facture a été marquée comme payée. Toutes les sous-factures associées sont également payées.'
                  : 'Marquez cette facture comme payée pour automatiquement mettre à jour toutes les sous-factures associées.'
                }
              </small>
            </div>
            <div className="d-flex gap-2">
              {invoice.paymentStatus !== 'paid' && (
                <button 
                  onClick={() => handleUpdatePaymentStatus('paid')}
                  className="btn btn-success"
                  disabled={updatingPayment}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  {updatingPayment ? 'Mise à jour...' : 'Marquer comme payée'}
                </button>
              )}
              {invoice.paymentStatus !== 'paid' && invoice.paymentStatus !== 'pending' && (
                <button 
                  onClick={() => handleUpdatePaymentStatus('pending')}
                  className="btn btn-warning"
                  disabled={updatingPayment}
                >
                  <i className="bi bi-clock me-1"></i>
                  {updatingPayment ? 'Mise à jour...' : 'Marquer comme en attente'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between">
        <Link href="/dashboard/invoices" className="btn btn-secondary">Retour aux Factures</Link>
        <div>
          {invoice.pdfUrl ? (
            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn-success me-2">Télécharger PDF</a>
          ) : (
            <button onClick={handleGeneratePdf} className="btn btn-primary" disabled={pdfGenerating}>
              {pdfGenerating ? 'Génération du PDF...' : 'Générer le PDF'}
            </button>
          )}
          <button onClick={handleGeneratePdf} className="btn btn-info me-2" disabled={pdfGenerating}>
            {pdfGenerating ? 'Régénération du PDF...' : 'Régénérer le PDF'}
          </button>
          {session?.user?.id === invoice.userId && ( // Only show copy link for the invoice issuer
            <div className="d-inline-block ms-2">
              <button onClick={handleCopyLink} className="btn btn-primary">
                {copySuccess || 'Copier le Lien de Paiement'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
