'use client';

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useState, useRef } from "react";

/* ── Data ─────────────────────────────────────────────────── */
const painPoints = [
  { icon: "bi-files", title: "Données éclatées", text: "Les infos client vivent entre email, CRM, devis PDF et Notion. Personne ne sait où est la version à jour." },
  { icon: "bi-clock-history", title: "Saisie manuelle répétitive", text: "Chaque facture exige de recopier les mêmes champs entre outils. 30–45 min par facture en moyenne." },
  { icon: "bi-exclamation-diamond", title: "Erreurs coûteuses", text: "Un SIRET incorrect, une mention TVA manquante ou un mauvais taux bloque l'encaissement." },
  { icon: "bi-shield-exclamation", title: "Réforme 2026-2027", text: "Le passage à la facturation électronique ajoute une couche technique que peu d'agences ont anticipée." },
];

const steps = [
  { n: "01", title: "Déclencheur capturé", text: "Devis signé, jalon validé, récurrence mensuelle ou timesheet approuvé — InvoiceOps reçoit le signal.", icon: "bi-lightning-charge" },
  { n: "02", title: "Agent collecte les données", text: "L'IA enrichit la facture : SIRET, TVA, mentions légales, adresse. Elle détecte les champs manquants.", icon: "bi-robot" },
  { n: "03", title: "Exceptions remontées", text: "Seuls les cas ambigus apparaissent dans l'inbox. Le reste s'écoule automatiquement vers l'émission.", icon: "bi-funnel" },
  { n: "04", title: "Émission avec confiance", text: "Facture conforme, traçable, prête pour la plateforme de dématérialisation partenaire 2026.", icon: "bi-send-check" },
];

const icpTypes = [
  { icon: "bi-palette", label: "Agences créatives" },
  { icon: "bi-briefcase", label: "Cabinets de conseil" },
  { icon: "bi-code-square", label: "Dev shops" },
  { icon: "bi-people", label: "Sociétés de staffing" },
  { icon: "bi-lightbulb", label: "Boutiques d'expertise" },
];

const features = [
  { icon: "bi-clipboard2-check", label: "Moteur de conformité", text: "Chaque facture reçoit un état clair : prête ou bloquée. Les champs manquants sont listés avant l'émission." },
  { icon: "bi-funnel", label: "Inbox des exceptions", text: "Les factures bloquées apparaissent dans une file centralisée. Votre équipe n'intervient que sur les cas ambigus." },
  { icon: "bi-file-earmark-check", label: "Factur-X natif", text: "Génère des factures PDF/A-3 avec données XML embarquées — format EU e-invoicing 2026." },
  { icon: "bi-credit-card", label: "Stripe Connect", text: "Lien de paiement en un clic sur chaque facture. Encaissement directement sur votre compte." },
  { icon: "bi-bell-fill", label: "Relances automatiques", text: "Notifications intelligentes pour les factures en retard, les échéances fiscales et les statuts de livraison." },
  { icon: "bi-graph-up-arrow", label: "Tableau de bord", text: "Volume facturé, encaissements, exceptions, délais — vue temps réel sur votre trésorerie." },
];

const timeline = [
  { date: "Sep 2026", title: "Réception obligatoire", text: "Toutes les entreprises assujetties à la TVA doivent accepter les factures électroniques.", done: false },
  { date: "Sep 2027", title: "Émission obligatoire", text: "PME et micro-entreprises doivent émettre dans le nouveau cadre Chorus Pro / PDP.", done: false },
];

const stats = [
  { value: "30–45 min", label: "par facture manuelle" },
  { value: "68 %", label: "des erreurs proviennent de données client" },
  { value: "2026", label: "réforme e-invoicing France" },
];

/* ── Helpers ──────────────────────────────────────────────── */
const FadeUp = ({ children, delay = 0, className = "" }: any) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.6875rem",
    fontWeight: 590,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#D4921A",
    marginBottom: "1.25rem",
    fontFeatureSettings: '"cv01","ss03"',
  }}>
    <span style={{ width: "16px", height: "1px", backgroundColor: "#D4921A", display: "inline-block" }} />
    {children}
  </div>
);

