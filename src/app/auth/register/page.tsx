'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FEATURES = [
  { icon: "bi-file-earmark-check", text: "Factures conformes au format Factur-X" },
  { icon: "bi-shield-check", text: "Réforme e-invoicing 2026–2027 intégrée" },
  { icon: "bi-robot", text: "IA de détection d'exceptions et données manquantes" },
  { icon: "bi-graph-up-arrow", text: "Pilotage du workflow de bout en bout" },
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/auth/signin?registration=success");
      } else {
        const data = await response.json();
        setError(data.message || "Échec de l'inscription. Veuillez réessayer.");
      }
    } catch {
      setError("Une erreur inattendue s'est produite. Vérifiez votre connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#08090a" }}>
      {/* Left panel */}
      <div
        className="d-none d-lg-flex"
        style={{
          width: "42%",
          flexShrink: 0,
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 56px",
          backgroundColor: "#0f1011",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial glow decoration */}
        <div style={{
          position: "absolute",
          top: "-120px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,146,26,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          bottom: "-100px",
          left: "-60px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,146,26,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "56px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            backgroundColor: "#D4921A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <i className="bi bi-lightning-fill" style={{ color: "#08090a", fontSize: "0.875rem" }} />
          </div>
          <span style={{
            fontSize: "1rem",
            fontWeight: 590,
            color: "#f7f8f8",
            letterSpacing: "-0.01em",
            fontFeatureSettings: '"cv01","ss03"',
          }}>
            InvoiceOps
          </span>
        </div>

        <div style={{
          fontSize: "0.6875rem",
          fontWeight: 590,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: "#D4921A",
          marginBottom: "16px",
          fontFeatureSettings: '"cv01","ss03"',
        }}>
          Rejoignez la bêta
        </div>

        <h2 style={{
          fontSize: "1.625rem",
          fontWeight: 590,
          color: "#f7f8f8",
          lineHeight: 1.25,
          letterSpacing: "-0.03em",
          marginBottom: "12px",
          fontFeatureSettings: '"cv01","ss03"',
        }}>
          Créez votre espace de pilotage de facturation électronique
        </h2>
        <p style={{
          fontSize: "0.9375rem",
          color: "#8a8f98",
          lineHeight: 1.65,
          marginBottom: "48px",
          fontFeatureSettings: '"cv01","ss03"',
        }}>
          Structurez le passage du travail validé à la facture conforme, prête pour la réforme 2026–2027.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                backgroundColor: "rgba(212,146,26,0.08)",
                border: "1px solid rgba(212,146,26,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <i className={`bi ${f.icon}`} style={{ color: "#D4921A", fontSize: "0.875rem" }} />
              </div>
              <span style={{
                fontSize: "0.875rem",
                color: "#d0d6e0",
                fontFeatureSettings: '"cv01","ss03"',
              }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom testimonial */}
        <div style={{
          marginTop: "56px",
          padding: "20px",
          backgroundColor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "10px",
        }}>
          <p style={{
            fontSize: "0.875rem",
            color: "#d0d6e0",
            lineHeight: 1.6,
            margin: 0,
            fontStyle: "italic",
            fontFeatureSettings: '"cv01","ss03"',
          }}>
            "Enfin un outil qui comprend le cycle complet — du bon de commande à la facture conforme."
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              backgroundColor: "rgba(212,146,26,0.12)",
              border: "1px solid rgba(212,146,26,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6875rem",
              fontWeight: 590,
              color: "#D4921A",
            }}>
              SC
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 510, color: "#d0d6e0", fontFeatureSettings: '"cv01","ss03"' }}>
                Sophie C.
              </div>
              <div style={{ fontSize: "0.6875rem", color: "#62666d", fontFeatureSettings: '"cv01","ss03"' }}>
                DAF, Agence conseil
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
      }}>
        {/* Mobile brand */}
        <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
          <div style={{
            width: "28px",
            height: "28px",
            borderRadius: "7px",
            backgroundColor: "#D4921A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <i className="bi bi-lightning-fill" style={{ color: "#08090a", fontSize: "0.8rem" }} />
          </div>
          <span style={{ fontSize: "1rem", fontWeight: 590, color: "#f7f8f8", fontFeatureSettings: '"cv01","ss03"' }}>
            InvoiceOps
          </span>
        </div>

        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ marginBottom: "36px" }}>
            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: 590,
              color: "#f7f8f8",
              letterSpacing: "-0.02em",
              margin: "0 0 8px",
              fontFeatureSettings: '"cv01","ss03"',
            }}>
              Créer votre compte
            </h1>
            <p style={{
              fontSize: "0.9375rem",
              color: "#8a8f98",
              margin: 0,
              fontFeatureSettings: '"cv01","ss03"',
            }}>
              Accès bêta · Aucune carte requise
            </p>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px",
              backgroundColor: "rgba(224,82,82,0.08)",
              border: "1px solid rgba(224,82,82,0.2)",
              borderRadius: "8px",
              color: "#e05252",
              fontSize: "0.875rem",
              marginBottom: "20px",
              fontFeatureSettings: '"cv01","ss03"',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Email */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.6875rem",
                fontWeight: 590,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#8a8f98",
                marginBottom: "6px",
                fontFeatureSettings: '"cv01","ss03"',
              }}>
                Adresse e-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="vous@agence.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "6px",
                  color: "#f7f8f8",
                  fontSize: "0.9375rem",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFeatureSettings: '"cv01","ss03"',
                  transition: "border-color 120ms ease, box-shadow 120ms ease",
                }}
                onFocus={e => {
                  e.target.style.borderColor = "#D4921A";
                  e.target.style.boxShadow = "0 0 0 3px rgba(212,146,26,0.15)";
                }}
                onBlur={e => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                display: "block",
                fontSize: "0.6875rem",
                fontWeight: 590,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#8a8f98",
                marginBottom: "6px",
                fontFeatureSettings: '"cv01","ss03"',
              }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 42px 10px 14px",
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px",
                    color: "#f7f8f8",
                    fontSize: "0.9375rem",
                    outline: "none",
                    boxSizing: "border-box",
                    fontFeatureSettings: '"cv01","ss03"',
                    transition: "border-color 120ms ease, box-shadow 120ms ease",
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = "#D4921A";
                    e.target.style.boxShadow = "0 0 0 3px rgba(212,146,26,0.15)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "#62666d",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} style={{ fontSize: "0.875rem" }} />
                </button>
              </div>
              <p style={{
                fontSize: "0.75rem",
                color: "#62666d",
                marginTop: "6px",
                margin: "6px 0 0",
                fontFeatureSettings: '"cv01","ss03"',
              }}>
                Minimum 8 caractères
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "11px",
                marginTop: "8px",
                backgroundColor: isLoading ? "rgba(212,146,26,0.5)" : "#D4921A",
                border: "none",
                borderRadius: "6px",
                color: "#08090a",
                fontSize: "0.9375rem",
                fontWeight: 590,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 120ms ease",
                fontFeatureSettings: '"cv01","ss03"',
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#F0AE38"; }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.backgroundColor = "#D4921A"; }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid rgba(8,9,10,0.3)",
                      borderTopColor: "#08090a",
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Création...
                </>
              ) : "Créer mon compte"}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "24px 0",
          }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: "0.75rem", color: "#62666d", fontFeatureSettings: '"cv01","ss03"' }}>ou</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Google */}
          <button
            onClick={() => alert("Google Sign-In — bientôt disponible")}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              color: "#d0d6e0",
              fontSize: "0.9375rem",
              fontWeight: 400,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 120ms ease",
              fontFeatureSettings: '"cv01","ss03"',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
            }}
          >
            <i className="bi bi-google" style={{ fontSize: "0.875rem" }} />
            Continuer avec Google
          </button>

          {/* Sign in link */}
          <p style={{
            textAlign: "center",
            marginTop: "28px",
            fontSize: "0.875rem",
            color: "#8a8f98",
            fontFeatureSettings: '"cv01","ss03"',
          }}>
            Déjà un compte ?{" "}
            <Link href="/auth/signin" style={{
              color: "#F0AE38",
              textDecoration: "none",
              fontWeight: 510,
            }}>
              Se connecter
            </Link>
          </p>

          <p style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "0.75rem",
            color: "#62666d",
            fontFeatureSettings: '"cv01","ss03"',
          }}>
            En créant un compte, vous acceptez nos{" "}
            <Link href="/terms-of-service" style={{ color: "#8a8f98", textDecoration: "underline" }}>
              CGU
            </Link>{" "}
            et notre{" "}
            <Link href="/privacy-policy" style={{ color: "#8a8f98", textDecoration: "underline" }}>
              politique de confidentialité
            </Link>.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
