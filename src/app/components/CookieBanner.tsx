'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const CONSENT_KEY = 'invoiceops_cookie_consent';

export type CookieConsent = 'accepted' | 'declined' | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(CONSENT_KEY) as CookieConsent) ?? null;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1a1d23',
        borderTop: '1px solid #2d3139',
        padding: '1rem 1.5rem',
      }}
    >
      <div className="container-fluid" style={{ maxWidth: 960 }}>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div className="small text-light" style={{ lineHeight: 1.5 }}>
            <i className="bi bi-shield-check text-primary me-2"></i>
            Nous utilisons des cookies pour mesurer l&apos;audience (Google Analytics) et enregistrer des replays
            anonymisés lors d&apos;erreurs (Sentry). Aucun cookie publicitaire.{' '}
            <Link href="/privacy-policy" className="text-primary text-decoration-none">
              Politique de confidentialité
            </Link>
          </div>
          <div className="d-flex gap-2 flex-shrink-0">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={decline}
            >
              Refuser
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={accept}
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
