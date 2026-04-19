'use client';

import React from 'react';

interface CollectiveInvoiceTemplateProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    status: string;
    
    // Collective info
    collectiveName: string;
    collectiveAddress: string;
    collectiveEmail: string;
    collectivePhone?: string;
    collectiveLogo?: string;
    
    // Client info
    clientName: string;
    clientAddress?: string;
    clientEmail?: string;
    clientSiret?: string;
    
    // Project info
    projectName?: string;
    projectDescription?: string;
    
    // Collaborative team
    collaborators: Array<{
      name: string;
      role: string;
      contribution: string;
    }>;
    
    // Invoice items
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      tvaRate: number;
    }>;
    
    // Payment terms
    paymentTerms?: string;
    paymentMethod?: string;
  };
  showTeamDetails?: boolean;
  collectiveBranding?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export default function CollectiveInvoiceTemplate({ 
  invoice, 
  showTeamDetails = true,
  collectiveBranding = {
    primaryColor: '#2563EB',
    secondaryColor: '#F8FAFC',
    fontFamily: 'Inter, sans-serif'
  }
}: CollectiveInvoiceTemplateProps) {
  
  const subtotal = invoice.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  
  const totalTVA = invoice.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice * item.tvaRate / 100), 0
  );

  return (
    <div 
      className="invoice-template bg-white p-4 p-md-5"
      style={{ 
        fontFamily: collectiveBranding.fontFamily,
        minHeight: '297mm',
        maxWidth: '210mm',
        margin: '0 auto'
      }}
    >
      {/* Header with Collective Branding */}
      <div className="row align-items-center mb-5">
        <div className="col-md-6">
          {invoice.collectiveLogo ? (
            <img 
              src={invoice.collectiveLogo} 
              alt={invoice.collectiveName}
              className="mb-3"
              style={{ maxHeight: '80px', maxWidth: '200px' }}
            />
          ) : (
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded"
              style={{
                backgroundColor: collectiveBranding.primaryColor,
                color: 'white',
                padding: '12px 24px',
                fontSize: '24px',
                fontWeight: 'bold'
              }}
            >
              {invoice.collectiveName.charAt(0)}
            </div>
          )}
          <div className="mt-3">
            <h2 className="h4 fw-bold text-dark mb-1">{invoice.collectiveName}</h2>
            <p className="text-muted mb-1">{invoice.collectiveAddress}</p>
            <p className="text-muted mb-1">{invoice.collectiveEmail}</p>
            {invoice.collectivePhone && (
              <p className="text-muted mb-0">{invoice.collectivePhone}</p>
            )}
          </div>
        </div>
        
        <div className="col-md-6 text-md-end">
          <div 
            className="badge px-3 py-2 mb-3"
            style={{ 
              backgroundColor: collectiveBranding.secondaryColor,
              color: collectiveBranding.primaryColor,
              fontSize: '16px'
            }}
          >
            {invoice.status === 'paid' ? 'PAYÉE' : 
             invoice.status === 'sent' ? 'ENVOYÉE' : 'BROUILLON'}
          </div>
          <h1 className="h2 fw-bold text-dark mb-2">FACTURE</h1>
          <p className="h5 text-muted mb-1">N° {invoice.invoiceNumber}</p>
          <p className="text-muted">Date: {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</p>
          <p className="text-muted">Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>

      {/* Client Information */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div 
            className="p-3 rounded"
            style={{ backgroundColor: collectiveBranding.secondaryColor }}
          >
            <h5 className="fw-bold text-dark mb-2">Facturé à:</h5>
            <p className="fw-bold text-dark mb-1">{invoice.clientName}</p>
            {invoice.clientAddress && <p className="text-muted mb-1">{invoice.clientAddress}</p>}
            {invoice.clientEmail && <p className="text-muted mb-1">{invoice.clientEmail}</p>}
            {invoice.clientSiret && <p className="text-muted mb-0">SIRET: {invoice.clientSiret}</p>}
          </div>
        </div>
        
        {invoice.projectName && (
          <div className="col-md-6">
            <div className="p-3 rounded border border-light">
              <h5 className="fw-bold text-dark mb-2">Projet:</h5>
              <p className="fw-bold text-dark mb-1">{invoice.projectName}</p>
              {invoice.projectDescription && (
                <p className="text-muted mb-0">{invoice.projectDescription}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collaborative Team Composition */}
      {showTeamDetails && invoice.collaborators.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold text-dark mb-3">
            <i className="bi bi-people me-2" style={{ color: collectiveBranding.primaryColor }}></i>
            Équipe collaborative
          </h5>
          <div className="row g-3">
            {invoice.collaborators.map((member, index) => (
              <div key={index} className="col-md-4">
                <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: collectiveBranding.secondaryColor }}>
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      backgroundColor: collectiveBranding.primaryColor,
                      color: 'white',
                      width: '40px',
                      height: '40px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="fw-bold mb-0 small">{member.name}</p>
                    <p className="text-muted mb-0 small">{member.role}</p>
                    <p className="text-muted mb-0 small">{member.contribution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice Items */}
      <div className="mb-4">
        <div className="table-responsive">
          <table className="table table-borderless">
            <thead>
              <tr style={{ backgroundColor: collectiveBranding.primaryColor, color: 'white' }}>
                <th className="fw-bold py-3 px-3">Description</th>
                <th className="fw-bold py-3 px-3 text-center">Qté</th>
                <th className="fw-bold py-3 px-3 text-end">Prix unitaire</th>
                <th className="fw-bold py-3 px-3 text-center">TVA</th>
                <th className="fw-bold py-3 px-3 text-end">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="py-3 px-3">
                    <div className="fw-semibold text-dark">{item.description}</div>
                  </td>
                  <td className="py-3 px-3 text-center">{item.quantity}</td>
                  <td className="py-3 px-3 text-end">{item.unitPrice.toLocaleString('fr-FR')}€</td>
                  <td className="py-3 px-3 text-center">{item.tvaRate}%</td>
                  <td className="py-3 px-3 text-end fw-semibold">
                    {(item.quantity * item.unitPrice).toLocaleString('fr-FR')}€
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="row justify-content-end mb-4">
        <div className="col-md-4">
          <div className="p-3 rounded" style={{ backgroundColor: collectiveBranding.secondaryColor }}>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Sous-total HT:</span>
              <span className="fw-semibold">{subtotal.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">TVA:</span>
              <span className="fw-semibold">{totalTVA.toLocaleString('fr-FR')}€</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold text-dark">Total TTC:</span>
              <span 
                className="fw-bold h5 mb-0"
                style={{ color: collectiveBranding.primaryColor }}
              >
                {invoice.totalAmount.toLocaleString('fr-FR')}€
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="row">
        <div className="col-md-6">
          <h6 className="fw-bold text-dark mb-2">Conditions de paiement:</h6>
          <p className="text-muted small mb-1">
            {invoice.paymentTerms || 'Paiement à réception de facture'}
          </p>
          {invoice.paymentMethod && (
            <p className="text-muted small mb-0">
              Mode de paiement: {invoice.paymentMethod}
            </p>
          )}
        </div>
        
        <div className="col-md-6">
          <div className="text-md-end">
            <p className="text-muted small mb-1">
              En cas de retard de paiement, indemnité forfaitaire de 40€ pour frais de recouvrement.
            </p>
            <p className="text-muted small mb-0">
              Pénalités de retard: 3 fois le taux d'intérêt légal.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-5 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
        <p className="text-muted small mb-1">
          <strong>{invoice.collectiveName}</strong> - Équipe créative collaborative
        </p>
        <p className="text-muted small mb-0">
          Facture collaborative avec répartition transparente des contributions
        </p>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .invoice-template {
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}