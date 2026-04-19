'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatCurrencyRobust } from '@/lib/utils';

export default function SubInvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [subInvoices, setSubInvoices] = useState([]);
  const [filteredSubInvoices, setFilteredSubInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState<{[key: string]: boolean}>({});
  
  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [collectiveFilter, setCollectiveFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Derived data for filters
  const [availableCollectives, setAvailableCollectives] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSubInvoices();
    }
  }, [status, router]);

  const fetchSubInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sub-invoices');
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setSubInvoices(data);
      setFilteredSubInvoices(data);
      
      // Extract unique collectives for filter
      const collectives = data.reduce((acc: {id: string, name: string}[], subInvoice: any) => {
        const collective = subInvoice.parentInvoice?.collective;
        if (collective && !acc.find(c => c.id === collective.id)) {
          acc.push({ id: collective.id, name: collective.name });
        }
        return acc;
      }, []);
      setAvailableCollectives(collectives);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter sub-invoices based on search and filters
  useEffect(() => {
    let filtered = subInvoices.filter((subInvoice: any) => {
      const matchesSearch = 
        (subInvoice.parentInvoice?.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subInvoice.issuer?.name || subInvoice.issuer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subInvoice.parentInvoice?.collective?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (subInvoice.receiver?.name || subInvoice.receiver?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || subInvoice.status === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || subInvoice.paymentStatus === paymentStatusFilter;
      const matchesCollective = collectiveFilter === 'all' || subInvoice.parentInvoice?.collective?.id === collectiveFilter;
      
      const matchesDate = dateFilter === 'all' || (() => {
        const subInvoiceDate = new Date(subInvoice.createdAt);
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        const ninetyDaysAgo = new Date(today.getTime() - (90 * 24 * 60 * 60 * 1000));
        
        switch (dateFilter) {
          case 'recent': return subInvoiceDate >= thirtyDaysAgo;
          case 'older': return subInvoiceDate < thirtyDaysAgo && subInvoiceDate >= ninetyDaysAgo;
          case 'oldest': return subInvoiceDate < ninetyDaysAgo;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesCollective && matchesDate;
    });
    
    setFilteredSubInvoices(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [subInvoices, searchTerm, statusFilter, paymentStatusFilter, collectiveFilter, dateFilter]);

  const handleGeneratePdf = async (subInvoiceId: string) => {
    setPdfGenerating(prev => ({ ...prev, [subInvoiceId]: true }));
    try {
      const response = await fetch(`/api/sub-invoices/${subInvoiceId}/pdf`, {
        method: 'POST',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Refresh the sub-invoices to get updated pdfUrl
      await fetchSubInvoices();
    } catch (err: any) {
      alert(`Erreur lors de la génération du PDF: ${err.message}`);
    } finally {
      setPdfGenerating(prev => ({ ...prev, [subInvoiceId]: false }));
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubInvoices = filteredSubInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubInvoices.length / itemsPerPage);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'finalized': return 'bg-success';
      case 'draft': return 'bg-secondary';
      case 'sent': return 'bg-info';
      case 'cancelled': return 'bg-danger';
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
      case 'finalized': return 'Finalisée';
      case 'draft': return 'Brouillon';
      case 'sent': return 'Envoyée';
      case 'cancelled': return 'Annulée';
      default: return status;
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
          <h1 className="h3 mb-0 text-dark">Vos Sous-Factures</h1>
          <p className="text-muted mb-0">
            Gérez les sous-factures générées automatiquement pour vos factures collectives
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard/invoices" className="btn btn-outline-primary">
            <i className="bi bi-receipt me-2"></i>
            Voir les Factures
          </Link>
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
            <div className="col-md-3">
              <label className="form-label fw-semibold">Rechercher</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Facture, émetteur, collectif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Statut</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option key="status-all" value="all">Tous</option>
                <option key="status-draft" value="draft">Brouillon</option>
                <option key="status-finalized" value="finalized">Finalisée</option>
                <option key="status-sent" value="sent">Envoyée</option>
                <option key="status-cancelled" value="cancelled">Annulée</option>
              </select>
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
              <label className="form-label fw-semibold">Collectif</label>
              <select
                className="form-select"
                value={collectiveFilter}
                onChange={(e) => setCollectiveFilter(e.target.value)}
              >
                <option key="collective-all" value="all">Tous</option>
                {availableCollectives.map((collective) => (
                  <option key={collective.id} value={collective.id}>
                    {collective.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
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
            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentStatusFilter('all');
                  setCollectiveFilter('all');
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
                {filteredSubInvoices.length} sous-facture{filteredSubInvoices.length !== 1 ? 's' : ''} trouvée{filteredSubInvoices.length !== 1 ? 's' : ''}
                {subInvoices.length !== filteredSubInvoices.length && ` sur ${subInvoices.length} au total`}
              </small>
              <div className="d-flex gap-2 flex-wrap">
                <span className="badge bg-success">
                  {subInvoices.filter((sub: any) => sub.paymentStatus === 'paid').length} Payées
                </span>
                <span className="badge bg-warning text-dark">
                  {subInvoices.filter((sub: any) => sub.paymentStatus === 'pending').length} En attente
                </span>
                <span className="badge bg-info">
                  {subInvoices.filter((sub: any) => sub.status === 'finalized').length} Finalisées
                </span>
                <span className="badge bg-secondary">
                  {subInvoices.filter((sub: any) => sub.status === 'draft').length} Brouillons
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-invoices Table */}
      {filteredSubInvoices.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <i className="bi bi-files display-1 text-muted mb-3"></i>
            <h4 className="text-muted">Aucune sous-facture trouvée</h4>
            <p className="text-muted mb-4">
              {subInvoices.length === 0 
                ? "Les sous-factures sont générées automatiquement lorsque vous créez des factures collectives."
                : "Aucune sous-facture ne correspond aux critères de recherche."
              }
            </p>
            {subInvoices.length === 0 && (
              <div className="d-flex gap-2 justify-content-center">
                <Link href="/dashboard/create-invoice" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Créer une facture collective
                </Link>
                <Link href="/dashboard/collectives" className="btn btn-outline-primary">
                  <i className="bi bi-people me-2"></i>
                  Gérer les collectifs
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="border-0 fw-semibold">Facture Parent</th>
                    <th className="border-0 fw-semibold">Émetteur</th>
                    <th className="border-0 fw-semibold">Destinataire</th>
                    <th className="border-0 fw-semibold">Montant</th>
                    <th className="border-0 fw-semibold">Statut</th>
                    <th className="border-0 fw-semibold">Paiement</th>
                    <th className="border-0 fw-semibold">Créé le</th>
                    <th className="border-0 fw-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSubInvoices.map((subInvoice: any) => (
                    <tr key={subInvoice.id}>
                      <td>
                        <div>
                          <span className="fw-semibold text-dark">
                            {subInvoice.parentInvoice?.invoiceNumber || 'N/A'}
                          </span>
                          <br />
                          <small className="text-muted">
                            <i className="bi bi-people me-1"></i>
                            {subInvoice.parentInvoice?.collective?.name || 'N/A'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-circle text-muted me-2"></i>
                          <div>
                            <div className="fw-semibold">
                              {subInvoice.issuer?.name || 'N/A'}
                            </div>
                            <small className="text-muted">
                              {subInvoice.issuer?.email || 'N/A'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-person-badge text-muted me-2"></i>
                          <div>
                            <div className="fw-semibold">
                              {subInvoice.receiver?.name || 'N/A'}
                            </div>
                            <small className="text-muted">
                              {subInvoice.receiver?.email || 'N/A'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td className="fw-semibold">
                        {formatCurrencyRobust(subInvoice.amount)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(subInvoice.status)}`}>
                          {getStatusText(subInvoice.status)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getPaymentStatusBadgeClass(subInvoice.paymentStatus)}`}>
                          {getPaymentStatusText(subInvoice.paymentStatus)}
                        </span>
                      </td>
                      <td>
                        {new Date(subInvoice.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-center">
                          <Link 
                            href={`/dashboard/sub-invoices/${subInvoice.id}`} 
                            className="btn btn-sm btn-outline-primary"
                            title="Voir les détails"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {subInvoice.pdfUrl ? (
                            <a 
                              href={subInvoice.pdfUrl} 
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
                              onClick={() => handleGeneratePdf(subInvoice.id)}
                              disabled={pdfGenerating[subInvoice.id]}
                              title="Générer PDF"
                            >
                              {pdfGenerating[subInvoice.id] ? (
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted small">
                Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredSubInvoices.length)} 
                sur {filteredSubInvoices.length} résultats
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
                  {(() => {
                    const paginationItems = [];
                    let hasLeftEllipsis = false;
                    let hasRightEllipsis = false;

                    for (let page = 1; page <= totalPages; page++) {
                      if (
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      ) {
                        paginationItems.push(
                          <li key={`page-${page}`} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                            <button 
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      } else if (page === currentPage - 3 && !hasLeftEllipsis) {
                        hasLeftEllipsis = true;
                        paginationItems.push(
                          <li key="ellipsis-left" className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      } else if (page === currentPage + 3 && !hasRightEllipsis) {
                        hasRightEllipsis = true;
                        paginationItems.push(
                          <li key="ellipsis-right" className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                    }

                    return paginationItems;
                  })()}
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