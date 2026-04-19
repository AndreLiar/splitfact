'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const [loading, setLoading] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoiceDetails = async () => {
        try {
          const response = await fetch(`/api/public/invoices/${invoiceId}`);
          if (response.ok) {
            const data = await response.json();
            setInvoiceNumber(data.invoiceNumber);
          } else {
            console.error('Failed to fetch invoice details');
          }
        } catch (error) {
          console.error('Error fetching invoice details:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchInvoiceDetails();
    } else {
      setLoading(false);
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <h2>Chargement des détails de la facture...</h2>
          <div className="spinner-border text-primary mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5 text-center">
      <div className="alert alert-success" role="alert">
        <h4 className="alert-heading">Paiement Réussi !</h4>
        <p>Votre paiement a été traité avec succès.</p>
        {invoiceNumber && (
          <p>Merci pour votre paiement de la facture numéro <strong>{invoiceNumber}</strong>.</p>
        )}
        <hr />
        <p className="mb-0">
          <Link href={invoiceId ? `/invoices/${invoiceId}/pay` : '/'} className="btn btn-primary">
            {invoiceId ? 'Retourner à la facture' : 'Retourner à l\'accueil'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="container mt-5 text-center">Chargement...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}