'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

export default function CollectiveDetailPage({ params }: { params: Promise<{ collectiveId: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { collectiveId } = React.use(params);
  const [collective, setCollective] = useState<any>(null);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [assignedClients, setAssignedClients] = useState<any[]>([]);
  const [selectedClientToAssign, setSelectedClientToAssign] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [assignClientLoading, setAssignClientLoading] = useState(false);
  const [assignClientError, setAssignClientError] = useState<string | null>(null);
  const [assignClientSuccess, setAssignClientSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchCollective();
      fetchAllClients();
      fetchAssignedClients();
    }
  }, [status, router, collectiveId]);

  const fetchCollective = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/collectives/${collectiveId}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setCollective(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setAllClients(data);
    } catch (err: any) {
      console.error("Error fetching all clients:", err);
    }
  };

  const fetchAssignedClients = async () => {
    try {
      const response = await fetch(`/api/collectives/${collectiveId}/clients`);
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setAssignedClients(data);
    } catch (err: any) {
      console.error("Error fetching assigned clients:", err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberLoading(true);
    setAddMemberError(null);
    setAddMemberSuccess(null);

    try {
      const response = await fetch(`/api/collectives/${collectiveId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to add member';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      setAddMemberSuccess('Membre ajouté avec succès!');
      setNewMemberEmail('');
      setNewMemberRole('member');
      fetchCollective();
    } catch (err: any) {
      setAddMemberError(err.message);
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleAssignClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignClientLoading(true);
    setAssignClientError(null);
    setAssignClientSuccess(null);

    if (!selectedClientToAssign) {
      setAssignClientError('Veuillez sélectionner un client.');
      setAssignClientLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/collectives/${collectiveId}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: selectedClientToAssign }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to assign client';
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      setAssignClientSuccess('Client assigné avec succès!');
      setSelectedClientToAssign('');
      fetchAssignedClients();
      fetchAllClients();
    } catch (err: any) {
      setAssignClientError(err.message);
    } finally {
      setAssignClientLoading(false);
    }
  };

  const handleUnassignClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désassigner ce client du collectif ?')) return;

    try {
      const response = await fetch(`/api/collectives/${collectiveId}/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      fetchAssignedClients();
      fetchAllClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const availableClients = allClients.filter(
    (client) => !assignedClients.some((assigned) => assigned.id === client.id)
  );

  const getUserRole = () => {
    if (!collective || !session?.user?.id) return 'member';
    const userMember = collective.members?.find((member: any) => member.userId === session.user.id);
    return userMember?.role || 'member';
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary';
      case 'owner': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'owner': return 'Propriétaire';
      default: return 'Membre';
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

  if (!collective) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning d-flex align-items-center">
          <i className="bi bi-info-circle-fill me-2"></i>
          Collectif introuvable.
        </div>
      </div>
    );
  }

  const totalRevenue = collective.invoices?.reduce((sum: number, invoice: any) => {
    return sum + (parseFloat(invoice.totalAmount || '0'));
  }, 0) || 0;

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link href="/dashboard/collectives" className="text-decoration-none">
                  Collectifs
                </Link>
              </li>
              <li className="breadcrumb-item active">{collective.name}</li>
            </ol>
          </nav>
          <div className="d-flex align-items-center gap-3">
            <h1 className="h3 mb-0 text-dark">{collective.name}</h1>
            <span className={`badge ${getRoleBadgeClass(getUserRole())}`}>
              {getRoleText(getUserRole())}
            </span>
          </div>
          <p className="text-muted mb-0">
            {collective.description || 'Aucune description disponible'}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href={`/dashboard/create-invoice?collective=${collectiveId}`}
            className="btn btn-primary"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nouvelle Facture
          </Link>
          <div className="dropdown">
            <button 
              className="btn btn-outline-secondary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-three-dots"></i>
            </button>
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item">
                  <i className="bi bi-share me-2"></i>Inviter un membre
                </button>
              </li>
              <li>
                <button className="dropdown-item">
                  <i className="bi bi-gear me-2"></i>Paramètres
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-people text-primary display-6"></i>
              </div>
              <h4 className="fw-bold text-dark">{collective.members?.length || 0}</h4>
              <p className="text-muted mb-0">Membres</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-receipt text-success display-6"></i>
              </div>
              <h4 className="fw-bold text-dark">{collective.invoices?.length || 0}</h4>
              <p className="text-muted mb-0">Factures</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-person-badge text-info display-6"></i>
              </div>
              <h4 className="fw-bold text-dark">{assignedClients.length}</h4>
              <p className="text-muted mb-0">Clients</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="bi bi-currency-euro text-warning display-6"></i>
              </div>
              <h4 className="fw-bold text-dark">
                {totalRevenue.toLocaleString('fr-FR', { 
                  style: 'currency', 
                  currency: 'EUR',
                  maximumFractionDigits: 0 
                })}
              </h4>
              <p className="text-muted mb-0">Revenus</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-transparent border-0">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="bi bi-grid me-2"></i>
                Vue d'ensemble
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                <i className="bi bi-people me-2"></i>
                Membres
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'clients' ? 'active' : ''}`}
                onClick={() => setActiveTab('clients')}
              >
                <i className="bi bi-person-badge me-2"></i>
                Clients
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
              >
                <i className="bi bi-receipt me-2"></i>
                Factures
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="row">
              <div className="col-md-6">
                <h5 className="mb-3">Informations Générales</h5>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td className="fw-semibold text-muted">Nom:</td>
                        <td>{collective.name}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-muted">Description:</td>
                        <td>{collective.description || 'Aucune description'}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-muted">Créé le:</td>
                        <td>{new Date(collective.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                      <tr>
                        <td className="fw-semibold text-muted">Votre rôle:</td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(getUserRole())}`}>
                            {getRoleText(getUserRole())}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-md-6">
                <h5 className="mb-3">Activité Récente</h5>
                <div className="list-group list-group-flush">
                  {collective.invoices?.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} className="list-group-item border-0 px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">{invoice.invoiceNumber}</h6>
                          <small className="text-muted">{invoice.client?.name}</small>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold">
                            {parseFloat(invoice.totalAmount || '0').toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </div>
                          <small className="text-muted">
                            {new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}
                          </small>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-receipt display-4 mb-2"></i>
                      <p>Aucune facture pour le moment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3">Membres du Collectif</h5>
                {collective.members && collective.members.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Membre</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Rejoint le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collective.members.map((member: any) => (
                          <tr key={member.userId}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div 
                                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '32px', height: '32px', fontSize: '14px' }}
                                >
                                  {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-semibold">{member.user?.name || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td>{member.user?.email}</td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                {getRoleText(member.role)}
                              </span>
                            </td>
                            <td>
                              {new Date(member.joinedAt || member.createdAt).toLocaleDateString('fr-FR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-people display-4 mb-2"></i>
                    <p>Aucun membre dans ce collectif.</p>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="card bg-light border-0">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-person-plus me-2"></i>
                      Ajouter un Membre
                    </h6>
                    <form onSubmit={handleAddMember}>
                      <div className="mb-3">
                        <label htmlFor="memberEmail" className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          id="memberEmail"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="memberRole" className="form-label">Rôle</label>
                        <select
                          className="form-select"
                          id="memberRole"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                        >
                          <option value="member">Membre</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      {addMemberError && (
                        <div className="alert alert-danger alert-sm">{addMemberError}</div>
                      )}
                      {addMemberSuccess && (
                        <div className="alert alert-success alert-sm">{addMemberSuccess}</div>
                      )}
                      <button type="submit" className="btn btn-primary btn-sm w-100" disabled={addMemberLoading}>
                        {addMemberLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Ajout...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-plus-circle me-2"></i>
                            Ajouter
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="row">
              <div className="col-md-8">
                <h5 className="mb-3">Clients Assignés</h5>
                {assignedClients && assignedClients.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>SIRET</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedClients.map((client: any) => (
                          <tr key={client.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-building text-muted me-2"></i>
                                <div className="fw-semibold">{client.name}</div>
                              </div>
                            </td>
                            <td>{client.email || 'N/A'}</td>
                            <td>
                              <code className="small">{client.siret || 'N/A'}</code>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-danger" 
                                onClick={() => handleUnassignClient(client.id)}
                              >
                                <i className="bi bi-x-circle me-1"></i>
                                Désassigner
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-person-badge display-4 mb-2"></i>
                    <p>Aucun client assigné à ce collectif.</p>
                  </div>
                )}
              </div>
              <div className="col-md-4">
                <div className="card bg-light border-0">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-person-plus-fill me-2"></i>
                      Assigner un Client
                    </h6>
                    <form onSubmit={handleAssignClient}>
                      <div className="mb-3">
                        <label htmlFor="clientToAssign" className="form-label">Client</label>
                        <select
                          className="form-select"
                          id="clientToAssign"
                          value={selectedClientToAssign}
                          onChange={(e) => setSelectedClientToAssign(e.target.value)}
                          required
                        >
                          <option value="">-- Choisir un client --</option>
                          {availableClients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {assignClientError && (
                        <div className="alert alert-danger alert-sm">{assignClientError}</div>
                      )}
                      {assignClientSuccess && (
                        <div className="alert alert-success alert-sm">{assignClientSuccess}</div>
                      )}
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-sm w-100" 
                        disabled={assignClientLoading || !selectedClientToAssign}
                      >
                        {assignClientLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Assignation...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-plus-circle me-2"></i>
                            Assigner
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Factures du Collectif</h5>
                <Link 
                  href={`/dashboard/create-invoice?collective=${collectiveId}`}
                  className="btn btn-primary btn-sm"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Nouvelle Facture
                </Link>
              </div>
              {collective.invoices && collective.invoices.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Numéro</th>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Statut</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collective.invoices.map((invoice: any) => (
                        <tr key={invoice.id}>
                          <td>
                            <div className="fw-semibold">{invoice.invoiceNumber}</div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-building text-muted me-2"></i>
                              {invoice.client?.name}
                            </div>
                          </td>
                          <td className="fw-semibold">
                            {parseFloat(invoice.totalAmount || '0').toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR'
                            })}
                          </td>
                          <td>
                            <span className={`badge ${
                              invoice.paymentStatus === 'paid' ? 'bg-success' : 
                              invoice.paymentStatus === 'pending' ? 'bg-warning text-dark' : 
                              'bg-secondary'
                            }`}>
                              {invoice.paymentStatus === 'paid' ? 'Payée' : 
                               invoice.paymentStatus === 'pending' ? 'En attente' : 
                               invoice.paymentStatus}
                            </span>
                          </td>
                          <td>{new Date(invoice.invoiceDate).toLocaleDateString('fr-FR')}</td>
                          <td>
                            <Link 
                              href={`/dashboard/invoices/${invoice.id}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye me-1"></i>
                              Voir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-receipt display-1 mb-3"></i>
                  <h4>Aucune facture</h4>
                  <p className="mb-4">Ce collectif n'a pas encore de factures associées.</p>
                  <Link 
                    href={`/dashboard/create-invoice?collective=${collectiveId}`}
                    className="btn btn-primary"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Créer la première facture
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}