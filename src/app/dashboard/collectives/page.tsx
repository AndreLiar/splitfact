'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CollectivesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collectives, setCollectives] = useState([]);
  const [filteredCollectives, setFilteredCollectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchCollectives();
    }
  }, [status, router]);

  const fetchCollectives = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collectives');
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setCollectives(data);
      setFilteredCollectives(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort collectives
  useEffect(() => {
    let filtered = collectives.filter((collective: any) => {
      const matchesSearch = 
        collective.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (collective.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || (() => {
        const userMember = collective.members?.find((member: any) => member.userId === session?.user?.id);
        return userMember?.role === roleFilter;
      })();
      
      return matchesSearch && matchesRole;
    });

    // Sort filtered results
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return (b.members?.length || 0) - (a.members?.length || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredCollectives(filtered);
  }, [collectives, searchTerm, roleFilter, sortBy, session]);

  const getUserRole = (collective: any) => {
    const userMember = collective.members?.find((member: any) => member.userId === session?.user?.id);
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
      case 'admin': return 'Admin';
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

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-dark">Mes Collectifs</h1>
          <p className="text-muted mb-0">
            Gérez vos groupes de travail et collaborez en équipe
          </p>
        </div>
        <Link href="/dashboard/collectives/create" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          Nouveau Collectif
        </Link>
      </div>

      {/* Filters and Search */}
      {collectives.length > 0 && (
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Rechercher</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Nom du collectif, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Mon rôle</label>
                <select
                  className="form-select"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Tous les rôles</option>
                  <option value="owner">Propriétaire</option>
                  <option value="admin">Administrateur</option>
                  <option value="member">Membre</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Trier par</label>
                <select
                  className="form-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Nom (A-Z)</option>
                  <option value="members">Nombre de membres</option>
                  <option value="created">Plus récents</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setSortBy('name');
                  }}
                  title="Réinitialiser les filtres"
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reset
                </button>
              </div>
            </div>

            {/* Results summary */}
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {filteredCollectives.length} collectif{filteredCollectives.length !== 1 ? 's' : ''} trouvé{filteredCollectives.length !== 1 ? 's' : ''}
                  {collectives.length !== filteredCollectives.length && ` sur ${collectives.length} au total`}
                </small>
                <div className="d-flex gap-2">
                  <span className="badge bg-primary">
                    {collectives.filter((c: any) => getUserRole(c) === 'admin').length} Admin
                  </span>
                  <span className="badge bg-success">
                    {collectives.filter((c: any) => getUserRole(c) === 'owner').length} Propriétaire
                  </span>
                  <span className="badge bg-secondary">
                    {collectives.filter((c: any) => getUserRole(c) === 'member').length} Membre
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collectives Grid */}
      {filteredCollectives.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <i className="bi bi-people display-1 text-muted mb-3"></i>
            <h4 className="text-muted">
              {collectives.length === 0 ? 'Aucun collectif trouvé' : 'Aucun résultat'}
            </h4>
            <p className="text-muted mb-4">
              {collectives.length === 0 
                ? "Vous ne faites partie d'aucun collectif pour le moment. Créez-en un ou rejoignez-en un existant pour commencer à collaborer."
                : "Aucun collectif ne correspond aux critères de recherche."
              }
            </p>
            {collectives.length === 0 && (
              <div className="d-flex gap-2 justify-content-center">
                <Link href="/dashboard/collectives/create" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>
                  Créer un collectif
                </Link>
                <Link href="/dashboard/create-invoice" className="btn btn-outline-primary">
                  <i className="bi bi-receipt me-2"></i>
                  Créer une facture individuelle
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="row">
          {filteredCollectives.map((collective: any) => {
            const userRole = getUserRole(collective);
            const totalInvoices = collective.invoices?.length || 0;
            const totalRevenue = collective.invoices?.reduce((sum: number, invoice: any) => {
              return sum + (parseFloat(invoice.totalAmount) || 0);
            }, 0) || 0;

            return (
              <div key={collective.id} className="col-lg-4 col-md-6 mb-4">
                <div className="card h-100 shadow-sm border-0 hover-card">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <span className={`badge ${getRoleBadgeClass(userRole)}`}>
                        {getRoleText(userRole)}
                      </span>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary dropdown-toggle"
                          type="button"
                          data-bs-toggle="dropdown"
                        >
                          <i className="bi bi-three-dots"></i>
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <Link href={`/dashboard/collectives/${collective.id}`} className="dropdown-item">
                              <i className="bi bi-eye me-2"></i>Voir les détails
                            </Link>
                          </li>
                          <li>
                            <button className="dropdown-item">
                              <i className="bi bi-share me-2"></i>Inviter un membre
                            </button>
                          </li>
                          {(userRole === 'admin' || userRole === 'owner') && (
                            <>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button className="dropdown-item text-warning">
                                  <i className="bi bi-pencil me-2"></i>Modifier
                                </button>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body pt-2">
                    <h5 className="card-title text-dark mb-2">
                      {collective.name}
                    </h5>
                    <p className="card-text text-muted small mb-3" style={{ minHeight: '40px' }}>
                      {collective.description || 'Aucune description disponible'}
                    </p>
                    
                    {/* Stats */}
                    <div className="row g-2 mb-3">
                      <div className="col-4">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="fw-bold text-primary">{collective.members?.length || 0}</div>
                          <small className="text-muted">Membres</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="fw-bold text-success">{totalInvoices}</div>
                          <small className="text-muted">Factures</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="fw-bold text-info">
                            {totalRevenue.toLocaleString('fr-FR', { 
                              style: 'currency', 
                              currency: 'EUR',
                              maximumFractionDigits: 0 
                            })}
                          </div>
                          <small className="text-muted">Revenus</small>
                        </div>
                      </div>
                    </div>

                    {/* Member avatars */}
                    <div className="d-flex align-items-center mb-3">
                      <div className="d-flex me-2" style={{ marginLeft: '0' }}>
                        {collective.members?.slice(0, 4).map((member: any, index: number) => (
                          <div 
                            key={member.userId}
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              fontSize: '10px',
                              marginLeft: index > 0 ? '-6px' : '0',
                              zIndex: 4 - index,
                              border: '2px solid white'
                            }}
                            title={member.user?.name || member.user?.email}
                          >
                            {(member.user?.name || member.user?.email || '?').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {collective.members?.length > 4 && (
                          <div 
                            className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '24px', 
                              height: '24px', 
                              fontSize: '9px',
                              marginLeft: '-6px',
                              border: '2px solid white'
                            }}
                          >
                            +{collective.members.length - 4}
                          </div>
                        )}
                      </div>
                      <small className="text-muted">
                        Créé le {new Date(collective.createdAt).toLocaleDateString('fr-FR')}
                      </small>
                    </div>
                  </div>

                  <div className="card-footer bg-transparent border-0 pt-0">
                    <div className="d-flex gap-2">
                      <Link 
                        href={`/dashboard/collectives/${collective.id}`} 
                        className="btn btn-primary flex-fill btn-sm"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Voir les détails
                      </Link>
                      <Link 
                        href={`/dashboard/create-invoice?collective=${collective.id}`}
                        className="btn btn-outline-primary btn-sm"
                        title="Créer une facture pour ce collectif"
                      >
                        <i className="bi bi-plus-circle"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Additional CSS for hover effects */}
      <style jsx>{`
        .hover-card {
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}