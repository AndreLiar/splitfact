'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Step = 'profile' | 'client' | 'invoice';

const STEPS: { id: Step; label: string; description: string; icon: string }[] = [
  { id: 'profile', label: 'Profil émetteur', description: 'Renseignez vos informations légales (SIRET, TVA, adresse).', icon: 'bi-building' },
  { id: 'client', label: 'Premier client', description: 'Ajoutez un client pour pouvoir créer votre première facture.', icon: 'bi-person-vcard' },
  { id: 'invoice', label: 'Première facture', description: 'Créez votre première facture et émettez-la en conformité.', icon: 'bi-receipt' },
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [completed, setCompleted] = useState<Set<Step>>(new Set());

  const markComplete = (step: Step) => {
    setCompleted((prev) => new Set([...prev, step]));
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id);
    }
  };

  const allDone = STEPS.every((s) => completed.has(s.id));

  const stepAction: Record<Step, { label: string; href: string }> = {
    profile: { label: 'Configurer mon profil', href: '/dashboard/settings' },
    client: { label: 'Ajouter un client', href: '/dashboard/clients' },
    invoice: { label: 'Créer une facture', href: '/dashboard/create-invoice' },
  };

  return (
    <div className="container py-5" style={{ maxWidth: 680 }}>
      <div className="text-center mb-5">
        <div className="mb-3">
          <i className="bi bi-lightning-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h1 className="h3 fw-bold">Bienvenue sur InvoiceOps</h1>
        <p className="text-muted">
          Suivez ces 3 étapes pour émettre votre première facture conforme à la réglementation française.
        </p>
      </div>

      <div className="mb-4">
        {STEPS.map((step, idx) => {
          const done = completed.has(step.id);
          const active = currentStep === step.id;
          return (
            <div
              key={step.id}
              className={`card border-0 shadow-sm rounded-xl p-4 mb-3 ${active ? 'border-primary border' : ''}`}
              style={{ opacity: !done && !active ? 0.6 : 1 }}
            >
              <div className="d-flex align-items-start gap-3">
                <div
                  className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${done ? 'bg-success' : active ? 'bg-primary' : 'bg-secondary'}`}
                  style={{ width: 40, height: 40 }}
                >
                  {done
                    ? <i className="bi bi-check-lg text-white"></i>
                    : <span className="text-white fw-bold">{idx + 1}</span>
                  }
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <i className={`bi ${step.icon} text-muted`}></i>
                    <span className="fw-semibold">{step.label}</span>
                    {done && <span className="badge bg-success-subtle text-success ms-1">Terminé</span>}
                  </div>
                  <p className="text-muted small mb-0">{step.description}</p>
                </div>
                {active && !done && (
                  <div className="d-flex gap-2">
                    <Link href={stepAction[step.id].href} className="btn btn-primary btn-sm">
                      {stepAction[step.id].label}
                    </Link>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => markComplete(step.id)}
                    >
                      Marquer fait
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone ? (
        <div className="text-center">
          <div className="alert alert-success mb-4">
            <i className="bi bi-check-circle me-2"></i>
            Tout est prêt. Vous pouvez commencer à gérer vos factures.
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => router.push('/dashboard')}>
            Accéder au tableau de bord
          </button>
        </div>
      ) : (
        <div className="text-center">
          <button
            className="btn btn-link text-muted text-decoration-none"
            onClick={() => router.push('/dashboard')}
          >
            Passer pour l'instant →
          </button>
        </div>
      )}
    </div>
  );
}
