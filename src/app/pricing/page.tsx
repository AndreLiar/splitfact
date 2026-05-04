import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Tarifs InvoiceOps — Plan gratuit + Pro 49€/mois (30 jours offerts)',
  description:
    "Plan gratuit (10 factures/mois) + Plan Pro (49€/mois) avec dépôt Chorus Pro illimité, Factur-X conforme EN 16931, e-reporting B2C et 30 jours d'essai gratuit. Pas de carte bancaire requise.",
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Tarifs InvoiceOps — Gratuit ou Pro 49€/mois',
    description:
      "Le plan Pro inclut Factur-X, dépôt Chorus Pro/PPF, e-reporting DGFiP et validation SIRET. 30 jours offerts, sans carte bancaire.",
    url: '/pricing',
    type: 'website',
  },
};

const freeFeatures = [
  "Jusqu'à 10 factures / mois",
  "Création manuelle",
  "Clients illimités",
  "Tableau de bord basique",
  "Lien de paiement Stripe",
];

const proFeatures = [
  "Factures illimitées",
  "Extraction IA (OCR image & PDF)",
  "Génération Factur-X (PDF/A-3 + XML)",
  "Dépôt Chorus Pro / PPF direct",
  "E-reporting B2C (art. 290 CGI)",
  "Score de conformité EN 16931",
  "Inbox des exceptions centralisée",
  "Facturation récurrente automatique",
  "Polling statut PPF en temps réel",
  "Validation SIRET (INSEE SIRENE)",
  "Journal d'audit complet",
  "Notifications avec file de retry",
];

const comparison: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "Volume mensuel de factures", free: "10", pro: "Illimité" },
  { feature: "Génération Factur-X (PDF/A-3 + XML)", free: false, pro: true },
  { feature: "Dépôt direct Chorus Pro / PPF", free: false, pro: true },
  { feature: "Extraction IA (OCR image & PDF)", free: false, pro: true },
  { feature: "Validation SIRET (INSEE SIRENE)", free: false, pro: true },
  { feature: "E-reporting B2C automatique", free: false, pro: true },
  { feature: "Score de conformité EN 16931", free: false, pro: true },
  { feature: "Polling statut PPF temps réel", free: false, pro: true },
  { feature: "Facturation récurrente", free: false, pro: true },
  { feature: "Inbox des exceptions", free: false, pro: true },
  { feature: "Journal d'audit complet", free: false, pro: true },
  { feature: "Lien de paiement Stripe", free: true, pro: true },
  { feature: "Tableau de bord", free: "Basique", pro: "Complet" },
  { feature: "Support", free: "Email", pro: "Email prioritaire" },
];

