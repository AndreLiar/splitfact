'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paymentStatus: string;
    invoiceDate: string;
    dueDate: string;
  }>;
}

interface ClientDashboardData {
  client: {
    name: string;
    email?: string;
  };
  projects: Project[];
  totalRevenue: number;
  totalPendingAmount: number;
  agencyMetrics: {
    projectsCompleted: number;
    averageDeliveryTime: number;
    clientSatisfactionScore: number;
    onTimeDeliveryRate: number;
  };
  teamExpertise: {
    [key: string]: string[];
  };
}

export default function ClientDashboardPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/client-dashboard/${token}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Dashboard non trouvé' : 'Erreur de chargement');
      }
      
      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClientDashboard();
    }
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      case 'on_hold': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      case 'on_hold': return 'En pause';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée';
      case 'pending': return 'En attente';
      case 'failed': return 'Échec';
      default: return status;
    }
  };

  const calculateProjectRevenue = (project: Project) => {
    return project.invoices
      .filter(invoice => invoice.paymentStatus === 'paid')
      .reduce((total, invoice) => total + invoice.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body text-center p-5">
                  <i className="bi bi-exclamation-triangle display-1 text-warning mb-3"></i>
                  <h3 className="text-dark mb-3">Accès non autorisé</h3>
                  <p className="text-muted mb-4">
                    {error || 'Ce lien n\'est pas valide ou a expiré.'}
                  </p>
                  <Link href="/" className="btn btn-primary">
                    Retour à l'accueil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white shadow-sm py-4 mb-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '50px', height: '50px' }}>
                  <i className="bi bi-people text-white fs-4"></i>
                </div>
                <div>
                  <h1 className="h4 text-dark mb-1">Tableau de bord projet</h1>
                  <p className="text-muted mb-0">
                    Client: <span className="fw-semibold">{data.client.name}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <Link href="/" className="btn btn-outline-primary">
                <i className="bi bi-house me-2"></i>
                Splitfact
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container pb-5">
        {/* Financial Overview */}
        <div className="row mb-4 g-3">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-currency-euro text-success fs-3"></i>
                </div>
                <h3 className="text-success mb-1">
                  {data.totalRevenue.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </h3>
                <p className="text-muted mb-0">Revenus totaux</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-clock text-warning fs-3"></i>
                </div>
                <h3 className="text-warning mb-1">
                  {data.totalPendingAmount.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  })}
                </h3>
                <p className="text-muted mb-0">En attente de paiement</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body text-center p-4">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '60px', height: '60px' }}>
                  <i className="bi bi-kanban text-primary fs-3"></i>
                </div>
                <h3 className="text-primary mb-1">{data.projects.length}</h3>
                <p className="text-muted mb-0">Projets totaux</p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-0 pb-0">
                <h5 className="card-title text-dark mb-0">
                  <i className="bi bi-kanban me-2 text-primary"></i>
                  Projets
                </h5>
              </div>
              <div className="card-body">
                {data.projects.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-kanban display-4 text-muted mb-3"></i>
                    <p className="text-muted">Aucun projet en cours</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {data.projects.map((project) => {
                      const revenue = calculateProjectRevenue(project);
                      const progressPercent = project.budget ? (revenue / project.budget) * 100 : 0;

                      return (
                        <div key={project.id} className="col-lg-6">
                          <div className="card border-light">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <h6 className="text-dark mb-0">{project.name}</h6>
                                <span className={`badge bg-${getStatusColor(project.status)}`}>
                                  {getStatusText(project.status)}
                                </span>
                              </div>
                              
                              {project.description && (
                                <p className="text-muted small mb-3">{project.description}</p>
                              )}

                              {project.budget && (
                                <div className="mb-3">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className="text-muted">Budget</small>
                                    <small className="text-muted">
                                      {revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} / 
                                      {project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                    </small>
                                  </div>
                                  <div className="progress" style={{ height: '6px' }}>
                                    <div 
                                      className={`progress-bar ${progressPercent > 100 ? 'bg-warning' : 'bg-success'}`}
                                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              <div className="row g-2 text-center">
                                <div className="col-6">
                                  <div className="p-2 bg-light rounded">
                                    <div className="fw-bold text-primary">{project.invoices.length}</div>
                                    <small className="text-muted">Factures</small>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="p-2 bg-light rounded">
                                    <div className="fw-bold text-success">
                                      {revenue.toLocaleString('fr-FR', { 
                                        style: 'currency', 
                                        currency: 'EUR',
                                        maximumFractionDigits: 0 
                                      })}
                                    </div>
                                    <small className="text-muted">Revenus</small>
                                  </div>
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
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-0 pb-0">
                <h5 className="card-title text-dark mb-0">
                  <i className="bi bi-receipt me-2 text-primary"></i>
                  Dernières factures
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Numéro</th>
                        <th>Projet</th>
                        <th>Date</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Échéance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects
                        .flatMap(project => 
                          project.invoices.map(invoice => ({ ...invoice, projectName: project.name }))
                        )
                        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
                        .slice(0, 10)
                        .map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="fw-semibold">{invoice.invoiceNumber}</td>
                            <td>{invoice.projectName}</td>
                            <td>{new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</td>
                            <td className="fw-semibold">
                              {invoice.totalAmount.toLocaleString('fr-FR', { 
                                style: 'currency', 
                                currency: 'EUR' 
                              })}
                            </td>
                            <td>
                              <span className={`badge bg-${getPaymentStatusColor(invoice.paymentStatus)}`}>
                                {getPaymentStatusText(invoice.paymentStatus)}
                              </span>
                            </td>
                            <td>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {data.projects.every(p => p.invoices.length === 0) && (
                    <div className="text-center py-4">
                      <i className="bi bi-receipt display-4 text-muted mb-3"></i>
                      <p className="text-muted">Aucune facture disponible</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-top py-4 mt-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style={{ width: '35px', height: '35px' }}>
                  <i className="bi bi-lightning-charge-fill text-white"></i>
                </div>
                <div>
                  <h6 className="text-dark mb-0">Splitfact</h6>
                  <small className="text-muted">Partage automatique de revenus</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">
                Tableau de bord sécurisé • Mis à jour en temps réel
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}