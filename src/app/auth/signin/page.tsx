'use client'

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useState(() => {
    if (searchParams.get("registration") === "success") {
      setRegistrationSuccess(true);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect. Veuillez réessayer.");
    } else {
      router.push("/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D1117',
      display: 'flex',
    }}>
      {/* ── Left panel ──────────────────────────────────── */}
      <div style={{
        width: '420px',
        flexShrink: 0,
        backgroundColor: '#141A28',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '3rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }} className="d-none d-lg-flex">
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,146,26,0.08) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,170,127,0.06) 0%, transparent 70%)',
          bottom: '50px',
          left: '-50px',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{ marginBottom: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            marginBottom: '3.5rem',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              backgroundColor: '#D4921A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <i className="bi bi-lightning-fill" style={{ color: '#0D1117', fontSize: '1rem' }}></i>
            </div>
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#E8E0D0',
              letterSpacing: '-0.01em',
            }}>
              InvoiceOps
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2.25rem',
            fontWeight: 600,
            color: '#E8E0D0',
            lineHeight: 1.2,
            marginBottom: '1rem',
            letterSpacing: '-0.02em',
          }}>
            Retrouvez votre cockpit de facturation.
          </h2>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '0.9rem',
            color: '#7B8EA6',
            lineHeight: 1.65,
          }}>
            Suivez vos factures, exceptions et la préparation à la facturation électronique 2026.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { icon: 'bi-receipt', label: 'Facturation e-invoicing conforme' },
            { icon: 'bi-robot', label: 'IA fiscale URSSAF intégrée' },
            { icon: 'bi-people', label: 'Collectifs & partage de revenus' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '7px',
                backgroundColor: 'rgba(212,146,26,0.1)',
                border: '1px solid rgba(212,146,26,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className={`bi ${f.icon}`} style={{ color: '#D4921A', fontSize: '0.875rem' }}></i>
              </div>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.8125rem',
                color: '#9DAFC4',
                fontWeight: 500,
              }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (form) ───────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Mobile brand */}
          <div className="d-lg-none" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '7px',
                backgroundColor: '#D4921A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <i className="bi bi-lightning-fill" style={{ color: '#0D1117', fontSize: '0.85rem' }}></i>
              </div>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.375rem',
                fontWeight: 600,
                color: '#E8E0D0',
              }}>InvoiceOps</span>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 600,
            color: '#E8E0D0',
            marginBottom: '0.375rem',
            letterSpacing: '-0.02em',
          }}>
            Connexion
          </h1>
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '0.875rem',
            color: '#7B8EA6',
            marginBottom: '2rem',
          }}>
            Reprenez votre workflow là où vous l'avez laissé.
          </p>

          {registrationSuccess && (
            <div className="alert alert-success mb-4">
              <i className="bi bi-check-circle me-2"></i>
              Inscription réussie ! Vous pouvez maintenant vous connecter.
            </div>
          )}
          {error && (
            <div className="alert alert-danger mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#9DAFC4',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                display: 'block',
                marginBottom: '0.375rem',
              }}>
                Adresse e-mail
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="vous@exemple.fr"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#9DAFC4',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                display: 'block',
                marginBottom: '0.375rem',
              }}>
                Mot de passe
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
                <i
                  className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} password-toggle-icon`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
              style={{ marginTop: '0.5rem' }}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Connexion…
                </>
              ) : 'Se connecter'}
            </button>
          </form>

          <div className="divider-or">OU</div>

          <button
            className="btn btn-outline-secondary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            <i className="bi bi-google"></i>
            Continuer avec Google
          </button>

          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '0.875rem',
            color: '#7B8EA6',
            textAlign: 'center',
            marginTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingTop: '1.5rem',
          }}>
            Pas encore de compte ?{' '}
            <Link href="/auth/register" style={{
              color: '#D4921A',
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