const faq = [
  {
    q: "Pourquoi un plan gratuit limité à 10 factures/mois ?",
    a: "Le plan gratuit sert à découvrir InvoiceOps et envoyer vos premières factures sans engagement. Au-delà de 10 factures/mois, le plan Pro débloque le dépôt Chorus Pro, le Factur-X, l'e-reporting et tout le moteur de conformité — c'est ce dont vous aurez besoin dès septembre 2026.",
  },
  {
    q: "Que se passe-t-il après les 30 jours d'essai gratuit ?",
    a: "L'essai démarre sans carte bancaire. Au bout de 30 jours, soit vous renseignez un moyen de paiement pour passer en Pro à 49€/mois, soit votre compte bascule automatiquement sur le plan gratuit (10 factures/mois). Aucun prélèvement surprise.",
  },
  {
    q: "La TVA française est-elle incluse dans les 49€ ?",
    a: "Non. Le prix affiché est HT. La TVA française (20%) est appliquée à la facturation. Pour un compte professionnel, la TVA est récupérable.",
  },
  {
    q: "Est-ce que le dépôt Chorus Pro est vraiment inclus ?",
    a: "Oui. InvoiceOps soumet vos factures Factur-X directement à Chorus Pro / PPF via l'API officielle PISTE. Vous pouvez utiliser nos identifiants de plateforme ou configurer les vôtres (chiffrés AES-256). Le statut de dépôt est polled en temps réel.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Vous pouvez annuler depuis votre tableau de bord, sans pénalité. Vos factures déjà émises restent accessibles et exportables.",
  },
  {
    q: "Est-ce que je peux migrer mes données depuis un autre logiciel ?",
    a: "Oui. Nous accompagnons gratuitement la migration de vos clients, articles et historique de factures depuis Pennylane, QuickBooks, Tiime, Indy ou un export CSV. Contactez-nous via le formulaire programme pilote.",
  },
  {
    q: "InvoiceOps fonctionne-t-il pour les sous-traitants BTP en autoliquidation ?",
    a: "C'est notre cœur de cible. Nous gérons l'autoliquidation TVA (article 283-2 nonies du CGI), les factures de situation, la retenue de garantie 5%, et le code EN 16931 dans le XML Factur-X — exactement les cas qui font rejeter les factures sur Chorus Pro.",
  },
  {
    q: "Mes données sont-elles hébergées en France ?",
    a: "Les données sont hébergées dans l'UE (RGPD-compliant). Les identifiants Chorus Pro per-tenant sont chiffrés AES-256-GCM. Voir notre politique de confidentialité pour le détail.",
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'InvoiceOps Pro',
  description:
    "Facturation électronique conforme Chorus Pro / Factur-X pour les sous-traitants BTP. Génération PDF/A-3 + XML, dépôt direct Chorus Pro, e-reporting DGFiP.",
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'InvoicingApplication',
  operatingSystem: 'Web',
  url: 'https://invoiceops.fr/pricing',
  publisher: { '@type': 'Organization', name: 'InvoiceOps', url: 'https://invoiceops.fr' },
  offers: {
    '@type': 'Offer',
    price: '49.00',
    priceCurrency: 'EUR',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '49.00',
      priceCurrency: 'EUR',
      referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' },
    },
    availability: 'https://schema.org/InStock',
    url: 'https://invoiceops.fr/pricing',
  },
};

