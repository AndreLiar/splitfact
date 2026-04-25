'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { getLegalMentionsByFiscalRegime, formatCurrency } from '@/lib/utils'; // Import the utility function
import { evaluateInvoiceReadiness } from '@/lib/invoice-readiness';

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
  transactionType: 'B2B' | 'B2C' | 'B2G';
  deliveryAddress: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
  }>;
  paymentTerms: string;
  latePenaltyRate: string;
  recoveryIndemnity: number;
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
  transactionType: z.enum(['B2B', 'B2C', 'B2G']).default('B2B'),
  deliveryAddress: z.string().optional(),
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
});

export default function CreateInvoicePage() {
  const { status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    transactionType: 'B2B',
    deliveryAddress: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, tvaRate: 0 }],
    paymentTerms: 'Paiement à 30 jours fin de mois',
    latePenaltyRate: "3 fois le taux d'intérêt légal",
    recoveryIndemnity: 40,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document extraction state
  const [showUploadZone, setShowUploadZone] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSource, setExtractionSource] = useState<string | null>(null);
  const [suggestNewClient, setSuggestNewClient] = useState<{ name: string; address?: string; email?: string; siret?: string } | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);

  const handleDocumentUpload = async (file: File) => {
    setExtracting(true);
    setExtractionError(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/invoices/extract', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Extraction échouée.');
      const e = json.extracted as any;

      // Map extracted fields into form
      setFormData((prev) => ({
        ...prev,
        clientName: e.clientName ?? prev.clientName,
        clientAddress: e.clientAddress ?? prev.clientAddress,
        clientSiret: e.clientSiret ?? prev.clientSiret,
        clientEmail: e.clientEmail ?? prev.clientEmail,
        invoiceDate: e.invoiceDate ?? prev.invoiceDate,
        dueDate: e.dueDate ?? prev.dueDate,
        items: Array.isArray(e.items) && e.items.length > 0
          ? e.items.map((item: any) => ({
              description: item.description ?? '',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              tvaRate: Number(item.tvaRate) || 0,
            }))
          : prev.items,
      }));

      // Auto-match client by name if found in client list
      setClients((currentClients) => {
        if (e.clientName) {
          const match = currentClients.find(
            (c) => c.name.toLowerCase() === (e.clientName as string).toLowerCase()
          );
          if (match) {
            setFormData((prev) => ({
              ...prev,
              clientId: match.id,
              clientName: match.name,
              clientAddress: match.address || prev.clientAddress,
              clientSiret: match.siret || prev.clientSiret,
              clientEmail: match.email || prev.clientEmail,
            }));
            setSuggestNewClient(null);
          } else {
            setSuggestNewClient({
              name: e.clientName,
              address: e.clientAddress,
              email: e.clientEmail,
              siret: e.clientSiret,
            });
          }
        }
        return currentClients;
      });

      setExtractionSource(file.name);
      setShowUploadZone(false);
    } catch (err: any) {
      setExtractionError(err.message);
    } finally {
      setExtracting(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserProfile();
      fetchClients();
    }
  }, [status, router]);

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
        body: JSON.stringify(result.data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error data:", errorData);
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const createdInvoice = await response.json();
      router.push(`/dashboard/invoices/${createdInvoice.id}`);
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
    if (currentStep < 3) setCurrentStep(currentStep + 1);
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
      default:
        return true;
    }
  };

  const readinessPreview = useMemo(() => {
    if (!userProfile) return null;

    return evaluateInvoiceReadiness({
      clientName: formData.clientName,
      clientAddress: formData.clientAddress,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      issuerName: userProfile.name,
      issuerAddress: userProfile.address,
      legalMentions: getLegalMentionsByFiscalRegime(userProfile),
      items: formData.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  }, [formData, userProfile]);

  if (status === 'loading' || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  const needsActivityType = ['MicroBIC', 'BNC'].includes(userProfile?.fiscalRegime ?? '');
  if (!userProfile?.name || !userProfile?.siret || !userProfile?.address || !userProfile?.legalStatus || !userProfile?.apeCode ||
      (needsActivityType && !userProfile?.microEntrepreneurType)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning text-center">
          <h4 className="alert-heading">Profil Incomplet</h4>
          <p>Veuillez compléter vos informations légales et de facturation avant de créer une facture.</p>
          <hr />
          <Link href="/dashboard/settings" className="btn btn-primary">
            Compléter mon profil
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
              <h1 className="mb-1 text-darkGray">Nouveau job de facturation</h1>
              <p className="text-mediumGray mb-0">Déposez un document pour extraire les données automatiquement.</p>
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
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ── Document upload zone ─────────────────────────── */}
      {showUploadZone ? (
        <div className="row mb-4">
          <div className="col-lg-8">
            <div
              className="card border-2 border-dashed rounded-xl text-center p-5"
              style={{ borderColor: '#d1d5db', cursor: 'pointer' }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleDocumentUpload(file);
              }}
            >
              {extracting ? (
                <>
                  <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }}></div>
                  <div className="fw-semibold">Extraction en cours…</div>
                  <div className="text-muted small mt-1">L'IA analyse votre document et extrait les champs de facturation.</div>
                </>
              ) : (
                <>
                  <div className="mb-3" style={{ fontSize: '2.5rem' }}>
                    <i className="bi bi-file-earmark-arrow-up text-primary"></i>
                  </div>
                  <div className="fw-semibold mb-1">Déposez votre devis, contrat ou bon de commande</div>
                  <div className="text-muted small mb-3">PDF ou image — l'IA extrait le client, les lignes et les montants automatiquement</div>
                  <label className="btn btn-primary mb-2">
                    <i className="bi bi-upload me-2"></i>Choisir un fichier
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="d-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload(file);
                      }}
                    />
                  </label>
                  {extractionError && (
                    <div className="alert alert-danger small mt-2 mb-0">{extractionError}</div>
                  )}
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-link text-muted text-decoration-none small"
                      onClick={() => setShowUploadZone(false)}
                    >
                      Saisir manuellement →
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="col-lg-4 d-none d-lg-flex flex-column justify-content-center gap-3 ps-4">
            <div className="d-flex gap-3 align-items-start">
              <i className="bi bi-magic text-primary mt-1"></i>
              <div>
                <div className="fw-medium small">Extraction automatique</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Client, lignes, montants, dates — en une seconde.</div>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-start">
              <i className="bi bi-shield-check text-success mt-1"></i>
              <div>
                <div className="fw-medium small">Validation française</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Champs obligatoires vérifiés avant émission.</div>
              </div>
            </div>
            <div className="d-flex gap-3 align-items-start">
              <i className="bi bi-file-earmark-pdf text-danger mt-1"></i>
              <div>
                <div className="fw-medium small">Sortie Factur-X</div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Facture hybride PDF/XML conforme EN 16931.</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {extractionSource && (
            <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-check-circle-fill"></i>
              <div className="flex-grow-1">
                <strong>Données extraites depuis «&nbsp;{extractionSource}&nbsp;»</strong>
                <span className="ms-2 text-muted small">Vérifiez et corrigez si besoin avant de soumettre.</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => { setShowUploadZone(true); setExtractionSource(null); setSuggestNewClient(null); }}
              >
                Changer de document
              </button>
            </div>
          )}
          {suggestNewClient && (
            <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-person-plus-fill"></i>
              <div className="flex-grow-1">
                <strong>Client «&nbsp;{suggestNewClient.name}&nbsp;» non trouvé.</strong>
                <span className="ms-2 text-muted small">Créer ce client pour le retrouver plus facilement ?</span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-warning"
                disabled={creatingClient}
                onClick={async () => {
                  setCreatingClient(true);
                  try {
                    const res = await fetch('/api/clients', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(suggestNewClient),
                    });
                    if (res.ok) {
                      const newClient = await res.json();
                      setClients((prev) => [...prev, newClient]);
                      setFormData((prev) => ({ ...prev, clientId: newClient.id }));
                      setSuggestNewClient(null);
                    }
                  } finally {
                    setCreatingClient(false);
                  }
                }}
              >
                {creatingClient ? 'Création...' : 'Créer le client'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSuggestNewClient(null)}
              >
                Ignorer
              </button>
            </div>
          )}
        </>
      )}

      <form onSubmit={handleSubmit} className={showUploadZone ? 'd-none' : ''}>
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
                      <label htmlFor="transactionType" className="form-label fw-semibold">
                        <i className="bi bi-arrow-left-right me-1 text-primary"></i>
                        Type de transaction *
                      </label>
                      <select
                        className="form-select rounded-input"
                        id="transactionType"
                        name="transactionType"
                        value={formData.transactionType}
                        onChange={handleInputChange}
                      >
                        <option value="B2B">B2B — Entreprise à entreprise</option>
                        <option value="B2C">B2C — Entreprise à particulier</option>
                        <option value="B2G">B2G — Entreprise à administration publique</option>
                      </select>
                      <div className="form-text">Requis pour la facturation électronique (EN 16931)</div>
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

                    <div className="col-12">
                      <label htmlFor="deliveryAddress" className="form-label fw-semibold">
                        <i className="bi bi-geo-alt me-1 text-primary"></i>
                        Adresse de livraison / prestation
                        <span className="text-muted fw-normal ms-1">(si différente de l'adresse client)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control rounded-input"
                        id="deliveryAddress"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleInputChange}
                        placeholder="ex: 12 rue de la Paix, 75001 Paris"
                      />
                      <div className="form-text">Champ <code>ram:ShipToTradeParty</code> dans Factur-X EXTENDED</div>
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

            {/* Step 3: Review */}
            {currentStep === 3 && (
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

                  {readinessPreview && (
                    <div className={`mt-4 alert ${readinessPreview.status === 'ready' ? 'alert-success' : 'alert-warning'}`}>
                      <div className="fw-semibold mb-2">
                        {readinessPreview.status === 'ready'
                          ? 'Cette facture sera créée prête pour revue'
                          : 'Cette facture sera créée en brouillon bloqué'}
                      </div>
                      {readinessPreview.status === 'blocked' ? (
                        <div className="small">
                          {readinessPreview.blockingReasons.map((reason) => (
                            <div key={reason.code}>• {reason.message}</div>
                          ))}
                        </div>
                      ) : (
                        <div className="small">
                          Les données minimales d'émission sont présentes. L'étape suivante pourra être l'émission et la génération Factur-X.
                        </div>
                      )}
                    </div>
                  )}

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

                {readinessPreview && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-mediumGray">Préparation à l'émission</span>
                      <span className={`badge ${readinessPreview.status === 'ready' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {readinessPreview.status === 'ready' ? 'Prête' : 'Bloquée'}
                      </span>
                    </div>
                    {readinessPreview.status === 'blocked' && (
                      <div className="small text-muted">
                        {readinessPreview.blockingReasons.map((reason) => (
                          <div key={reason.code}>• {reason.message}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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

                  {currentStep < 3 ? (
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
                          {readinessPreview?.status === 'ready' ? 'Créer la facture prête' : 'Créer le brouillon'}
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
                    {currentStep === 3 && "Vérifiez tous les détails avant de créer la facture."}
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
