'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';

export default function PublicInvoicePayPage({ params: paramsPromise }: { params: Promise<{ invoiceId: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { invoiceId } = params;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setInvoice(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    setPaying(true);
    try {
      const response = await fetch(`/api/public/invoices/${invoiceId}/checkout`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      const { url } = await response.json();
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">Erreur: {error}</div>;
  }

  if (!invoice) {
    return <div className="alert alert-warning">Facture introuvable.</div>;
  }

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Facture: {invoice.invoiceNumber}</h1>
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
          <p><strong>Nom:</strong> {invoice.clientName || 'N/A'}</p>
          <p><strong>Adresse:</strong> {invoice.clientAddress || 'N/A'}</p>
          {invoice.clientSiret && <p><strong>SIRET:</strong> {invoice.clientSiret}</p>}
          {invoice.clientTvaNumber && <p><strong>Numéro de TVA:</strong> {invoice.clientTvaNumber}</p>}
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Détails de la Facture</h5>
          <p><strong>Numéro de Facture:</strong> {invoice.invoiceNumber}</p>
          <p><strong>Date de Facture:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Date d'échéance:</strong> {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
          <p><strong>Montant Total:</strong> {parseFloat(invoice.totalAmount).toFixed(2)}€</p>
          <p><strong>Statut:</strong> {invoice.status}</p>
          <p><strong>Statut de Paiement:</strong> {invoice.paymentStatus}</p>
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
              {invoice.items.map((item: any, index: number) => (
                <tr key={item.id || index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{parseFloat(item.unitPrice).toFixed(2)}€</td>
                  <td>{(parseFloat(item.tvaRate) * 100).toFixed(0)}%</td>
                  <td>{(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Conditions de Paiement & Mentions Légales</h5>
          <p><strong>Conditions de Paiement:</strong> {invoice.paymentTerms}</p>
          <p><strong>Taux de Pénalité de Retard:</strong> {invoice.latePenaltyRate}</p>
          <p><strong>Indemnité de Recouvrement:</strong> {parseFloat(invoice.recoveryIndemnity).toFixed(2)}€</p>
          {invoice.legalMentions && <p><strong>Mentions Légales:</strong> {invoice.legalMentions}</p>}
        </div>
      </div>

      {invoice.paymentStatus !== 'paid' && (
        <div className="text-center mt-4">
          <button onClick={handlePayInvoice} className="btn btn-success btn-lg" disabled={paying}>
            {paying ? 'Redirection vers le paiement...' : 'Payer la Facture'}
          </button>
        </div>
      )}

      {invoice.paymentStatus === 'paid' && (
        <div className="alert alert-success text-center mt-4">
          Cette facture a été payée.
        </div>
      )}
    </div>
  );
}
