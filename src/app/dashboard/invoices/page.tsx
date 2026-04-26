'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useInvoices, revalidateInvoices, type Invoice } from '@/app/hooks/useApi';

function InvoicesPageInner() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Safe currency formatting function
  const formatCurrency = (value: number | string) => {
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
  const { invoices: rawInvoices, isLoading: loading, error: swrError } = useInvoices();
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const error = swrError?.message ?? null;
  const [pdfGenerating, setPdfGenerating] = useState<{[key: string]: boolean}>({});
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const workflowParam = searchParams.get('workflow');
    if (workflowParam) {
      setWorkflowStatusFilter(workflowParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin');
  }, [status, router]);

  // Filter invoices based on search and filters
  useEffect(() => {
    let filtered = rawInvoices.filter((invoice: Invoice) => {
      const matchesSearch =
        (invoice.invoiceNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.client?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.issuerName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesWorkflowStatus = workflowStatusFilter === 'all' || invoice.workflowStatus === workflowStatusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || invoice.paymentStatus === paymentStatusFilter;

      const matchesDate = dateFilter === 'all' || (() => {
        const invoiceDate = new Date(invoice.invoiceDate);
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));

        switch (dateFilter) {
          case 'recent': return invoiceDate >= thirtyDaysAgo;
          case 'older': return invoiceDate < thirtyDaysAgo && invoiceDate >= ninetyDaysAgo;
          case 'oldest': return invoiceDate < ninetyDaysAgo;
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus && matchesWorkflowStatus && matchesPaymentStatus && matchesDate;
    });

    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [rawInvoices, searchTerm, statusFilter, workflowStatusFilter, paymentStatusFilter, dateFilter]);

  const handleGeneratePdf = async (invoiceId: string) => {
    setPdfGenerating(prev => ({ ...prev, [invoiceId]: true }));
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
      
      await revalidateInvoices();
    } catch (err: any) {
      alert(`Erreur lors de la génération du PDF: ${err.message}`);
    } finally {
      setPdfGenerating(prev => ({ ...prev, [invoiceId]: false }));
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success';
      case 'draft': return 'bg-secondary';
      case 'sent': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  const getPaymentStatusBadgeClass = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-success';
      case 'pending': return 'bg-warning text-dark';
      case 'overdue': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyée';
      default: return status;
    }
  };

  const getWorkflowBadgeClass = (workflowStatus: string) => {
    switch (workflowStatus) {
      case 'issued': return 'bg-success';
      case 'blocked': return 'bg-danger';
      case 'ready_for_review':
      case 'ready_to_issue':
        return 'bg-primary';
      case 'collecting_data':
      case 'triggered':
      default:
        return 'bg-secondary';
    }
  };

  const getWorkflowStatusText = (workflowStatus: string) => {
    switch (workflowStatus) {
      case 'triggered': return 'Déclenchée';
      case 'collecting_data': return 'Collecte';
      case 'blocked': return 'Bloquée';
      case 'ready_for_review': return 'Revue';
      case 'ready_to_issue': return 'Prête';
      case 'issued': return 'Émise';
      default: return workflowStatus || 'Non défini';
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      default: return paymentStatus;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Erreur: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-dark">Vos factures</h1>
          <p className="text-muted mb-0">
            Gérez le statut, le paiement et les documents de votre flux de facturation
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={async () => {
              await fetch('/api/billing-triggers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triggerType: 'manual', sourceDescription: 'Déclenchement manuel depuis la liste des factures' }),
              });
              window.location.href = '/dashboard/create-invoice';
            }}
          >
            <i className="bi bi-lightning me-2"></i>
            Nouveau job de facturation
          </button>
          <Link href="/dashboard/create-invoice" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Nouvelle Facture
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-3 col-md-6 col-12">
              <label className="form-label fw-semibold">Rechercher</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Numéro, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-6 col-12">
              <label className="form-label fw-semibold">Statut</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option key="status-all" value="all">Tous</option>
                <option key="status-draft" value="draft">Brouillon</option>
                <option key="status-sent" value="sent">Envoyée</option>
                <option key="status-paid" value="paid">Payée</option>
              </select>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-6 col-12">
              <label className="form-label fw-semibold">Paiement</label>
              <select
                className="form-select"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <option key="payment-all" value="all">Tous</option>
                <option key="payment-pending" value="pending">En attente</option>
                <option key="payment-paid" value="paid">Payées</option>
                <option key="payment-overdue" value="overdue">En retard</option>
              </select>
            </div>
            <div className="col-lg-2 col-md-6 col-sm-6 col-12">
              <label className="form-label fw-semibold">Workflow</label>
              <select
                className="form-select"
                value={workflowStatusFilter}
                onChange={(e) => setWorkflowStatusFilter(e.target.value)}
              >
                <option key="workflow-all" value="all">Tous</option>
                <option key="workflow-blocked" value="blocked">Bloquées</option>
                <option key="workflow-review" value="ready_for_review">Revue</option>
                <option key="workflow-ready" value="ready_to_issue">Prêtes</option>
                <option key="workflow-issued" value="issued">Émises</option>
              </select>
            </div>
            <div className="col-lg-1 col-md-6 col-sm-6 col-12">
              <label className="form-label fw-semibold">Période</label>
              <select
                className="form-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option key="date-all" value="all">Toutes</option>
                <option key="date-recent" value="recent">30 jours</option>
                <option key="date-older" value="older">30-90 jours</option>
                <option key="date-oldest" value="oldest">+90 jours</option>
              </select>
            </div>
            <div className="col-lg-1 col-12 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setWorkflowStatusFilter('all');
                  setPaymentStatusFilter('all');
                  setDateFilter('all');
                }}
                title="Réinitialiser les filtres"
              >
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-3 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? 's' : ''} trouvée{filteredInvoices.length !== 1 ? 's' : ''}
                {rawInvoices.length !== filteredInvoices.length && ` sur ${rawInvoices.length} au total`}
              </small>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-success">
                  {rawInvoices.filter((inv: Invoice) => inv.paymentStatus === 'paid').length} Payées
                </span>
                <span className="badge bg-warning text-dark">
                  {rawInvoices.filter((inv: Invoice) => inv.paymentStatus === 'pending').length} En attente
                </span>
                <span className="badge bg-danger">
                  {rawInvoices.filter((inv: Invoice) => inv.paymentStatus === 'overdue').length} En retard
                </span>
                <span className="badge bg-info">
                  {rawInvoices.filter((inv: Invoice) => inv.status === 'sent').length} Envoyées
                </span>
                <span className="badge bg-secondary">
                  {rawInvoices.filter((inv: Invoice) => inv.status === 'draft').length} Brouillons
                </span>
                <span className="badge bg-danger">
                  {rawInvoices.filter((inv: Invoice) => inv.workflowStatus === 'blocked').length} Bloquées
                </span>
                <span className="badge bg-success">
                  {rawInvoices.filter((inv: Invoice) => inv.workflowStatus === 'issued').length} Émises
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <i className="bi bi-receipt display-1 text-muted mb-3"></i>
            <h4 className="text-muted">Aucune facture trouvée</h4>
            <p className="text-muted mb-4">
              {rawInvoices.length === 0 
                ? "Vous n'avez pas encore créé de facture."
                : "Aucune facture ne correspond aux critères de recherche."
              }
            </p>
            {rawInvoices.length === 0 && (
              <div className="d-flex gap-2 justify-content-center">
                <Link href="/dashboard/create-invoice" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Créer votre première facture
                </Link>
                <Link href="/dashboard/clients" className="btn btn-outline-primary">
                  <i className="bi bi-person-vcard me-2"></i>
                  Gérer les clients
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 d-none d-lg-table">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">Facture</th>
                    <th className="border-0 fw-semibold">Client</th>
                    <th className="border-0 fw-semibold">Montant</th>
                    <th className="border-0 fw-semibold">Statut</th>
                    <th className="border-0 fw-semibold">Workflow</th>
                    <th className="border-0 fw-semibold">Paiement</th>
                    <th className="border-0 fw-semibold">Échéance</th>
                    <th className="border-0 fw-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentInvoices.map((invoice: Invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <div>
                          <span className="fw-semibold text-dark">
                            {invoice.invoiceNumber}
                          </span>
                          <br />
                          <small className="text-muted">
                            <i className="bi bi-calendar3 me-1"></i>
                            {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle text-muted me-2"></i>
                          <div>
                            <div className="fw-semibold">
                              {invoice.client?.name || invoice.clientName || 'N/A'}
                            </div>
                            <small className="text-muted">
                              {invoice.client?.email || 'N/A'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(invoice.status || 'draft')}`}>
                          {getStatusText(invoice.status || 'draft')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getWorkflowBadgeClass(invoice.workflowStatus || 'triggered')}`}>
                          {getWorkflowStatusText(invoice.workflowStatus || 'triggered')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadgeClass(invoice.paymentStatus || 'pending')}`}>
                          {getPaymentStatusText(invoice.paymentStatus || 'pending')}
                        </span>
                      </td>
                      <td>
                        {new Date(invoice.dueDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <Link 
                            href={`/dashboard/invoices/${invoice.id}`} 
                            className="btn btn-sm btn-outline-primary"
                            title="Voir les détails"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {invoice.pdfUrl ? (
                            <a 
                              href={invoice.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-sm btn-success"
                              title="Télécharger PDF"
                            >
                              <i className="bi bi-download"></i>
                            </a>
                          ) : (
                            <button 
                              className="btn btn-sm btn-info" 
                              onClick={() => handleGeneratePdf(invoice.id)}
                              disabled={pdfGenerating[invoice.id]}
                              title="Générer PDF"
                            >
                              {pdfGenerating[invoice.id] ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                              ) : (
                                <i className="bi bi-file-earmark-pdf"></i>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="d-lg-none">
              {currentInvoices.map((invoice: Invoice) => (
                <div key={`mobile-${invoice.id}`} className="card mb-3 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-bold mb-1">{invoice.invoiceNumber}</h6>
                        <small className="text-muted">
                          <i className="bi bi-calendar3 me-1"></i>
                          {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                        </small>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold fs-5 text-primary">
                          {formatCurrency(invoice.totalAmount)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Client Info */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="bi bi-person-circle text-muted me-2" style={{ fontSize: '1.2em' }}></i>
                        <span className="fw-semibold">{invoice.client?.name || invoice.clientName || 'N/A'}</span>
                      </div>
                      <small className="text-muted ms-4">{invoice.client?.email || 'N/A'}</small>
                    </div>
                    
                    {/* Status Badges */}
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      <span className={`badge ${getStatusBadgeClass(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                      <span className={`badge ${getWorkflowBadgeClass(invoice.workflowStatus || 'triggered')}`}>
                        {getWorkflowStatusText(invoice.workflowStatus || 'triggered')}
                      </span>
                      <span className={`badge ${getPaymentStatusBadgeClass(invoice.paymentStatus ?? '')}`}>
                        {getPaymentStatusText(invoice.paymentStatus ?? '')}
                      </span>
                    </div>
                    
                    {/* Due Date */}
                    {invoice.dueDate && (
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </small>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="d-flex gap-2 flex-wrap">
                      <Link 
                        href={`/dashboard/invoices/${invoice.id}`} 
                        className="btn btn-sm btn-primary"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Voir
                      </Link>
                      <Link 
                        href={`/api/invoices/${invoice.id}/pdf`} 
                        target="_blank"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="bi bi-download me-1"></i>
                        PDF
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredInvoices.length)} 
                sur {filteredInvoices.length} résultats
              </div>
              <nav aria-label="Navigation des pages">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <li key={`page-${page}`} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    } else if (
                      page === currentPage - 3 || 
                      page === currentPage + 3
                    ) {
                      return (
                        <li key={`ellipsis-${page}`} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>}>
      <InvoicesPageInner />
    </Suspense>
  );
}