export default function PricingPage() {
  return (
    <>
      <Script id="ld-pricing-faq" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(faqJsonLd)}
      </Script>
      <Script id="ld-pricing-product" type="application/ld+json" strategy="beforeInteractive">
        {JSON.stringify(productJsonLd)}
      </Script>

      <main style={{ backgroundColor: '#08090a', color: '#f7f8f8', minHeight: '100vh', paddingBottom: '6rem' }}>
        <section style={{ padding: '6rem 0 3rem' }}>
          <div className="main-container">
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4921A', marginBottom: '1rem' }}>
                Tarifs
              </div>
              <h1 style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 590,
                letterSpacing: '-0.03em',
                color: '#f7f8f8',
                marginBottom: '1rem',
                lineHeight: 1.1,
              }}>
                Simple. Prévisible. Prêt pour 2026.
              </h1>
              <p style={{ fontSize: '1.0625rem', color: '#8a8f98', lineHeight: 1.6 }}>
                Commencez gratuitement avec 10 factures par mois. Passez au Pro quand votre volume ou la réforme l'exige —
                Factur-X, Chorus Pro et e-reporting inclus.
              </p>
            </div>
          </div>
        </section>

        <section style={{ padding: '0 0 4rem' }}>
          <div className="main-container">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                maxWidth: '860px',
                margin: '0 auto',
              }}
              className="pricing-grid"
            >
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#62666d', marginBottom: '1rem' }}>
                    Gratuit
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 500, color: '#f7f8f8', letterSpacing: '-0.04em' }}>0 €</span>
                    <span style={{ fontSize: '0.875rem', color: '#62666d' }}> / mois</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#8a8f98', lineHeight: 1.6, margin: 0 }}>
                    Pour découvrir la plateforme et envoyer vos premières factures.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', flex: 1 }}>
                  {freeFeatures.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-check2" style={{ color: '#10b981', fontSize: '0.9rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#d0d6e0' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/register"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '9px 20px',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#d0d6e0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 510,
                    textDecoration: 'none',
                  }}
                >
                  Commencer gratuitement
                </Link>
              </div>

              <div style={{
                backgroundColor: 'rgba(212,146,26,0.04)',
                border: '1px solid rgba(212,146,26,0.25)',
                borderRadius: '12px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(212,146,26,0.5), transparent)',
                  pointerEvents: 'none',
                }} />

                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4921A' }}>
                      Pro
                    </div>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 590, letterSpacing: '0.06em', textTransform: 'uppercase',
                      padding: '3px 8px',
                      backgroundColor: 'rgba(212,146,26,0.12)',
                      border: '1px solid rgba(212,146,26,0.25)',
                      borderRadius: '4px',
                      color: '#D4921A',
                    }}>
                      30 jours offerts
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '2.5rem', fontWeight: 500, color: '#f7f8f8', letterSpacing: '-0.04em' }}>49 €</span>
                    <span style={{ fontSize: '0.875rem', color: '#62666d' }}> HT / mois</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#8a8f98', lineHeight: 1.6, margin: 0 }}>
                    Tout le workflow, de l'extraction IA au dépôt Chorus Pro — conforme 2026 dès aujourd'hui.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', flex: 1 }}>
                  {proFeatures.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="bi bi-check2" style={{ color: '#D4921A', fontSize: '0.9rem', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#d0d6e0' }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/register"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '9px 20px',
                    backgroundColor: '#D4921A',
                    color: '#08090a',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Démarrer l'essai gratuit
                </Link>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#62666d', marginTop: '1.75rem' }}>
              Pas de carte bancaire requise pour l'essai · Annulation à tout moment · TVA française applicable
            </p>
          </div>
        </section>

        <section style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="main-container" style={{ maxWidth: '860px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4921A', marginBottom: '0.75rem' }}>
                Comparaison
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 590, letterSpacing: '-0.02em', color: '#f7f8f8', margin: 0 }}>
                Ce qui change quand vous passez au Pro
              </h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#8a8f98', fontWeight: 510 }}>Fonctionnalité</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: '#8a8f98', fontWeight: 510, width: '120px' }}>Gratuit</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: '#D4921A', fontWeight: 510, width: '120px' }}>Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row) => (
                    <tr key={row.feature} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.875rem 1rem', color: '#d0d6e0' }}>{row.feature}</td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', color: row.free === false ? '#62666d' : '#d0d6e0' }}>
                        {row.free === true ? <i className="bi bi-check2" style={{ color: '#10b981' }} /> : row.free === false ? <i className="bi bi-dash" /> : row.free}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'center', color: row.pro === false ? '#62666d' : '#d0d6e0' }}>
                        {row.pro === true ? <i className="bi bi-check2" style={{ color: '#D4921A' }} /> : row.pro === false ? <i className="bi bi-dash" /> : row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section style={{ padding: '4rem 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="main-container" style={{ maxWidth: '760px' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 590, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4921A', marginBottom: '0.75rem' }}>
                Questions fréquentes
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 590, letterSpacing: '-0.02em', color: '#f7f8f8', margin: 0 }}>
                Réponses aux questions courantes
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              {faq.map((item) => (
                <details key={item.q} style={{ backgroundColor: '#08090a', padding: '1.25rem 1.5rem' }}>
                  <summary style={{ cursor: 'pointer', listStyle: 'none', color: '#f7f8f8', fontWeight: 510, fontSize: '0.95rem' }}>
                    {item.q}
                  </summary>
                  <p style={{ marginTop: '0.75rem', color: '#8a8f98', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: 0 }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '4rem 0 0' }}>
          <div className="main-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 590, letterSpacing: '-0.02em', color: '#f7f8f8', marginBottom: '1rem' }}>
              Prêt à déposer sans rejet sur Chorus Pro ?
            </h2>
            <p style={{ fontSize: '1rem', color: '#8a8f98', lineHeight: 1.6, marginBottom: '2rem' }}>
              Créez votre compte en 2 minutes. Plan gratuit jusqu'à 10 factures/mois — sans carte bancaire.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/auth/register"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#D4921A',
                  color: '#08090a',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Créer un compte gratuit →
              </Link>
              <Link
                href="/comment-ca-marche"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#d0d6e0',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: 510,
                  textDecoration: 'none',
                }}
              >
                Comment ça marche
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