/* ── Component ────────────────────────────────────────────── */
export default function LandingPage() {
  const [formData, setFormData] = useState({
    fullName: "", workEmail: "", companyName: "",
    companySize: "5-10", billingModel: "retainer", notes: "",
  });
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    try {
      const res = await fetch("/api/design-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setFormState("error"); setFormMessage(data.error || "Erreur lors de l'envoi."); return; }
      setFormState("success");
      setFormMessage("Merci — nous revenons vers vous sous 48h ouvrées.");
      setFormData({ fullName: "", workEmail: "", companyName: "", companySize: "5-10", billingModel: "retainer", notes: "" });
    } catch {
      setFormState("error");
      setFormMessage("Erreur réseau. Réessayez dans quelques instants.");
    }
  };

  /* shared styles */
  const S = {
    canvas: { backgroundColor: "#08090a" } as React.CSSProperties,
    card: {
      backgroundColor: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "10px",
    } as React.CSSProperties,
    cardElevated: {
      backgroundColor: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: "12px",
    } as React.CSSProperties,
  };

  return (
    <div style={{ ...S.canvas, color: "#d0d6e0", fontFeatureSettings: '"cv01","ss03"' }}>

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section style={{
        paddingTop: "7rem",
        paddingBottom: "5rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,146,26,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "30%", left: "-10%", width: "500px", height: "500px",
          borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(94,106,210,0.05) 0%, transparent 70%)",
        }} />

        <div className="main-container" style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}
               className="hero-grid">

            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Tag */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 12px 5px 8px",
                borderRadius: "9999px",
                backgroundColor: "rgba(212,146,26,0.08)",
                border: "1px solid rgba(212,146,26,0.2)",
                fontSize: "0.75rem",
                fontWeight: 590,
                letterSpacing: "0.04em",
                color: "#D4921A",
                marginBottom: "1.75rem",
              }}>
                <span style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  backgroundColor: "#D4921A",
                  boxShadow: "0 0 6px rgba(212,146,26,0.6)",
                  display: "inline-block",
                  flexShrink: 0,
                }} />
                Facturation électronique France · Réforme 2026-2027
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                fontWeight: 590,
                lineHeight: 1.08,
                letterSpacing: "-0.04em",
                color: "#f7f8f8",
                marginBottom: "1.5rem",
              }}>
                L'IA qui transforme
                <br />
                <span style={{
                  background: "linear-gradient(90deg, #D4921A, #F0AE38, #D4921A)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shimmer 4s linear infinite",
                }}>
                  le travail validé
                </span>
                <br />
                en facture conforme.
              </h1>

              <p style={{
                fontSize: "1.0625rem",
                lineHeight: 1.65,
                color: "#8a8f98",
                marginBottom: "2rem",
                maxWidth: "480px",
              }}>
                InvoiceOps automatise le chemin entre devis signé, données client incomplètes et facture prête à émettre. Votre équipe ne traite plus que les exceptions.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
                <Link href="#design-partner-form" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "#D4921A",
                  color: "#08090a",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  transition: "all 120ms ease",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#F0AE38"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#D4921A"; }}
                >
                  <i className="bi bi-arrow-right-circle-fill" />
                  Réserver une démo
                </Link>
                <Link href="#how-it-works" style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#d0d6e0",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  fontWeight: 510,
                  textDecoration: "none",
                  transition: "all 120ms ease",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                >
                  Voir le workflow
                </Link>
              </div>

              {/* Trust signals */}
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {["Agences et sociétés de services", "Conformité TVA & URSSAF", "E-invoicing 2026 ready"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "#62666d" }}>
                    <i className="bi bi-check2" style={{ color: "#10b981", fontSize: "0.875rem" }} />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — product mock */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            >
              <div style={{
                ...S.cardElevated,
                padding: "1.5rem",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.5)",
              }}>
                {/* Mock top bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e05252" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e0943a" }} />
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  </div>
                  <div style={{
                    fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase",
                    color: "#62666d",
                  }}>
                    Pipeline · Agence Polaris
                  </div>
                  <span style={{
                    fontSize: "0.6875rem", fontWeight: 590, padding: "3px 8px",
                    backgroundColor: "rgba(16,185,129,0.12)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: "4px",
                    color: "#10b981",
                  }}>
                    3 prêtes
                  </span>
                </div>

                {/* Main invoice card */}
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  padding: "1.125rem",
                  marginBottom: "0.75rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "2px" }}>
                        Acme Corp — Développement Mai
                      </div>
                      <div style={{ fontSize: "0.6875rem", color: "#62666d", fontFamily: "'JetBrains Mono', monospace" }}>
                        INV-2025-047 · Jalon validé 12 juin
                      </div>
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "1.125rem",
                      fontWeight: 500,
                      color: "#D4921A",
                      letterSpacing: "-0.02em",
                    }}>
                      6 800 €
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["Devis signé", "SIRET vérifié", "Mentions légales ✓"].map(tag => (
                      <span key={tag} style={{
                        fontSize: "0.6rem", fontWeight: 590, letterSpacing: "0.05em", textTransform: "uppercase",
                        padding: "3px 7px",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "3px",
                        color: "#8a8f98",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status items */}
                {[
                  { label: "Données client complétées", status: "ok", badge: "Automatique" },
                  { label: "TVA sur les débits — à confirmer", status: "warn", badge: "Action requise" },
                  { label: "PDF/A-3 Factur-X prêt", status: "ok", badge: "Prêt" },
                ].map((item) => (
                  <div key={item.label} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.6rem 0.875rem",
                    marginBottom: "4px",
                    borderRadius: "6px",
                    backgroundColor: item.status === "warn"
                      ? "rgba(224,148,58,0.06)"
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${item.status === "warn" ? "rgba(224,148,58,0.15)" : "rgba(255,255,255,0.05)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <i
                        className={item.status === "ok" ? "bi bi-check-circle-fill" : "bi bi-exclamation-circle-fill"}
                        style={{ fontSize: "0.75rem", color: item.status === "ok" ? "#10b981" : "#e0943a" }}
                      />
                      <span style={{ fontSize: "0.8125rem", color: "#d0d6e0" }}>{item.label}</span>
                    </div>
                    <span style={{
                      fontSize: "0.6rem", fontWeight: 590, letterSpacing: "0.05em", textTransform: "uppercase",
                      padding: "2px 7px",
                      backgroundColor: item.status === "warn" ? "rgba(224,148,58,0.12)" : "rgba(16,185,129,0.1)",
                      border: `1px solid ${item.status === "warn" ? "rgba(224,148,58,0.25)" : "rgba(16,185,129,0.2)"}`,
                      borderRadius: "3px",
                      color: item.status === "warn" ? "#e0943a" : "#10b981",
                    }}>
                      {item.badge}
                    </span>
                  </div>
                ))}

                {/* Bottom action */}
                <div style={{
                  marginTop: "1rem",
                  display: "flex",
                  justifyContent: "flex-end",
                }}>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    backgroundColor: "#D4921A",
                    borderRadius: "6px",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#08090a",
                  }}>
                    <i className="bi bi-send-fill" style={{ fontSize: "0.75rem" }} />
                    Émettre la facture
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "2rem 0",
      }}>
        <div className="main-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }} className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 500,
                  color: "#f7f8f8",
                  letterSpacing: "-0.03em",
                  marginBottom: "0.25rem",
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#62666d" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ICP — FOR WHOM
      ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "4rem 0" }} aria-labelledby="pour-qui-title" data-testid="pour-qui-section">
        <div className="main-container">
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <SectionLabel>Pour qui</SectionLabel>
              <h2 id="pour-qui-title" data-testid="pour-qui-heading" style={{
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 590,
                letterSpacing: "-0.03em",
                color: "#f7f8f8",
                marginBottom: "0.75rem",
              }}>
                Agences et sociétés de services françaises, 5–50 personnes.
              </h2>
              <p data-testid="pour-qui-description" style={{ fontSize: "0.9375rem", color: "#8a8f98", maxWidth: "520px", margin: "0 auto" }}>
                Celles qui facturent souvent, gèrent des données client éparpillées, et n'ont pas de DAF interne pour absorber la réforme 2026-2027.
              </p>
            </div>

            <div data-testid="pour-qui-tags" style={{ display: "flex", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {icpTypes.map(t => (
                <span key={t.label} className="icp-pill" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "8px 16px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "9999px",
                  fontSize: "0.8125rem",
                  color: "#d0d6e0",
                  transition: "border-color 150ms ease",
                }}>
                  <i className={`bi ${t.icon}`} style={{ color: "#D4921A", fontSize: "0.875rem" }} />
                  {t.label}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PROBLEM
      ══════════════════════════════════════════════════════ */}
      <section id="problem" style={{ padding: "6rem 0" }}>
        <div className="main-container">
          <FadeUp>
            <SectionLabel>Le problème</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }} className="two-col-grid">
              <div>
                <h2 style={{
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 590,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: "#f7f8f8",
                  marginBottom: "1.25rem",
                }}>
                  Votre équipe ne manque pas d'un outil de plus. Elle manque d'un système.
                </h2>
                <p style={{ fontSize: "1rem", color: "#8a8f98", lineHeight: 1.7, maxWidth: "420px", marginBottom: "1.5rem" }}>
                  Chaque agence a déjà un CRM, un logiciel de facturation et une boîte mail. Le problème, c'est que rien ne relie ces sources au moment d'émettre.
                </p>
                <div style={{
                  padding: "1.25rem 1.5rem",
                  borderLeft: "2px solid #D4921A",
                  backgroundColor: "rgba(212,146,26,0.04)",
                  borderRadius: "0 8px 8px 0",
                }}>
                  <p style={{ fontSize: "0.9375rem", color: "#d0d6e0", lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>
                    "La vraie douleur n'est pas de créer la facture. C'est de finir le processus sans aller-retour."
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {painPoints.map((p, i) => (
                  <FadeUp key={p.title} delay={i * 0.07}>
                    <div style={{
                      ...S.card,
                      padding: "1.25rem",
                      height: "100%",
                      transition: "border-color 150ms ease",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
                    >
                      <i className={`bi ${p.icon}`} style={{ fontSize: "1.125rem", color: "#D4921A", marginBottom: "0.75rem", display: "block" }} />
                      <div style={{ fontSize: "0.875rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "0.375rem" }}>{p.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.6 }}>{p.text}</div>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{
        padding: "6rem 0",
        backgroundColor: "rgba(255,255,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div className="main-container">
          <FadeUp>
            <SectionLabel>Comment ça marche</SectionLabel>
            <h2 style={{
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 590,
              letterSpacing: "-0.03em",
              color: "#f7f8f8",
              marginBottom: "0.75rem",
            }}>
              Du travail approuvé à la facture émise.
            </h2>
            <p style={{ fontSize: "1rem", color: "#8a8f98", marginBottom: "3rem", maxWidth: "520px" }}>
              Un workflow en 4 étapes que vous configurez une fois, et qui tourne en continu.
            </p>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "rgba(255,255,255,0.05)" }}
               className="steps-grid">
            {steps.map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.08}>
                <div style={{
                  padding: "2rem 1.5rem",
                  backgroundColor: "#08090a",
                  position: "relative",
                }}>
                  {/* Step connector line */}
                  {i < steps.length - 1 && (
                    <div style={{
                      position: "absolute",
                      top: "2.5rem",
                      right: "-1px",
                      width: "1px",
                      height: "32px",
                      backgroundColor: "rgba(212,146,26,0.2)",
                      display: "block",
                    }} className="d-none d-xl-block" />
                  )}
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#D4921A",
                    marginBottom: "1rem",
                    letterSpacing: "0.05em",
                  }}>
                    {step.n}
                  </div>
                  <i className={`bi ${step.icon}`} style={{ fontSize: "1.25rem", color: "#f7f8f8", marginBottom: "0.875rem", display: "block" }} />
                  <div style={{ fontSize: "0.9375rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "0.5rem" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.65 }}>
                    {step.text}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════ */}
      <section id="benefits" style={{ padding: "6rem 0" }}>
        <div className="main-container">
          <FadeUp>
            <SectionLabel>Fonctionnalités</SectionLabel>
            <h2 style={{
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
              fontWeight: 590,
              letterSpacing: "-0.03em",
              color: "#f7f8f8",
              marginBottom: "0.75rem",
            }}>
              Un workflow complet, pas un outil de plus.
            </h2>
            <p style={{ fontSize: "1rem", color: "#8a8f98", marginBottom: "3rem", maxWidth: "520px" }}>
              Du déclencheur à la facture émise : conformité, exceptions centralisées, et suivi opérationnel — tout dans un seul système.
            </p>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", backgroundColor: "rgba(255,255,255,0.05)" }}
               className="features-grid">
            {features.map((f, i) => (
              <FadeUp key={f.label} delay={i * 0.06}>
                <div style={{
                  padding: "1.75rem",
                  backgroundColor: "#08090a",
                  transition: "background-color 150ms ease",
                  cursor: "default",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#08090a"}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    backgroundColor: "rgba(212,146,26,0.08)",
                    border: "1px solid rgba(212,146,26,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "1rem",
                  }}>
                    <i className={`bi ${f.icon}`} style={{ color: "#D4921A", fontSize: "0.9375rem" }} />
                  </div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "0.5rem" }}>
                    {f.label}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.65 }}>
                    {f.text}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          REGULATORY TIMELINE
      ══════════════════════════════════════════════════════ */}
      <section style={{
        padding: "6rem 0",
        backgroundColor: "rgba(255,255,255,0.015)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div className="main-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }} className="two-col-grid">
            <FadeUp>
              <SectionLabel>Réforme e-invoicing</SectionLabel>
              <h2 style={{
                fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                fontWeight: 590,
                letterSpacing: "-0.03em",
                color: "#f7f8f8",
                marginBottom: "1rem",
              }}>
                2026-2027 arrive. Préparez votre workflow maintenant.
              </h2>
              <p style={{ fontSize: "1rem", color: "#8a8f98", lineHeight: 1.7 }}>
                La réforme impose le passage à la facturation électronique pour toutes les entreprises françaises assujetties à la TVA. InvoiceOps génère des factures Factur-X (PDF/A-3 + XML) prêtes pour les plateformes partenaires.
              </p>
            </FadeUp>

            <div style={{ display: "flex", flexDirection: "column", gap: "1px", backgroundColor: "rgba(255,255,255,0.05)" }}>
              {timeline.map((t, i) => (
                <FadeUp key={t.date} delay={i * 0.1}>
                  <div style={{
                    display: "flex",
                    gap: "1.25rem",
                    padding: "1.75rem",
                    backgroundColor: "#08090a",
                    alignItems: "flex-start",
                  }}>
                    <div style={{
                      flexShrink: 0,
                      width: "48px", height: "48px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(212,146,26,0.08)",
                      border: "1px solid rgba(212,146,26,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className="bi bi-calendar-check" style={{ color: "#D4921A", fontSize: "1rem" }} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "#D4921A",
                        marginBottom: "0.25rem",
                        letterSpacing: "0.04em",
                      }}>
                        {t.date}
                      </div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "0.375rem" }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.6 }}>
                        {t.text}
                      </div>
                    </div>
                  </div>
                </FadeUp>
              ))}

              <div style={{
                padding: "1.25rem 1.75rem",
                backgroundColor: "rgba(212,146,26,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
              }}>
                <i className="bi bi-shield-check" style={{ color: "#D4921A", fontSize: "1.125rem", flexShrink: 0 }} />
                <div style={{ fontSize: "0.8125rem", color: "#8a8f98" }}>
                  InvoiceOps génère des factures <strong style={{ color: "#d0d6e0" }}>Factur-X conformes</strong> — PDF/A-3 avec XML embarqué, compatible PDP.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════════════ */}
      <FadeUp>
        <section style={{ padding: "5rem 0" }}>
          <div className="main-container">
            <div style={{
              borderRadius: "12px",
              padding: "3.5rem",
              background: "linear-gradient(135deg, rgba(212,146,26,0.12) 0%, rgba(94,106,210,0.08) 100%)",
              border: "1px solid rgba(212,146,26,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "1.5rem",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Glow */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 60% 80% at 50% 120%, rgba(212,146,26,0.1) 0%, transparent 70%)",
              }} />

              <div style={{ position: "relative" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "7px",
                  padding: "4px 12px", borderRadius: "9999px",
                  backgroundColor: "rgba(212,146,26,0.1)", border: "1px solid rgba(212,146,26,0.2)",
                  fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", color: "#D4921A",
                  marginBottom: "1.25rem",
                }}>
                  <i className="bi bi-building" style={{ fontSize: "0.75rem" }} />
                  Programme pilote · Agences françaises 5–50 personnes
                </div>

                <h2 style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                  fontWeight: 590,
                  letterSpacing: "-0.03em",
                  color: "#f7f8f8",
                  lineHeight: 1.15,
                  marginBottom: "1rem",
                }}>
                  Automatisez votre billing.<br />Préparez 2026 aujourd'hui.
                </h2>
                <p style={{ fontSize: "1rem", color: "#8a8f98", maxWidth: "500px", margin: "0 auto 2rem" }}>
                  Rejoignez le programme pilote et configurez votre workflow de facturation avant que la réforme vous l'impose.
                </p>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="#design-partner-form" style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "10px 24px",
                    backgroundColor: "#D4921A", color: "#08090a",
                    borderRadius: "6px", fontSize: "0.9rem", fontWeight: 600,
                    textDecoration: "none",
                    transition: "background-color 120ms ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#F0AE38"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#D4921A"}
                  >
                    <i className="bi bi-arrow-right-circle-fill" />
                    Réserver une démo
                  </Link>
                  <Link href="/auth/register" style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "10px 24px",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#d0d6e0",
                    borderRadius: "6px", fontSize: "0.9rem", fontWeight: 510,
                    textDecoration: "none",
                    transition: "all 120ms ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"}
                  >
                    Créer un compte gratuit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* ══════════════════════════════════════════════════════
          DEMO FORM
      ══════════════════════════════════════════════════════ */}
      <section id="design-partner-form" style={{
        padding: "6rem 0",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "rgba(255,255,255,0.01)",
      }}>
        <div className="main-container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "4rem", alignItems: "start" }} className="two-col-grid">
            {/* Left */}
            <FadeUp>
              <SectionLabel>Programme pilote</SectionLabel>
              <h2 style={{
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 590,
                letterSpacing: "-0.02em",
                color: "#f7f8f8",
                marginBottom: "1rem",
              }}>
                Parlons de votre workflow de facturation.
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "#8a8f98", lineHeight: 1.7, marginBottom: "2.5rem" }}>
                Nous cherchons des agences françaises qui veulent réduire le travail manuel entre projet validé, conformité facture et émission.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { icon: "bi-search", title: "Diagnostic de workflow", text: "Où les données se perdent et où les exceptions s'empilent." },
                  { icon: "bi-display", title: "Démo ciblée agence", text: "Un scénario orienté devis signé, jalon, récurrence ou timesheet." },
                  { icon: "bi-map", title: "Roadmap produit", text: "Vos retours influencent le scope MVP et les priorités d'intégration." },
                ].map(item => (
                  <div key={item.title} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
                    <div style={{
                      flexShrink: 0,
                      width: "32px", height: "32px", borderRadius: "7px",
                      backgroundColor: "rgba(212,146,26,0.08)",
                      border: "1px solid rgba(212,146,26,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <i className={`bi ${item.icon}`} style={{ color: "#D4921A", fontSize: "0.8125rem" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 590, color: "#d0d6e0", marginBottom: "2px" }}>{item.title}</div>
                      <div style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.6 }}>{item.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Right — form */}
            <FadeUp delay={0.1}>
              <div style={{
                ...S.cardElevated,
                padding: "2rem",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 24px 48px rgba(0,0,0,0.4)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 590, color: "#f7f8f8", marginBottom: "0.25rem" }}>
                      Réserver une démo
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "#62666d" }}>Réponse sous 48h ouvrées.</div>
                  </div>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 590, letterSpacing: "0.06em", textTransform: "uppercase",
                    padding: "4px 10px",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "4px", color: "#8a8f98",
                  }}>
                    Agences FR · 5–50 pers.
                  </span>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Nom complet
                      </label>
                      <input
                        name="fullName" type="text" required
                        className="form-control"
                        placeholder="Jean Martin"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Email pro
                      </label>
                      <input
                        name="workEmail" type="email" required
                        className="form-control"
                        placeholder="jean@agence.fr"
                        value={formData.workEmail}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Agence / société
                      </label>
                      <input
                        name="companyName" type="text" required
                        className="form-control"
                        placeholder="Agence Polaris"
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Taille d'équipe
                      </label>
                      <select name="companySize" className="form-select" value={formData.companySize} onChange={handleChange}>
                        <option value="1-4">1–4 personnes</option>
                        <option value="5-10">5–10 personnes</option>
                        <option value="11-25">11–25 personnes</option>
                        <option value="26-50">26–50 personnes</option>
                        <option value="50+">50+ personnes</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Workflow de billing principal
                      </label>
                      <select name="billingModel" className="form-select" value={formData.billingModel} onChange={handleChange}>
                        <option value="retainer">Retainers mensuels</option>
                        <option value="milestone">Facturation au jalon</option>
                        <option value="timesheet">Temps passé / timesheets</option>
                        <option value="mixed">Mixte</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8a8f98", marginBottom: "0.375rem" }}>
                        Où perdez-vous le plus de temps aujourd'hui ?
                      </label>
                      <textarea
                        name="notes" rows={4}
                        className="form-control"
                        placeholder="Données client incomplètes, validations TVA, relances internes, copies entre CRM et logiciel de facturation..."
                        value={formData.notes}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {formMessage && (
                    <div className={`alert ${formState === "success" ? "alert-success" : "alert-danger"} mb-4`}>
                      <i className={`bi ${formState === "success" ? "bi-check-circle" : "bi-exclamation-triangle"} me-2`} />
                      {formMessage}
                    </div>
                  )}

                  {formState === "success" && (
                    <div style={{
                      ...S.card,
                      padding: "1rem 1.25rem",
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}>
                      <div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 590, color: "#d0d6e0", marginBottom: "2px" }}>Explorez le produit</div>
                        <div style={{ fontSize: "0.8125rem", color: "#62666d" }}>Créez votre compte pendant qu'on prépare la démo.</div>
                      </div>
                      <Link href="/auth/register" style={{
                        padding: "7px 14px",
                        backgroundColor: "rgba(212,146,26,0.08)",
                        border: "1px solid rgba(212,146,26,0.2)",
                        borderRadius: "6px",
                        fontSize: "0.8125rem", fontWeight: 590, color: "#D4921A",
                        textDecoration: "none", whiteSpace: "nowrap",
                      }}>
                        Créer un compte →
                      </Link>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "0.75rem", color: "#62666d", maxWidth: "260px" }}>
                      En envoyant ce formulaire, vous demandez une prise de contact pour une démo ou le programme pilote.
                    </div>
                    <button
                      type="submit"
                      disabled={formState === "loading"}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "9px 20px",
                        backgroundColor: formState === "loading" ? "rgba(212,146,26,0.5)" : "#D4921A",
                        color: "#08090a",
                        border: "none", borderRadius: "6px",
                        fontSize: "0.9rem", fontWeight: 600,
                        cursor: formState === "loading" ? "not-allowed" : "pointer",
                        transition: "background-color 120ms ease",
                      }}
                    >
                      {formState === "loading" ? (
                        <><span className="spinner-border spinner-border-sm" /> Envoi…</>
                      ) : (
                        <><i className="bi bi-send" />Envoyer ma demande</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "3rem 0 2rem",
        backgroundColor: "#0f1011",
      }}>
        <div className="main-container">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", marginBottom: "3rem" }} className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.875rem" }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "5px",
                  backgroundColor: "#D4921A",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className="bi bi-lightning-fill" style={{ color: "#08090a", fontSize: "0.75rem" }} />
                </div>
                <span style={{ fontSize: "0.9375rem", fontWeight: 590, color: "#f7f8f8" }}>InvoiceOps</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#62666d", lineHeight: 1.7, maxWidth: "240px", marginBottom: "1.25rem" }}>
                Back-office de facturation IA pour les agences et sociétés de services françaises.
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {["bi-twitter-x", "bi-linkedin"].map(icon => (
                  <div key={icon} style={{
                    width: "30px", height: "30px", borderRadius: "6px",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.04)"}
                  >
                    <i className={`bi ${icon}`} style={{ color: "#8a8f98", fontSize: "0.75rem" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Produit",
                links: [
                  { label: "Comment ça marche", href: "#how-it-works" },
                  { label: "Fonctionnalités", href: "#benefits" },
                  { label: "Programme pilote", href: "#design-partner-form" },
                ],
              },
              {
                title: "Conformité",
                links: [
                  { label: "Réforme 2026-2027", href: "#" },
                  { label: "Factur-X", href: "#" },
                  { label: "URSSAF & TVA", href: "#" },
                ],
              },
              {
                title: "Compte",
                links: [
                  { label: "Connexion", href: "/auth/signin" },
                  { label: "Créer un compte", href: "/auth/register" },
                  { label: "Tableau de bord", href: "/dashboard" },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <div style={{
                  fontSize: "0.6875rem", fontWeight: 590, letterSpacing: "0.09em",
                  textTransform: "uppercase", color: "#62666d", marginBottom: "1rem",
                }}>
                  {col.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {col.links.map(l => (
                    <Link key={l.label} href={l.href} style={{
                      fontSize: "0.8125rem", color: "#8a8f98", textDecoration: "none",
                      transition: "color 120ms ease",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#d0d6e0"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#8a8f98"}
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            paddingTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}>
            <div style={{ fontSize: "0.75rem", color: "#62666d" }}>
              © {new Date().getFullYear()} InvoiceOps. Tous droits réservés.
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {[
                { label: "Confidentialité", href: "/privacy-policy" },
                { label: "CGU", href: "/terms-of-service" },
                { label: "Mentions légales", href: "/terms-of-service" },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{
                  fontSize: "0.75rem", color: "#62666d", textDecoration: "none",
                  transition: "color 120ms ease",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#8a8f98"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#62666d"}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Responsive styles ───────────────────────────────── */}
      <style jsx global>{`
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .icp-pill:hover,
        .icp-pill:focus-visible {
          border-color: rgba(212, 146, 26, 0.3) !important;
          outline: none;
        }
        @media (max-width: 991px) {
          .hero-grid, .two-col-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
          .features-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 575px) {
          .steps-grid, .features-grid, .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
