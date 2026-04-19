'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TeamMember {
  name: string;
  email: string;
  role: string;
  shareType: 'percent' | 'fixed';
  shareValue: number;
}

export default function CreateTeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Team details
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamType, setTeamType] = useState('dev'); // dev, design, marketing, consulting
  
  // Team members
  const [members, setMembers] = useState<TeamMember[]>([
    { name: '', email: '', role: 'Developer', shareType: 'percent', shareValue: 0 }
  ]);
  
  const totalSteps = 4;

  if (status === 'loading') {
    return <div className="d-flex justify-content-center align-items-center vh-100">Chargement...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const addMember = () => {
    setMembers([...members, { name: '', email: '', role: 'Developer', shareType: 'percent', shareValue: 0 }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof TeamMember, value: string | number) => {
    const updatedMembers = [...members];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setMembers(updatedMembers);
  };

  const calculateTotalShares = () => {
    return members.reduce((total, member) => {
      if (member.shareType === 'percent') {
        return total + member.shareValue;
      }
      return total;
    }, 0);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // First create the collective
      const collectiveResponse = await fetch('/api/collectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: teamName,
          description: teamDescription,
          type: teamType
        }),
      });

      if (!collectiveResponse.ok) {
        const errorData = await collectiveResponse.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const collective = await collectiveResponse.json();

      // Then invite members (this would be implemented in Phase 3)
      // For now, we'll just redirect to the team page
      router.push(`/dashboard/collectives/${collective.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="row mb-5">
      <div className="col-12">
        <div className="d-flex justify-content-center">
          <div className="d-flex align-items-center gap-3">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                  step <= currentStep 
                    ? 'bg-primary text-white' 
                    : 'bg-light text-muted'
                }`} style={{ width: '40px', height: '40px' }}>
                  <span className="fw-bold">{step}</span>
                </div>
                {step < 4 && (
                  <div className={`mx-3 ${
                    step < currentStep ? 'bg-primary' : 'bg-light'
                  }`} style={{ width: '60px', height: '2px' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-3">
          <small className="text-muted">
            Étape {currentStep} sur {totalSteps}: {
              currentStep === 1 ? 'Informations de l\'équipe' :
              currentStep === 2 ? 'Type d\'équipe' :
              currentStep === 3 ? 'Ajouter les membres' :
              'Répartition des revenus'
            }
          </small>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="card shadow-sm border-0 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
             style={{ width: '80px', height: '80px' }}>
          <i className="bi bi-people-fill text-primary" style={{ fontSize: '32px' }}></i>
        </div>
        <h2 className="text-dark mb-2">Créons votre équipe !</h2>
        <p className="text-muted">Commençons par les informations de base de votre équipe</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="mb-4">
            <label className="form-label fw-bold">Nom de l'équipe *</label>
            <input
              type="text"
              className="form-control form-control-lg"
              placeholder="Ex: DevSquad, Studio Créatif, Consultants Pro..."
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-bold">Description de l'équipe</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Décrivez brièvement votre équipe et vos spécialités..."
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="card shadow-sm border-0 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
             style={{ width: '80px', height: '80px' }}>
          <i className="bi bi-briefcase-fill text-success" style={{ fontSize: '32px' }}></i>
        </div>
        <h2 className="text-dark mb-2">Quel type d'équipe êtes-vous ?</h2>
        <p className="text-muted">Cela nous aide à personnaliser votre expérience</p>
      </div>

      <div className="row g-3">
        {[
          { id: 'dev', name: 'Développement', icon: 'bi-code-slash', description: 'Apps, sites web, logiciels' },
          { id: 'design', name: 'Design & Création', icon: 'bi-palette-fill', description: 'UI/UX, graphisme, branding' },
          { id: 'marketing', name: 'Marketing Digital', icon: 'bi-megaphone-fill', description: 'Publicité, contenu, SEO' },
          { id: 'consulting', name: 'Conseil', icon: 'bi-lightbulb-fill', description: 'Business, stratégie, formation' }
        ].map((type) => (
          <div key={type.id} className="col-md-6">
            <div 
              className={`card h-100 cursor-pointer transition-all ${
                teamType === type.id ? 'border-primary bg-primary bg-opacity-10' : 'border-light hover-border-primary'
              }`}
              onClick={() => setTeamType(type.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-body text-center p-4">
                <i className={`bi ${type.icon} text-primary mb-3`} style={{ fontSize: '32px' }}></i>
                <h5 className="text-dark mb-2">{type.name}</h5>
                <p className="text-muted small mb-0">{type.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="card shadow-sm border-0 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
             style={{ width: '80px', height: '80px' }}>
          <i className="bi bi-person-plus-fill text-info" style={{ fontSize: '32px' }}></i>
        </div>
        <h2 className="text-dark mb-2">Ajoutez vos membres</h2>
        <p className="text-muted">Qui fait partie de votre équipe ? (Vous pourrez les inviter plus tard)</p>
      </div>

      <div className="mb-4">
        {members.map((member, index) => (
          <div key={index} className="card border-light mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Nom complet</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Jean Dupont"
                    value={member.name}
                    onChange={(e) => updateMember(index, 'name', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="jean@exemple.fr"
                    value={member.email}
                    onChange={(e) => updateMember(index, 'email', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Rôle</label>
                  <select
                    className="form-select"
                    value={member.role}
                    onChange={(e) => updateMember(index, 'role', e.target.value)}
                  >
                    <option value="Developer">Développeur</option>
                    <option value="Designer">Designer</option>
                    <option value="Project Manager">Chef de projet</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  {members.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeMember(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          className="btn btn-outline-primary w-100"
          onClick={addMember}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Ajouter un membre
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="card shadow-sm border-0 rounded-xl p-5">
      <div className="text-center mb-4">
        <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
             style={{ width: '80px', height: '80px' }}>
          <i className="bi bi-pie-chart-fill text-warning" style={{ fontSize: '32px' }}></i>
        </div>
        <h2 className="text-dark mb-2">Répartition des revenus</h2>
        <p className="text-muted">Comment souhaitez-vous partager les revenus des projets ?</p>
      </div>

      <div className="mb-4">
        {members.map((member, index) => (
          <div key={index} className="card border-light mb-3">
            <div className="card-body">
              <div className="row g-3 align-items-center">
                <div className="col-md-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                         style={{ width: '40px', height: '40px' }}>
                      <i className="bi bi-person text-white"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{member.name || `Membre ${index + 1}`}</div>
                      <small className="text-muted">{member.role}</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={member.shareType}
                    onChange={(e) => updateMember(index, 'shareType', e.target.value)}
                  >
                    <option value="percent">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                  </select>
                </div>
                <div className="col-md-5">
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={member.shareValue}
                      onChange={(e) => updateMember(index, 'shareValue', parseFloat(e.target.value) || 0)}
                    />
                    <span className="input-group-text">
                      {member.shareType === 'percent' ? '%' : '€'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {calculateTotalShares() !== 100 && members.some(m => m.shareType === 'percent') && (
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Total des pourcentages: {calculateTotalShares()}%. Il devrait égaler 100%.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-dark mb-3">
              <i className="bi bi-people me-3 text-primary"></i>
              Configuration de votre équipe
            </h1>
            <p className="lead text-muted">Créez votre équipe de freelances en quelques minutes</p>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger mt-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-5">
            <div>
              {currentStep > 1 && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={prevStep}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Retour
                </button>
              )}
            </div>
            
            <div className="d-flex gap-2">
              <Link href="/dashboard/collectives" className="btn btn-outline-secondary">
                Annuler
              </Link>
              
              {currentStep < totalSteps ? (
                <button
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={loading || (currentStep === 1 && !teamName)}
                >
                  Suivant
                  <i className="bi bi-arrow-right ms-2"></i>
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={loading || calculateTotalShares() !== 100}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Création...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Créer l'équipe
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
