'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { getLegalMentionsByFiscalRegime, formatCurrency } from '@/lib/utils'; // Import the utility function

interface UserProfile {
  name: string | null;
  siret: string | null;
  address: string | null;
  legalStatus: string | null;
  apeCode: string | null;
  tvaNumber: string | null;
  rcsNumber: string | null;
  shareCapital: string | null;
  fiscalRegime: string | null;
  microEntrepreneurType: "COMMERCANT" | "PRESTATAIRE" | "LIBERAL" | null;
}

interface Share {
  userId: string;
  shareType: 'percent' | 'fixed';
  shareValue: number;
  description?: string;
}

interface Client {
  id: string;
  name: string;
  address: string;
  siret?: string;
  tvaNumber?: string;
  legalStatus?: string;
  shareCapital?: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

interface FormData {
  clientId: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
  }>;
  collectiveId: string;
  paymentTerms: string;
  latePenaltyRate: string;
  recoveryIndemnity: number;
  shares: Share[];
  clientName?: string;
  clientAddress?: string;
  clientSiret?: string;
  clientTvaNumber?: string;
  clientLegalStatus?: string;
  clientShareCapital?: string;
  clientContactName?: string;
  clientEmail?: string;
  clientPhone?: string;
}

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    tvaRate: z.number().min(0, 'TVA rate cannot be negative'),
  })).min(1, 'At least one item is required'),
  collectiveId: z.string().optional(),
  paymentTerms: z.string().optional(),
  latePenaltyRate: z.string().optional(),
  recoveryIndemnity: z.number().optional(),
  clientName: z.string().optional(),
  clientAddress: z.string().optional(),
  clientSiret: z.string().optional(),
  clientTvaNumber: z.string().optional(),
  clientLegalStatus: z.string().optional(),
  clientShareCapital: z.string().optional(),
  clientContactName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  shares: z.array(z.object({
    userId: z.string().min(1, 'User is required'),
    shareType: z.enum(['percent', 'fixed']),
    shareValue: z.number().min(0, 'Share value cannot be negative'),
    description: z.string().optional(), // New field for share description
  })).optional(),
});

