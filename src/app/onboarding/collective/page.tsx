'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CollectiveProfile {
  collectiveName: string;
  collectiveType: 'design' | 'dev' | 'marketing' | 'full-service' | 'consulting';
  legalStatus: 'sas' | 'sarl' | 'portage' | 'micro-collectif' | 'en-cours';
  teamSize: string;
  monthlyRevenue: string;
  clientTypes: string[];
  painPoints: string[];
  goals: string[];
  location: string;
  siret?: string;
  tvaNumber?: string;
}

interface TeamMember {
  name: string;
  email: string;
  role: string;
  expertise: string[];
  sharePercentage: number;
}

export default function CollectiveOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Form data
  const [collectiveProfile, setCollectiveProfile] = useState<CollectiveProfile>({
    collectiveName: '',
    collectiveType: 'full-service',
    legalStatus: 'sas',
    teamSize: '3-5',
    monthlyRevenue: '10k-50k',
    clientTypes: [],
    painPoints: [],
    goals: [],
    location: 'Paris',
    siret: '',
    tvaNumber: ''
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', email: '', role: 'designer', expertise: [], sharePercentage: 33 },
    { name: '', email: '', role: 'developer', expertise: [], sharePercentage: 33 },
    { name: '', email: '', role: 'marketing', expertise: [], sharePercentage: 34 }
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const collectiveTypes = [
    { value: 'design', label: 'Équipe Design', description: 'UI/UX, Branding, Identité visuelle' },
    { value: 'dev', label: 'Équipe Développement', description: 'Sites web, Apps, Développement' },
    { value: 'marketing', label: 'Équipe Marketing', description: 'Digital, Contenus, Campagnes' },
    { value: 'full-service', label: 'Équipe Multidisciplinaire', description: 'Design + Dev + Marketing' },
    { value: 'consulting', label: 'Collectif Conseil', description: 'Stratégie, Innovation, Transformation' }
  ];

  const legalStatuses = [
    { 
      value: 'sas', 
      label: 'SAS/SASU', 
      description: 'Flexibilité maximale, idéal pour équipes créatives',
      benefits: ['Statut dirigeant assimilé salarié', 'Capital variable', 'Cession actions simplifiée'],
      costs: 'Charges sociales ~45% sur rémunération'
    },
    { 
      value: 'sarl', 
      label: 'SARL/EURL', 
      description: 'Structure traditionnelle, sécurisante',
      benefits: ['Charges sociales réduites TNS', 'Patrimoine protégé', 'Comptabilité simplifiée'],
      costs: 'Charges sociales ~30% + impôts'
    },
    { 
      value: 'portage', 
      label: 'Portage Salarial', 
      description: 'Transition douce vers la collaboration formalisée',
      benefits: ['Statut salarié conservé', 'Gestion admin externalisée', 'Protection sociale complète'],
      costs: 'Commission société de portage 5-10%'
    },
    { 
      value: 'micro-collectif', 
      label: 'Micro-Entrepreneurs Collectif', 
      description: 'Collaboration formalisée entre indépendants',
      benefits: ['Simplicité administrative', 'Charges sociales 22%', 'Facturation groupée'],
      costs: 'Limite CA 77.7k€ (services) par personne'
    },
    { 
      value: 'en-cours', 
      label: 'En cours de création', 
      description: 'Structure juridique pas encore définie',
      benefits: ['Accompagnement dans le choix', 'Simulation charges', 'Conseil juridique'],
      costs: 'À déterminer selon structure choisie'
    }
  ];

  const parisLocations = [
    'Paris Centre (1er-4e)', 'République/Marais (3e-4e)', 'Châtelet/Louvre (1er)', 
    'Opéra/Grands Boulevards (2e-9e)', 'Bastille/Nation (11e-12e)',
    'République/Oberkampf (10e-11e)', 'Pigalle/Montmartre (9e-18e)', 
    'Belleville/Ménilmontant (19e-20e)', 'Banlieue proche', 'Autre région France'
  ];

  const clientTypeOptions = [
    'Startups Tech', 'PME/ETI', 'Grandes entreprises', 'E-commerce', 'SaaS',
    'Associations/ONG', 'Secteur public', 'Immobilier', 'Santé', 'Finance'
  ];

  const painPointOptions = [
    'Facturation manuelle chronophage', 'Disputes sur les parts de revenus',
    'Manque de transparence client', 'Difficile de montrer la valeur collaborative',
    'Paiements multiples complexes', 'Suivi projets dispersé',
    'Pas d\'analytics business', 'Coordination d\'equipe complexe'
  ];

  const goalOptions = [
    'Optimiser la facturation collaborative', 'Gagner du temps sur l\'admin',
    'Améliorer satisfaction client', 'Transparence totale projets',
    'Mieux suivre la rentabilité', 'Professionnaliser la présentation d\'equipe',
    'Simplifier les paiements', 'Analytics pour prendre décisions'
  ];

  const expertiseOptions = {
    designer: ['UI Design', 'UX Research', 'Branding', 'Motion Design', 'Illustration', 'Print'],
    developer: ['Frontend React', 'Backend Node.js', 'Mobile', 'DevOps', 'E-commerce', 'WordPress'],
    marketing: ['SEO/SEA', 'Social Media', 'Content', 'Email Marketing', 'Analytics', 'Paid Ads']
  };

  const handleProfileChange = (field: keyof CollectiveProfile, value: any) => {
    setCollectiveProfile(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const toggleArrayField = (field: keyof CollectiveProfile, value: string) => {
    setCollectiveProfile(prev => {
      const currentArray = prev[field] as string[];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, {
      name: '',
      email: '',
      role: 'designer',
      expertise: [],
      sharePercentage: 0
    }]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 2) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: {[key: string]: string} = {};
    
    switch (step) {
      case 1:
        if (!collectiveProfile.collectiveName.trim()) {
          errors.collectiveName = 'Le nom du collectif est requis';
        }
        if (collectiveProfile.collectiveName.length < 2) {
          errors.collectiveName = 'Le nom doit contenir au moins 2 caractères';
        }
        break;
      case 2:
        if (collectiveProfile.clientTypes.length === 0) {
          errors.clientTypes = 'Sélectionnez au moins un type de client';
        }
        if (collectiveProfile.painPoints.length === 0) {
          errors.painPoints = 'Sélectionnez au moins un défi actuel';
        }
        if (collectiveProfile.goals.length === 0) {
          errors.goals = 'Sélectionnez au moins un objectif';
        }
        break;
      case 3:
        const hasEmptyMembers = teamMembers.some(m => !m.name.trim() || !m.email.trim());
        if (hasEmptyMembers) {
          errors.teamMembers = 'Tous les membres doivent avoir un nom et email';
        }
        if (totalPercentage !== 100) {
          errors.totalPercentage = 'La répartition doit totaliser exactement 100%';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    setError(null);

    try {
      // Create the agency collective
      const collectiveResponse = await fetch('/api/collectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: collectiveProfile.collectiveName,
          description: `${collectiveTypes.find(t => t.value === collectiveProfile.collectiveType)?.label}`,
          type: collectiveProfile.collectiveType,
          members: teamMembers.map(member => ({
            email: member.email,
            name: member.name,
            role: member.role,
            shareType: 'percent',
            shareValue: member.sharePercentage
          }))
        })
      });

      if (!collectiveResponse.ok) {
        throw new Error('Erreur lors de la création de l\'agence');
      }

      const collective = await collectiveResponse.json();

      // Save onboarding data for analytics
      await fetch('/api/onboarding/agency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectiveId: collective.id,
          profile: collectiveProfile,
          teamMembers
        })
      });

      router.push(`/dashboard/collectives/${collective.id}?welcome=true`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  const totalPercentage = teamMembers.reduce((sum, member) => sum + member.sharePercentage, 0);

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          
          {/* Header */}
          <div className="text-center mb-5 pt-4">
            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                 style={{width: '80px', height: '80px'}}>
              <i className="bi bi-palette text-primary" style={{fontSize: '2rem'}}></i>
            </div>
            <h1 className="h2 text-dark mb-3">
              Configuration Équipe Collaborative
            </h1>
            <p className="text-muted">
              Configurons votre gestion collaborative en 5 minutes
            </p>
            
            {/* Progress bar */}
            <div className="progress mb-4" style={{height: '8px'}}>
              <div 
                className="progress-bar bg-primary" 
                style={{width: `${(currentStep / 4) * 100}%`}}
              ></div>
            </div>
            <small className="text-muted">Étape {currentStep} sur 4</small>
          </div>

          <div className="card shadow-sm border-0 rounded-xl">
            <div className="card-body p-5">
              
              {/* Step 1: Agency Profile */}
              {currentStep === 1 && (
                <div>
                  <h4 className="text-dark mb-4">
                    <i className="bi bi-people me-2 text-primary"></i>
                    Profil de votre équipe
                  </h4>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold">Nom de votre collectif *</label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${validationErrors.collectiveName ? 'is-invalid' : ''}`}
                      placeholder="Ex: Creative Studio, Design Lab, Marketing Pro..."
                      value={collectiveProfile.collectiveName}
                      onChange={(e) => handleProfileChange('collectiveName', e.target.value)}
                    />
                    {validationErrors.collectiveName && (
                      <div className="invalid-feedback">{validationErrors.collectiveName}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Type d'équipe *</label>
                    <div className="row g-3">
                      {collectiveTypes.map(type => (
                        <div key={type.value} className="col-md-6">
                          <div 
                            className={`card h-100 cursor-pointer ${collectiveProfile.collectiveType === type.value ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                            onClick={() => handleProfileChange('collectiveType', type.value)}
                          >
                            <div className="card-body text-center">
                              <h6 className="text-dark">{type.label}</h6>
                              <small className="text-muted">{type.description}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Statut juridique *</label>
                    <div className="row g-3">
                      {legalStatuses.map(status => (
                        <div key={status.value} className="col-lg-6">
                          <div 
                            className={`card h-100 cursor-pointer ${collectiveProfile.legalStatus === status.value ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                            onClick={() => handleProfileChange('legalStatus', status.value)}
                          >
                            <div className="card-body">
                              <h6 className="text-dark fw-bold">{status.label}</h6>
                              <p className="text-muted small mb-2">{status.description}</p>
                              <div className="mb-2">
                                <small className="text-success fw-bold">Avantages:</small>
                                <ul className="small text-muted mb-1" style={{fontSize: '0.75rem'}}>
                                  {status.benefits.slice(0, 2).map((benefit, i) => (
                                    <li key={i}>{benefit}</li>
                                  ))}
                                </ul>
                              </div>
                              <small className="text-warning">{status.costs}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Localisation</label>
                      <select
                        className="form-select"
                        value={collectiveProfile.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                      >
                        {parisLocations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">Taille équipe</label>
                      <select
                        className="form-select"
                        value={collectiveProfile.teamSize}
                        onChange={(e) => handleProfileChange('teamSize', e.target.value)}
                      >
                        <option value="2-3">2-3 personnes</option>
                        <option value="3-5">3-5 personnes</option>
                        <option value="5-10">5-10 personnes</option>
                        <option value="10+">10+ personnes</option>
                      </select>
                    </div>
                    
                    <div className="col-md-4">
                      <label className="form-label fw-bold">CA mensuel actuel</label>
                      <select
                        className="form-select"
                        value={collectiveProfile.monthlyRevenue}
                        onChange={(e) => handleProfileChange('monthlyRevenue', e.target.value)}
                      >
                        <option value="0-10k">0-10k€</option>
                        <option value="10k-50k">10k-50k€</option>
                        <option value="50k-100k">50k-100k€</option>
                        <option value="100k+">100k€+</option>
                      </select>
                    </div>
                  </div>
                  
                  {collectiveProfile.legalStatus !== 'en-cours' && (
                    <div className="row g-3 mt-2">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">SIRET (optionnel)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="123 456 789 00000"
                          value={collectiveProfile.siret}
                          onChange={(e) => handleProfileChange('siret', e.target.value)}
                        />
                        <small className="text-muted">Si déjà immatriculé</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold">N° TVA (optionnel)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="FR 12 345678901"
                          value={collectiveProfile.tvaNumber}
                          onChange={(e) => handleProfileChange('tvaNumber', e.target.value)}
                        />
                        <small className="text-muted">Si assujetti TVA</small>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Target Clients */}
              {currentStep === 2 && (
                <div>
                  <h4 className="text-dark mb-4">
                    <i className="bi bi-people me-2 text-primary"></i>
                    Vos clients et objectifs
                  </h4>
                  
                  <div className="mb-4">
                    <label className="form-label fw-bold">Types de clients (sélectionnez plusieurs) *</label>
                    <div className="row g-2">
                      {clientTypeOptions.map(type => (
                        <div key={type} className="col-md-4 col-sm-6">
                          <div 
                            className={`card cursor-pointer ${collectiveProfile.clientTypes.includes(type) ? 'bg-primary text-white' : 'bg-light'}`}
                            onClick={() => toggleArrayField('clientTypes', type)}
                          >
                            <div className="card-body text-center py-2">
                              <small>{type}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {validationErrors.clientTypes && (
                      <div className="text-danger small mt-2">{validationErrors.clientTypes}</div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Principaux défis actuels *</label>
                    <div className="row g-2">
                      {painPointOptions.map(pain => (
                        <div key={pain} className="col-md-6">
                          <div 
                            className={`card cursor-pointer ${collectiveProfile.painPoints.includes(pain) ? 'bg-danger text-white' : 'bg-light'}`}
                            onClick={() => toggleArrayField('painPoints', pain)}
                          >
                            <div className="card-body py-2">
                              <small>{pain}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold">Objectifs avec Splitfact *</label>
                    <div className="row g-2">
                      {goalOptions.map(goal => (
                        <div key={goal} className="col-md-6">
                          <div 
                            className={`card cursor-pointer ${collectiveProfile.goals.includes(goal) ? 'bg-success text-white' : 'bg-light'}`}
                            onClick={() => toggleArrayField('goals', goal)}
                          >
                            <div className="card-body py-2">
                              <small>{goal}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Team Setup */}
              {currentStep === 3 && (
                <div>
                  <h4 className="text-dark mb-4">
                    <i className="bi bi-person-plus me-2 text-primary"></i>
                    Configuration de l'équipe
                  </h4>
                  
                  {teamMembers.map((member, index) => (
                    <div key={index} className="card border-light mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="text-dark mb-0">Membre {index + 1}</h6>
                          {teamMembers.length > 2 && (
                            <button 
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeTeamMember(index)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                        
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Nom *</label>
                            <input
                              type="text"
                              className="form-control"
                              value={member.name}
                              onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email *</label>
                            <input
                              type="email"
                              className="form-control"
                              value={member.email}
                              onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Rôle *</label>
                            <select
                              className="form-select"
                              value={member.role}
                              onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                            >
                              <option value="designer">Designer</option>
                              <option value="developer">Développeur</option>
                              <option value="marketing">Marketing</option>
                              <option value="manager">Manager</option>
                              <option value="other">Autre</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Part revenus (%) *</label>
                            <input
                              type="number"
                              className="form-control"
                              min="0"
                              max="100"
                              value={member.sharePercentage}
                              onChange={(e) => updateTeamMember(index, 'sharePercentage', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Total: {totalPercentage}%</label>
                            <div className={`alert ${totalPercentage === 100 ? 'alert-success' : 'alert-warning'} mb-0 py-1`}>
                              <small>{totalPercentage === 100 ? '✓ Parfait!' : '⚠️ Doit = 100%'}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    className="btn btn-outline-primary w-100 mb-3"
                    onClick={addTeamMember}
                  >
                    <i className="bi bi-plus me-2"></i>
                    Ajouter un membre
                  </button>
                </div>
              )}

              {/* Step 4: Summary */}
              {currentStep === 4 && (
                <div>
                  <h4 className="text-dark mb-4">
                    <i className="bi bi-check-circle me-2 text-success"></i>
                    Récapitulatif et validation
                  </h4>
                  
                  <div className="card bg-light border-0 mb-4">
                    <div className="card-body">
                      <h5 className="text-dark">{collectiveProfile.collectiveName}</h5>
                      <p className="text-muted mb-1">
                        <strong>Type:</strong> {collectiveTypes.find(t => t.value === collectiveProfile.collectiveType)?.label} • 
                        <strong>Statut:</strong> {legalStatuses.find(s => s.value === collectiveProfile.legalStatus)?.label}
                      </p>
                      <p className="text-muted mb-1">
                        <strong>Équipe:</strong> {collectiveProfile.teamSize} • 
                        <strong>CA:</strong> {collectiveProfile.monthlyRevenue}/mois • 
                        <strong>Localisation:</strong> {collectiveProfile.location}
                      </p>
                      <p className="text-muted mb-0">
                        <strong>Clients cibles:</strong> {collectiveProfile.clientTypes.join(', ')}
                      </p>
                      {(collectiveProfile.siret || collectiveProfile.tvaNumber) && (
                        <p className="text-muted mb-0 mt-2">
                          {collectiveProfile.siret && <><strong>SIRET:</strong> {collectiveProfile.siret} </>}
                          {collectiveProfile.tvaNumber && <><strong>TVA:</strong> {collectiveProfile.tvaNumber}</>}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <h6 className="text-dark mb-3">Équipe ({teamMembers.length} membres)</h6>
                  {teamMembers.map((member, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <strong>{member.name}</strong> - {member.role}
                        <br />
                        <small className="text-muted">{member.email}</small>
                      </div>
                      <span className="badge bg-primary">{member.sharePercentage}%</span>
                    </div>
                  ))}
                  
                  <div className="alert alert-info mt-4">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Prochaines étapes:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Création de votre collectif avec identité personnalisée</li>
                      <li>Invitations automatiques envoyées à votre équipe</li>
                      <li>Dashboard collaboratif configuré</li>
                      <li>Première facture collaborative prête en 2 clics</li>
                    </ul>
                  </div>
                  
                  {validationErrors.teamMembers && (
                    <div className="alert alert-warning">{validationErrors.teamMembers}</div>
                  )}
                  {validationErrors.totalPercentage && (
                    <div className="alert alert-warning">{validationErrors.totalPercentage}</div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="alert alert-danger mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="d-flex justify-content-between pt-3 border-top">
                <div>
                  {currentStep > 1 && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Précédent
                    </button>
                  )}
                </div>
                
                <div>
                  {currentStep < 4 ? (
                    <button
                      className="btn btn-primary"
                      onClick={nextStep}
                      disabled={false}
                    >
                      Suivant
                      <i className="bi bi-arrow-right ms-2"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-success btn-lg"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Création en cours...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-rocket me-2"></i>
                          Lancer mon collectif
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="text-center mt-4 mb-5">
            <p className="text-muted">
              Besoin d'aide ? 
              <Link href="#support" className="text-primary ms-1">
                Contactez notre équipe dédiée aux collectifs
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}