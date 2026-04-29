'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="alert alert-danger">
        Lien invalide ou manquant.{' '}
        <Link href="/auth/forgot-password">Faire une nouvelle demande</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
      } else {
        setDone(true);
        setTimeout(() => router.push('/auth/signin'), 3000);
      }
    } catch {
      setError('Une erreur réseau est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2"></i>
          Mot de passe modifié. Redirection vers la connexion…
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      <div className="mb-3">
        <label className="form-label text-white-50 small fw-semibold text-uppercase" style={{ letterSpacing: '0.07em' }}>
          Nouveau mot de passe
        </label>
        <div className="position-relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control"
            placeholder="8 caractères minimum"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ paddingRight: '2.5rem' }}
          />
          <i
            className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
            style={{ right: '0.75rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af' }}
            onClick={() => setShowPassword(!showPassword)}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="form-label text-white-50 small fw-semibold text-uppercase" style={{ letterSpacing: '0.07em' }}>
          Confirmer le mot de passe
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          className="form-control"
          placeholder="Répétez le mot de passe"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
        {submitting ? (
          <><span className="spinner-border spinner-border-sm me-2" /><span>Modification…</span></>
        ) : 'Modifier mon mot de passe'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#0f1117' }}>
      <div className="card border-0 shadow-lg p-4 p-md-5" style={{ maxWidth: 440, width: '100%', background: '#1a1d27', borderRadius: '1rem' }}>
        <div className="text-center mb-4">
          <i className="bi bi-key-fill text-primary" style={{ fontSize: '2rem' }}></i>
          <h1 className="h4 fw-bold text-white mt-2">Nouveau mot de passe</h1>
          <p className="text-muted small">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
        </div>
        <Suspense fallback={<div className="text-center text-muted">Chargement…</div>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-muted small mt-4 mb-0">
          <Link href="/auth/signin" className="text-decoration-none" style={{ color: '#D4921A' }}>
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