export default function CreateInvoicePage() {
  const { status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, tvaRate: 0 }], // Will be set properly based on fiscal regime
    collectiveId: '',
    paymentTerms: 'Paiement à 30 jours fin de mois',
    latePenaltyRate: '3 fois le taux d’intérêt légal',
    recoveryIndemnity: 40,
    shares: [] as Share[], // Initialize shares as an empty array
  });
  const [collectives, setCollectives] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [collectiveMembers, setCollectiveMembers] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserProfile();
      fetchCollectives();
      fetchClients();
    }
  }, [status, router]);

  useEffect(() => {
    if (formData.collectiveId) {
      fetchCollectiveMembers(formData.collectiveId);
    }
    fetchClients(); // Fetch clients independently of collectiveId
  }, [formData.collectiveId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/me');
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      setUserProfile(data);
      
      // Set TVA rate to 0 for all Micro-Entrepreneurs
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(item => ({ ...item, tvaRate: 0 }))
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectives = async () => {
    try {
      const response = await fetch('/api/collectives');
      if (!response.ok) {
        throw new Error('Failed to fetch collectives');
      }
      const data = await response.json();
      setCollectives(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/clients`); // New endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCollectiveMembers = async (collectiveId: string) => {
    try {
      const response = await fetch(`/api/collectives/${collectiveId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch collective members');
      }
      const data = await response.json();
      setCollectiveMembers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'clientId') {
      const selectedClient = clients.find((client: Client) => client.id === value);
      setFormData({
        ...formData,
        clientId: value,
        clientName: selectedClient?.name || '',
        clientAddress: selectedClient?.address || '',
        clientSiret: selectedClient?.siret || '',
        clientTvaNumber: selectedClient?.tvaNumber || '',
        clientLegalStatus: selectedClient?.legalStatus || '',
        clientShareCapital: selectedClient?.shareCapital || '',
        clientContactName: selectedClient?.contactName || '',
        clientEmail: selectedClient?.email || '',
        clientPhone: selectedClient?.phone || '',
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const items = [...formData.items];
    
    if (name === 'description') {
      items[index] = { ...items[index], [name]: value };
    } else {
      // Clean and parse numeric values properly
      const cleanValue = String(value).replace(/[^\d.,\-]/g, '').replace(',', '.');
      const numericValue = parseFloat(cleanValue) || 0;
      items[index] = { ...items[index], [name]: numericValue };
    }
    
    setFormData({ ...formData, items });
  };

  const handleShareChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const shares = [...formData.shares || []];
    
    if (name === 'shareValue') {
      // Clean and parse numeric values properly
      const cleanValue = String(value).replace(/[^\d.,\-]/g, '').replace(',', '.');
      const numericValue = parseFloat(cleanValue) || 0;
      shares[index] = { ...shares[index], [name]: numericValue };
    } else {
      shares[index] = { ...shares[index], [name]: value };
    }
    
    setFormData({ ...formData, shares });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, tvaRate: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const items = [...formData.items];
    items.splice(index, 1);
    setFormData({ ...formData, items });
  };

  const addShare = () => {
    setFormData({ ...formData, shares: [...formData.shares || [], { userId: '', shareType: 'percent', shareValue: 0 }] });
  };

  const removeShare = (index: number) => {
    const shares = [...formData.shares || []];
    shares.splice(index, 1);
    setFormData({ ...formData, shares });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = invoiceSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        ...result.data,
        collectiveId: result.data.collectiveId === '' ? null : result.data.collectiveId,
    }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error data:", errorData);
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      setErrors({ form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for enhanced UX with proper French fiscal regime handling
  // For Micro-Entrepreneurs, TVA is always exempt
  const isTvaExempt = () => {
    return true; // Always true for Micro-Entrepreneurs
  };

  const calculateItemTotal = (item: any) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return quantity * unitPrice; // No VAT for Micro-Entrepreneurs
  };

  const calculateInvoiceTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateTotalTVA = () => {
    return 0; // Always 0 for Micro-Entrepreneurs (TVA exempt)
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.clientId && formData.invoiceDate && formData.dueDate;
      case 2:
        return formData.items.length > 0 && formData.items.every(item => 
          item.description && item.quantity > 0 && item.unitPrice >= 0
        );
      case 3:
        return !formData.collectiveId || (formData.shares && formData.shares.length > 0);
      default:
        return true;
    }
  };

  const getStepTitle = (step: number) => {
    const titles = [
      '',
      'Informations générales',
      'Articles & Services',
      'Répartition collective',
      'Vérification & Création'
    ];
    return titles[step];
  };

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (!userProfile?.name || !userProfile?.siret || !userProfile?.address || !userProfile?.legalStatus || !userProfile?.apeCode ||
      !userProfile?.microEntrepreneurType) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4 className="alert-heading">Profil Incomplet</h4>
          <p>Veuillez compléter vos informations fiscales, y compris votre nom, SIRET, adresse, statut juridique, Code APE, et Type d'activité Micro-Entrepreneur (si applicable) avant de créer une facture.</p>
          <hr />
          <Link href="/dashboard/profile" className="btn btn-primary">
            Aller au Profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 py-lg-4">
      {/* Header with Progress */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="mb-1 text-darkGray">Créer une Facture</h1>
              <p className="text-mediumGray mb-0">Étape {currentStep} sur 4 - {getStepTitle(currentStep)}</p>
            </div>
            <div className="d-flex gap-2">
              <Link href="/dashboard" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-1"></i>
                Annuler
              </Link>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress mb-4" style={{ height: '8px' }}>
            <div 
              className="progress-bar bg-primary" 
              role="progressbar" 
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Main Content */}
          <div className="col-lg-8">
            
            {/* Step 1: General Information */}
            {currentStep === 1 && (
              <div className="card shadow-sm border-0 rounded-xl mobile-form-section">
                <div className="card-body p-4">
                  <h5 className="card-title text-darkGray mb-4 d-flex align-items-center mobile-form-title">
                    <i className="bi bi-info-circle me-2 text-primary"></i>
                    Informations générales
                  </h5>

                  {/* Issuer Information */}
                  <div className="mb-4">
                    <h6 className="text-darkGray mb-3">Vos informations (Émetteur)</h6>
                    <div className="bg-light rounded-xl p-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <small className="text-mediumGray">Nom</small>
                          <div className="fw-semibold text-darkGray">{userProfile.name}</div>
                        </div>
                        <div className="col-md-6">
                          <small className="text-mediumGray">SIRET</small>
                          <div className="fw-semibold text-darkGray">{userProfile.siret}</div>
                        </div>
                        <div className="col-12">
                          <small className="text-mediumGray">Adresse</small>
                          <div className="fw-semibold text-darkGray">{userProfile.address}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="row g-3">
                    <div className="col-lg-6 col-12 mobile-form-group">
                      <label htmlFor="collectiveId" className="form-label fw-semibold mobile-form-label">
                        <i className="bi bi-people me-1 text-primary"></i>
                        Collectif (optionnel)
                      </label>
                      <select 
                        className="form-select rounded-input mobile-form-control" 
                        id="collectiveId" 
                        name="collectiveId" 
                        value={formData.collectiveId} 
                        onChange={handleInputChange}
                      >
                        <option value="">Facture individuelle</option>
                        {collectives.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {formData.collectiveId && (
                        <small className="text-info">
                          <i className="bi bi-info-circle me-1"></i>
                          Cette facture sera partagée entre les membres du collectif
                        </small>
                      )}
                    </div>

                    <div className="col-lg-6 col-12 mobile-form-group">
                      <label htmlFor="clientId" className="form-label fw-semibold mobile-form-label">
                        <i className="bi bi-person-badge me-1 text-primary"></i>
                        Client *
                      </label>
                      <select 
                        className={`form-select rounded-input mobile-form-control ${errors.clientId ? 'is-invalid' : ''}`}
                        id="clientId" 
                        name="clientId" 
                        value={formData.clientId} 
                        onChange={handleInputChange}
                      >
                        <option value="">Sélectionner un client</option>
                        {clients.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {errors.clientId && <div className="invalid-feedback">{errors.clientId}</div>}
                    </div>

                    <div className="col-lg-4 col-md-6 col-12">
                      <label htmlFor="invoiceDate" className="form-label fw-semibold">
                        <i className="bi bi-calendar me-1 text-primary"></i>
                        Date de facture *
                      </label>
                      <input 
                        type="date" 
                        className={`form-control rounded-input ${errors.invoiceDate ? 'is-invalid' : ''}`}
                        id="invoiceDate" 
                        name="invoiceDate" 
                        value={formData.invoiceDate} 
                        onChange={handleInputChange} 
                      />
                      {errors.invoiceDate && <div className="invalid-feedback">{errors.invoiceDate}</div>}
                    </div>

                    <div className="col-lg-4 col-md-6 col-12">
                      <label htmlFor="dueDate" className="form-label fw-semibold">
                        <i className="bi bi-calendar-check me-1 text-primary"></i>
                        Date d'échéance *
                      </label>
                      <input 
                        type="date" 
                        className={`form-control rounded-input ${errors.dueDate ? 'is-invalid' : ''}`}
                        id="dueDate" 
                        name="dueDate" 
                        value={formData.dueDate} 
                        onChange={handleInputChange} 
                      />
                      {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="paymentTerms" className="form-label fw-semibold">
                        <i className="bi bi-credit-card me-1 text-primary"></i>
                        Conditions de paiement
                      </label>
                      <input 
                        type="text" 
                        className="form-control rounded-input" 
                        id="paymentTerms" 
                        name="paymentTerms" 
                        value={formData.paymentTerms} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>

                  {userProfile && getLegalMentionsByFiscalRegime(userProfile) && (
                    <div className="alert alert-info mt-4 border-0 rounded-xl">
                      <i className="bi bi-info-circle me-2"></i>
                      {getLegalMentionsByFiscalRegime(userProfile)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Items */}
            {currentStep === 2 && (
              <div className="card shadow-sm border-0 rounded-xl">
                <div className="card-body p-4">
                  <h5 className="card-title text-darkGray mb-4 d-flex align-items-center">
                    <i className="bi bi-list-ul me-2 text-primary"></i>
                    Articles & Services
                  </h5>

                  {formData.items.map((item, index) => (
                    <div key={index} className="card bg-light border-0 rounded-xl mb-3">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 text-darkGray">Article {index + 1}</h6>
                          {formData.items.length > 1 && (
                            <button 
                              type="button" 
                              className="btn btn-outline-danger btn-sm rounded-pill"
                              onClick={() => removeItem(index)}
                            >
                              <i className="bi bi-trash me-1"></i>
                              Supprimer
                            </button>
                          )}
                        </div>

                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label fw-semibold">Description *</label>
                            <input 
                              type="text" 
                              className="form-control rounded-input" 
                              name="description" 
                              value={item.description} 
                              onChange={(e) => handleItemChange(index, e)}
                              placeholder="Ex: Développement site web, Consultation, Formation..."
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Quantité *</label>
                            <input 
                              type="number" 
                              className="form-control rounded-input" 
                              name="quantity" 
                              value={isNaN(item.quantity) ? '' : item.quantity} 
                              onChange={(e) => handleItemChange(index, e)}
                              min="1"
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-semibold">Prix unitaire HT *</label>
                            <div className="input-group">
                              <input 
                                type="number" 
                                className="form-control rounded-input" 
                                name="unitPrice" 
                                value={isNaN(item.unitPrice) ? '' : item.unitPrice} 
                                onChange={(e) => handleItemChange(index, e)}
                                min="0"
                                step="0.01"
                              />
                              <span className="input-group-text bg-light">€</span>
                            </div>
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              TVA (%)
                              {isTvaExempt() && (
                                <small className="text-info d-block">Exemption TVA</small>
                              )}
                            </label>
                            {isTvaExempt() ? (
                              <div className="input-group">
                                <input 
                                  type="number" 
                                  className="form-control rounded-input bg-light" 
                                  name="tvaRate" 
                                  value={0} 
                                  disabled 
                                />
                                <span className="input-group-text bg-info text-white">
                                  <i className="bi bi-info-circle"></i>
                                </span>
                              </div>
                            ) : (
                              <input 
                                type="number" 
                                className="form-control rounded-input" 
                                name="tvaRate" 
                                value={isNaN(item.tvaRate) ? '' : item.tvaRate} 
                                onChange={(e) => handleItemChange(index, e)}
                                min="0"
                                max="100"
                              />
                            )}
                          </div>

                          <div className="col-md-3">
                            <label className="form-label fw-semibold">
                              Total
                            </label>
                            <div className="form-control bg-light rounded-input fw-bold text-primary">
                              {formatCurrency(calculateItemTotal(item))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    type="button" 
                    className="btn btn-outline-primary rounded-pill" 
                    onClick={addItem}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Ajouter un article
                  </button>

                  {errors.items && <div className="alert alert-danger mt-3">{errors.items}</div>}
                </div>
              </div>
            )}

            {/* Step 3: Shares (only if collective) */}
            {currentStep === 3 && (
              <div className="card shadow-sm border-0 rounded-xl">
                <div className="card-body p-4">
                  <h5 className="card-title text-darkGray mb-4 d-flex align-items-center">
                    <i className="bi bi-diagram-3 me-2 text-primary"></i>
                    Répartition collective
                  </h5>

                  {!formData.collectiveId ? (
                    <div className="text-center py-5">
                      <i className="bi bi-person display-4 text-mediumGray mb-3"></i>
                      <h6 className="text-darkGray">Facture individuelle</h6>
                      <p className="text-mediumGray">Cette facture n'est pas associée à un collectif.</p>
                    </div>
                  ) : (
                    <>
                      <div className="alert alert-info border-0 rounded-xl mb-4">
                        <i className="bi bi-info-circle me-2"></i>
                        Définissez comment les revenus de cette facture seront répartis entre les membres du collectif.
                      </div>

                      {formData.shares?.map((share, index) => (
                        <div key={index} className="card bg-light border-0 rounded-xl mb-3">
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <h6 className="mb-0 text-darkGray">Part {index + 1}</h6>
                              <button 
                                type="button" 
                                className="btn btn-outline-danger btn-sm rounded-pill"
                                onClick={() => removeShare(index)}
                              >
                                <i className="bi bi-trash me-1"></i>
                                Supprimer
                              </button>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label fw-semibold">Membre *</label>
                                <select 
                                  className="form-select rounded-input" 
                                  name="userId" 
                                  value={share.userId} 
                                  onChange={(e) => handleShareChange(index, e)}
                                >
                                  <option value="">Sélectionner un membre</option>
                                  {collectiveMembers.map((member: any) => (
                                    <option key={member.userId} value={member.userId}>
                                      {member.user.name || member.user.email}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-md-3">
                                <label className="form-label fw-semibold">Type de part</label>
                                <select 
                                  className="form-select rounded-input" 
                                  name="shareType" 
                                  value={share.shareType} 
                                  onChange={(e) => handleShareChange(index, e)}
                                >
                                  <option value="percent">Pourcentage (%)</option>
                                  <option value="fixed">Montant fixe (€)</option>
                                </select>
                              </div>

                              <div className="col-md-3">
                                <label className="form-label fw-semibold">Valeur</label>
                                <div className="input-group">
                                  <input 
                                    type="number" 
                                    className="form-control rounded-input" 
                                    name="shareValue" 
                                    value={isNaN(share.shareValue) ? '' : share.shareValue} 
                                    onChange={(e) => handleShareChange(index, e)}
                                    min="0"
                                    step={share.shareType === 'percent' ? '1' : '0.01'}
                                  />
                                  <span className="input-group-text bg-light">
                                    {share.shareType === 'percent' ? '%' : '€'}
                                  </span>
                                </div>
                              </div>

                              <div className="col-12">
                                <label className="form-label fw-semibold">Description des services</label>
                                <textarea 
                                  className="form-control rounded-input" 
                                  name="description" 
                                  value={share.description || ''} 
                                  onChange={(e) => handleShareChange(index, e)} 
                                  rows={2}
                                  placeholder="Décrivez les services fournis par ce membre..."
                                ></textarea>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button 
                        type="button" 
                        className="btn btn-outline-primary rounded-pill" 
                        onClick={addShare}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Ajouter une part
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="card shadow-sm border-0 rounded-xl">
                <div className="card-body p-4">
                  <h5 className="card-title text-darkGray mb-4 d-flex align-items-center">
                    <i className="bi bi-check-circle me-2 text-primary"></i>
                    Vérification & Création
                  </h5>

                  {/* Summary */}
                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="text-darkGray">Informations générales</h6>
                      <div className="bg-light rounded-xl p-3">
                        <div className="mb-2">
                          <small className="text-mediumGray">Client</small>
                          <div className="fw-semibold">{clients.find((c: any) => c.id === formData.clientId)?.name}</div>
                        </div>
                        <div className="mb-2">
                          <small className="text-mediumGray">Date d'échéance</small>
                          <div className="fw-semibold">{new Date(formData.dueDate).toLocaleDateString('fr-FR')}</div>
                        </div>
                        {formData.collectiveId && (
                          <div>
                            <small className="text-mediumGray">Collectif</small>
                            <div className="fw-semibold">{collectives.find((c: any) => c.id === formData.collectiveId)?.name}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h6 className="text-darkGray">Récapitulatif financier</h6>
                      <div className="bg-light rounded-xl p-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-mediumGray">Sous-total HT</span>
                          <span className="fw-semibold">{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-mediumGray">TVA</span>
                          <span className="fw-semibold">{formatCurrency(calculateTotalTVA())}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold text-darkGray">Total</span>
                          <span className="fw-bold text-primary fs-5">{formatCurrency(calculateInvoiceTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {errors.form && <div className="alert alert-danger mt-4">{errors.form}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar with Summary */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-xl sticky-top" style={{ top: '20px' }}>
              <div className="card-body p-4">
                <h6 className="card-title text-darkGray mb-3">
                  <i className="bi bi-calculator me-2 text-primary"></i>
                  Récapitulatif
                </h6>

                {/* Financial Summary */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-mediumGray">Articles</span>
                    <span className="fw-semibold">{formData.items.length}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-mediumGray">Sous-total HT</span>
                    <span className="fw-semibold">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-mediumGray">TVA</span>
                    <span className="fw-semibold">{formatCurrency(calculateTotalTVA())}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold text-darkGray">Total</span>
                    <span className="fw-bold text-primary">{formatCurrency(calculateInvoiceTotal())}</span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="d-grid gap-2">
                  {currentStep > 1 && (
                    <button 
                      type="button" 
                      className="btn btn-outline-secondary" 
                      onClick={prevStep}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Étape précédente
                    </button>
                  )}

                  {currentStep < 4 ? (
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={nextStep}
                      disabled={!canProceedToNextStep()}
                    >
                      Étape suivante
                      <i className="bi bi-arrow-right ms-1"></i>
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn btn-success" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-1"></i>
                          Créer la facture
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Help Text */}
                <div className="mt-4 pt-3 border-top">
                  <small className="text-mediumGray">
                    <i className="bi bi-lightbulb me-1"></i>
                    {currentStep === 1 && "Commencez par sélectionner votre client et définir les dates."}
                    {currentStep === 2 && "Ajoutez les articles ou services à facturer."}
                    {currentStep === 3 && "Définissez la répartition si c'est une facture collective."}
                    {currentStep === 4 && "Vérifiez tous les détails avant de créer la facture."}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
