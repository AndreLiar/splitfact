'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const clientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tvaNumber: z.string().optional().or(z.literal('')),
  legalStatus: z.string().optional().or(z.literal('')),
  shareCapital: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export default function ClientManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Form states
  const [formData, setFormData] = useState<z.infer<typeof clientSchema>>({
    name: '',
    email: '',
    siret: '',
    address: '',
    tvaNumber: '',
    legalStatus: '',
    shareCapital: '',
    contactName: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Filter and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Import states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchClients();
    }
  }, [status, router]);

  // Filter and search clients
  useEffect(() => {
    let filtered = clients.filter((client: any) => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.siret || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || (() => {
        switch (statusFilter) {
          case 'with-email': return client.email && client.email.length > 0;
          case 'with-siret': return client.siret && client.siret.length > 0;
          case 'complete': return client.email && client.siret && client.address;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesStatus;
    });

    // Sort filtered results
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [clients, searchTerm, statusFilter, sortBy]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setClients(data);
      setFilteredClients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddClient = () => {
    setCurrentClient(null);
    setFormData({
      name: '',
      email: '',
      siret: '',
      address: '',
      tvaNumber: '',
      legalStatus: '',
      shareCapital: '',
      contactName: '',
      phone: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditClient = (client: any) => {
    setCurrentClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      siret: client.siret || '',
      address: client.address || '',
      tvaNumber: client.tvaNumber || '',
      legalStatus: client.legalStatus || '',
      shareCapital: client.shareCapital || '',
      contactName: client.contactName || '',
      phone: client.phone || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      fetchClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      const method = currentClient ? 'PUT' : 'POST';
      const url = currentClient ? `/api/clients/${currentClient.id}` : '/api/clients';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      setShowModal(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Import functionality
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setImportError(null);
      setImportSuccess(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setImportError('Veuillez sélectionner un fichier CSV.');
      return;
    }

    setUploading(true);
    setImportError(null);
    setImportSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/collectives/dummyCollectiveId/clients/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Échec de l'importation des clients.";
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setImportSuccess(`Importation réussie: ${result.importedCount} clients importés, ${result.skippedCount} ignorés.`);
      setSelectedFile(null);
      fetchClients(); // Refresh the list
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const getClientCompleteness = (client: any) => {
    const fields = ['name', 'email', 'siret', 'address', 'contactName', 'phone'];
    const filledFields = fields.filter(field => client[field] && client[field].trim().length > 0);
    return Math.round((filledFields.length / fields.length) * 100);
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
          <h1 className="h3 mb-0 text-dark">Gestion des Clients</h1>
          <p className="text-muted mb-0">
            Gérez votre carnet d'adresses clients et importez des données
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary"
            onClick={() => setActiveTab('import')}
          >
            <i className="bi bi-upload me-2"></i>
            Importer CSV
          </button>
          <button className="btn btn-primary" onClick={handleAddClient}>
            <i className="bi bi-person-plus me-2"></i>
            Nouveau Client
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-transparent border-0">
          <ul className="nav nav-tabs card-header-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <i className="bi bi-list-ul me-2"></i>
                Liste des clients ({filteredClients.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'import' ? 'active' : ''}`}
                onClick={() => setActiveTab('import')}
              >
                <i className="bi bi-upload me-2"></i>
                Importer des clients
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {/* Clients List Tab */}
          {activeTab === 'list' && (
            <>
              {/* Filters and Search */}
              {clients.length > 0 && (
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Rechercher</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Nom, email, SIRET..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Filtrer par</label>
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">Tous les clients</option>
                      <option value="with-email">Avec email</option>
                      <option value="with-siret">Avec SIRET</option>
                      <option value="complete">Profil complet</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Trier par</label>
                    <select
                      className="form-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="name">Nom (A-Z)</option>
                      <option value="email">Email</option>
                      <option value="created">Plus récents</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold">Par page</label>
                    <select
                      className="form-select"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value={6}>6 clients</option>
                      <option value={8}>8 clients</option>
                      <option value={12}>12 clients</option>
                      <option value={24}>24 clients</option>
                      <option value={48}>48 clients</option>
                    </select>
                  </div>
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setSortBy('name');
                        setCurrentPage(1);
                      }}
                      title="Réinitialiser les filtres"
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              {/* Clients Grid */}
              {filteredClients.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-vcard display-1 text-muted mb-3"></i>
                  <h4 className="text-muted">
                    {clients.length === 0 ? 'Aucun client enregistré' : 'Aucun résultat'}
                  </h4>
                  <p className="text-muted mb-4">
                    {clients.length === 0 
                      ? "Commencez par ajouter vos premiers clients ou importez-les depuis un fichier CSV."
                      : "Aucun client ne correspond aux critères de recherche."
                    }
                  </p>
                  {clients.length === 0 && (
                    <div className="d-flex gap-2 justify-content-center">
                      <button className="btn btn-primary" onClick={handleAddClient}>
                        <i className="bi bi-person-plus me-2"></i>
                        Ajouter un client
                      </button>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => setActiveTab('import')}
                      >
                        <i className="bi bi-upload me-2"></i>
                        Importer des clients
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="row">
                    {currentClients.map((client: any) => {
                      const completeness = getClientCompleteness(client);
                      return (
                        <div key={client.id} className="col-lg-4 col-md-6 mb-4">
                          <div className="card h-100 shadow-sm border-0 hover-card">
                            <div className="card-header bg-transparent border-0 pb-2">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-bold text-dark">{client.name}</h6>
                                  <small className="text-muted">
                                    Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                                  </small>
                                </div>
                                <div className="dropdown">
                                  <button 
                                    className="btn btn-sm btn-outline-secondary dropdown-toggle border-0"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="bi bi-three-dots"></i>
                                  </button>
                                  <ul className="dropdown-menu dropdown-menu-end">
                                    <li>
                                      <button 
                                        className="dropdown-item"
                                        onClick={() => handleEditClient(client)}
                                      >
                                        <i className="bi bi-pencil me-2"></i>Modifier
                                      </button>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                      <button 
                                        className="dropdown-item text-danger"
                                        onClick={() => handleDeleteClient(client.id)}
                                      >
                                        <i className="bi bi-trash me-2"></i>Supprimer
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            
                            <div className="card-body pt-0">
                              <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <small className="text-muted">Profil complété</small>
                                  <small className="fw-semibold">{completeness}%</small>
                                </div>
                                <div className="progress" style={{ height: '4px' }}>
                                  <div 
                                    className={`progress-bar ${
                                      completeness >= 80 ? 'bg-success' : 
                                      completeness >= 50 ? 'bg-warning' : 'bg-danger'
                                    }`}
                                    style={{ width: `${completeness}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="mb-2">
                                <i className="bi bi-envelope text-muted me-2"></i>
                                <small>{client.email || 'Email non renseigné'}</small>
                              </div>
                              
                              <div className="mb-2">
                                <i className="bi bi-building text-muted me-2"></i>
                                <small>{client.siret || 'SIRET non renseigné'}</small>
                              </div>
                              
                              <div className="mb-2">
                                <i className="bi bi-person text-muted me-2"></i>
                                <small>{client.contactName || 'Contact non renseigné'}</small>
                              </div>
                              
                              {client.phone && (
                                <div className="mb-2">
                                  <i className="bi bi-telephone text-muted me-2"></i>
                                  <small>{client.phone}</small>
                                </div>
                              )}
                            </div>

                            <div className="card-footer bg-transparent border-0 pt-0">
                              <div className="d-flex gap-2">
                                <button 
                                  className="btn btn-primary flex-fill btn-sm"
                                  onClick={() => handleEditClient(client)}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Modifier
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDeleteClient(client.id)}
                                  title="Supprimer"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {filteredClients.length > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                      <div className="text-muted small">
                        <i className="bi bi-info-circle me-1"></i>
                        Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredClients.length)} 
                        sur {filteredClients.length} clients
                        {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
                      </div>
                      {totalPages > 1 && (
                        <nav aria-label="Navigation des pages">
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                title="Page précédente"
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
                                  <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <button 
                                      className="page-link"
                                      onClick={() => setCurrentPage(page)}
                                      title={`Page ${page}`}
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
                            }).filter(Boolean)}
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                title="Page suivante"
                              >
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="text-center mb-4">
                  <i className="bi bi-upload display-4 text-primary mb-3"></i>
                  <h4>Importer des clients depuis un fichier CSV</h4>
                  <p className="text-muted">
                    Gagnez du temps en important plusieurs clients à la fois
                  </p>
                </div>

                <div className="card bg-light border-0 mb-4">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      Format du fichier CSV
                    </h6>
                    <p className="small text-muted mb-2">
                      Votre fichier CSV doit contenir les colonnes suivantes (seul le nom est obligatoire) :
                    </p>
                    <div className="row">
                      <div className="col-md-6">
                        <ul className="list-unstyled small">
                          <li><code>name</code> <span className="text-danger">*obligatoire</span></li>
                          <li><code>email</code></li>
                          <li><code>siret</code></li>
                          <li><code>address</code></li>
                          <li><code>tvaNumber</code></li>
                        </ul>
                      </div>
                      <div className="col-md-6">
                        <ul className="list-unstyled small">
                          <li><code>legalStatus</code></li>
                          <li><code>shareCapital</code></li>
                          <li><code>contactName</code></li>
                          <li><code>phone</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUpload}>
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="mb-4">
                        <label htmlFor="csvFile" className="form-label fw-semibold">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Sélectionner le fichier CSV
                        </label>
                        <input
                          type="file"
                          className="form-control form-control-lg"
                          id="csvFile"
                          accept=".csv"
                          onChange={handleFileChange}
                          required
                        />
                      </div>

                      {importSuccess && (
                        <div className="alert alert-success d-flex align-items-center">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          {importSuccess}
                        </div>
                      )}
                      
                      {importError && (
                        <div className="alert alert-danger d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {importError}
                        </div>
                      )}

                      <div className="d-flex gap-3">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={uploading || !selectedFile}
                        >
                          {uploading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Importation en cours...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-upload me-2"></i>
                              Importer les clients
                            </>
                          )}
                        </button>
                        <button 
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setActiveTab('list')}
                        >
                          <i className="bi bi-arrow-left me-2"></i>
                          Retour à la liste
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">
                    {currentClient ? 'Modifier le client' : 'Nouveau client'}
                  </h5>
                  <small className="text-muted">
                    {currentClient ? 'Modifiez les informations du client' : 'Ajoutez un nouveau client à votre carnet d\'adresses'}
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label fw-semibold">
                        Nom du client <span className="text-danger">*</span>
                      </label>
                      <input 
                        type="text" 
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label fw-semibold">Email</label>
                      <input 
                        type="email" 
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                      />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="contactName" className="form-label fw-semibold">Nom du contact</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="contactName" 
                        name="contactName" 
                        value={formData.contactName} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="phone" className="form-label fw-semibold">Téléphone</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="address" className="form-label fw-semibold">Adresse</label>
                      <textarea 
                        className="form-control" 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleInputChange} 
                        rows={3}
                      ></textarea>
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="siret" className="form-label fw-semibold">SIRET</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="siret" 
                        name="siret" 
                        value={formData.siret} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="tvaNumber" className="form-label fw-semibold">Numéro de TVA</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="tvaNumber" 
                        name="tvaNumber" 
                        value={formData.tvaNumber} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="legalStatus" className="form-label fw-semibold">Statut légal</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="legalStatus" 
                        name="legalStatus" 
                        value={formData.legalStatus} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="shareCapital" className="form-label fw-semibold">Capital social</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="shareCapital" 
                        name="shareCapital" 
                        value={formData.shareCapital} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-4">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                      Annuler
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-lg me-2"></i>
                      {currentClient ? 'Enregistrer les modifications' : 'Ajouter le client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hover effects CSS */}
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