'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
      } else {
        setDone(true);
      }
    } catch {
      setError('Une erreur réseau est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#0f1117' }}>
      <div className="card border-0 shadow-lg p-4 p-md-5" style={{ maxWidth: 440, width: '100%', background: '#1a1d27', borderRadius: '1rem' }}>
        <div className="text-center mb-4">
          <i className="bi bi-lock-fill text-primary" style={{ fontSize: '2rem' }}></i>
          <h1 className="h4 fw-bold text-white mt-2">Mot de passe oublié</h1>
          <p className="text-muted small">Entrez votre email et nous vous enverrons un lien de réinitialisation.</p>
        </div>

        {done ? (
          <div className="text-center">
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>
              Si un compte existe pour cet email, vous allez recevoir un lien dans les prochaines minutes.
            </div>
            <Link href="/auth/signin" className="btn btn-primary w-100 mt-2">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}
            <div className="mb-3">
              <label className="form-label text-white-50 small fw-semibold text-uppercase" style={{ letterSpacing: '0.07em' }}>
                Email
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="vous@exemple.fr"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-2" /><span>Envoi…</span></>
              ) : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        <p className="text-center text-muted small mt-4 mb-0">
          <Link href="/auth/signin" className="text-decoration-none" style={{ color: '#D4921A' }}>
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
