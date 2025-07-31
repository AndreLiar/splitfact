'use client';

import Link from "next/link";
import { motion } from "framer-motion";

export default function FonctionnalitesPage() {
  const features = [
    {
      icon: "bi-robot",
      title: "IA Fiscale Avancée",
      description: "Assistant IA alimenté par Google Gemini spécialisé dans le régime Micro-BIC auto-entrepreneur",
      details: [
        "Conseils personnalisés pour le régime Micro-BIC auto-entrepreneur",
        "Génération automatique des déclarations URSSAF",
        "Calculs automatiques des cotisations sociales (22%)",
        "Optimisation fiscale pour auto-entrepreneurs"
      ],
      color: "primary"
    },
    {
      icon: "bi-shield-check",
      title: "Conformité URSSAF 100%",
      description: "Génération automatique de sous-factures Micro-BIC conformes pour éviter les redressements",
      details: [
        "Respect automatique des règles de rétrocession pour auto-entrepreneurs",
        "Génération de factures Micro-BIC conformes",
        "Calculs automatiques des cotisations sociales (22%)",
        "Traçabilité complète pour les contrôles URSSAF"
      ],
      color: "validationGreen"
    },
    {
      icon: "bi-people",
      title: "Gestion d'Équipe",
      description: "Créez et gérez vos équipes d'auto-entrepreneurs avec répartition automatique des revenus",
      details: [
        "Invitation et gestion des collaborateurs auto-entrepreneurs",
        "Définition des parts de chacun",
        "Historique des contributions par membre",
        "Tableau de bord collaboratif unifié"
      ],
      color: "optionalAccent"
    },
    {
      icon: "bi-credit-card",
      title: "Paiements Automatisés",
      description: "Intégration Stripe Connect pour l'encaissement et la répartition automatique",
      details: [
        "Encaissement direct depuis les factures Micro-BIC",
        "Répartition automatique selon les parts définies",
        "Virements immédiats sur les comptes auto-entrepreneurs",
        "Gestion transparente des frais de transaction"
      ],
      color: "primary"
    },
    {
      icon: "bi-file-earmark-text",
      title: "Facturation Intelligente",
      description: "Génération de factures Micro-BIC professionnelles avec calculs automatiques",
      details: [
        "Templates conformes au régime Micro-BIC",
        "Calculs automatiques des cotisations (22%)",
        "Numérotation automatique conforme",
        "Export PDF professionnel optimisé"
      ],
      color: "validationGreen"
    },
    {
      icon: "bi-graph-up",
      title: "Analytics & Reporting",
      description: "Tableaux de bord avec métriques détaillées et analyses de performance",
      details: [
        "Chiffre d'affaires Micro-BIC en temps réel",
        "Analyse des cotisations sociales (22%)",
        "Prévisions fiscales pour auto-entrepreneurs",
        "Rapports d'activité automatiques conformes"
      ],
      color: "optionalAccent"
    },
    {
      icon: "bi-chat-dots",
      title: "Support Expert",
      description: "Accompagnement par des experts fiscaux spécialisés Micro-BIC",
      details: [
        "Chat en direct avec des experts auto-entrepreneur",
        "Base de connaissances Micro-BIC complète",
        "Webinaires de formation spécialisés",
        "Support technique prioritaire"
      ],
      color: "primary"
    },
    {
      icon: "bi-shield-lock",
      title: "Sécurité & Confidentialité",
      description: "Protection des données avec chiffrement de niveau bancaire",
      details: [
        "Chiffrement AES-256",
        "Conformité RGPD",
        "Sauvegarde automatique",
        "Accès sécurisé multi-facteurs"
      ],
      color: "validationGreen"
    }
  ];

  return (
    <div className="bg-softWhite text-darkGray">
      {/* Hero Section */}
      <section className="splitfact-section main-container py-xxxl">
        <div className="text-center mb-xxl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="badge bg-primary text-white px-xl py-md rounded-pill mb-lg d-inline-flex align-items-center">
              <i className="bi bi-stars me-sm fs-6"></i>
              Fonctionnalités Complètes
            </span>
            <h1 className="display-3 fw-bold mb-lg text-darkGray">
              Tout ce dont vous avez besoin pour une 
              <span className="text-primary"> facturation collaborative</span>
            </h1>
            <p className="lead text-mediumGray mb-xl" style={{maxWidth: '700px', margin: '0 auto'}}>
              Découvrez comment Splitfact révolutionne la facturation entre freelances avec des outils IA avancés et une conformité URSSAF garantie.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="row g-xl">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card h-100 p-xxl shadow-subtle rounded-xl border-0 feature-card"
                >
                  <div className="d-flex align-items-start mb-lg">
                    <div className={`bg-${feature.color} rounded-circle d-flex align-items-center justify-content-center me-lg flex-shrink-0`}
                         style={{width: '60px', height: '60px'}}>
                      <i className={`${feature.icon} text-white`} style={{fontSize: '24px'}}></i>
                    </div>
                    <div>
                      <h3 className="text-darkGray mb-md fw-bold">{feature.title}</h3>
                      <p className="text-mediumGray mb-lg lead">{feature.description}</p>
                    </div>
                  </div>
                  
                  <ul className="list-unstyled mb-0">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="d-flex align-items-start mb-md">
                        <i className={`bi bi-check-circle-fill text-${feature.color} me-md mt-1 flex-shrink-0`}></i>
                        <span className="text-darkGray">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="splitfact-section bg-lightGray">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Spécifications Techniques</h2>
            <p className="lead text-mediumGray">Architecture moderne et performante</p>
          </div>
          
          <div className="row g-xl">
            <div className="col-md-4">
              <div className="card p-xl shadow-subtle rounded-xl border-0 text-center h-100">
                <i className="bi bi-cpu text-primary mb-lg" style={{fontSize: '48px'}}></i>
                <h4 className="text-darkGray mb-lg">IA & Machine Learning</h4>
                <ul className="list-unstyled text-mediumGray">
                  <li className="mb-md">• Google Gemini Pro</li>
                  <li className="mb-md">• LangGraph Multi-Agent</li>
                  <li className="mb-md">• Ollama Local AI</li>
                  <li className="mb-md">• RAG (Retrieval Augmented Generation)</li>
                </ul>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card p-xl shadow-subtle rounded-xl border-0 text-center h-100">
                <i className="bi bi-server text-validationGreen mb-lg" style={{fontSize: '48px'}}></i>
                <h4 className="text-darkGray mb-lg">Infrastructure</h4>
                <ul className="list-unstyled text-mediumGray">
                  <li className="mb-md">• Next.js 15 App Router</li>
                  <li className="mb-md">• PostgreSQL + Prisma</li>
                  <li className="mb-md">• Vercel Edge Functions</li>
                  <li className="mb-md">• Redis pour le cache</li>
                </ul>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card p-xl shadow-subtle rounded-xl border-0 text-center h-100">
                <i className="bi bi-shield-lock text-optionalAccent mb-lg" style={{fontSize: '48px'}}></i>
                <h4 className="text-darkGray mb-lg">Sécurité & Conformité</h4>
                <ul className="list-unstyled text-mediumGray">
                  <li className="mb-md">• Chiffrement AES-256</li>
                  <li className="mb-md">• RGPD Compliant</li>
                  <li className="mb-md">• Auth0 / NextAuth</li>
                  <li className="mb-md">• Audit trails complets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Intégrations</h2>
            <p className="lead text-mediumGray">Connectez Splitfact à vos outils préférés</p>
          </div>
          
          <div className="row g-xl align-items-center">
            <div className="col-lg-6">
              <div className="row g-lg">
                <div className="col-6">
                  <div className="card p-lg shadow-subtle rounded-xl border-0 text-center">
                    <i className="bi bi-stripe text-primary mb-md" style={{fontSize: '36px'}}></i>
                    <h6 className="text-darkGray mb-0">Stripe Connect</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card p-lg shadow-subtle rounded-xl border-0 text-center">
                    <i className="bi bi-bank text-validationGreen mb-md" style={{fontSize: '36px'}}></i>
                    <h6 className="text-darkGray mb-0">Banques</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card p-lg shadow-subtle rounded-xl border-0 text-center">
                    <i className="bi bi-file-earmark-spreadsheet text-optionalAccent mb-md" style={{fontSize: '36px'}}></i>
                    <h6 className="text-darkGray mb-0">Excel / CSV</h6>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card p-lg shadow-subtle rounded-xl border-0 text-center">
                    <i className="bi bi-envelope text-primary mb-md" style={{fontSize: '36px'}}></i>
                    <h6 className="text-darkGray mb-0">Email</h6>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <h3 className="text-darkGray mb-lg">API & Webhooks</h3>
              <p className="text-mediumGray mb-lg">
                Splitfact propose une API REST complète et des webhooks pour intégrer facilement notre solution dans votre workflow existant.
              </p>
              <ul className="list-unstyled">
                <li className="d-flex align-items-center mb-md">
                  <i className="bi bi-check-circle-fill text-validationGreen me-md"></i>
                  <span className="text-darkGray">API REST documentée</span>
                </li>
                <li className="d-flex align-items-center mb-md">
                  <i className="bi bi-check-circle-fill text-validationGreen me-md"></i>
                  <span className="text-darkGray">Webhooks en temps réel</span>
                </li>
                <li className="d-flex align-items-center mb-md">
                  <i className="bi bi-check-circle-fill text-validationGreen me-md"></i>
                  <span className="text-darkGray">SDK JavaScript/Python</span>
                </li>
                <li className="d-flex align-items-center mb-md">
                  <i className="bi bi-check-circle-fill text-validationGreen me-md"></i>
                  <span className="text-darkGray">Rate limiting intelligent</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="splitfact-section bg-primary text-white">
        <div className="main-container text-center">
          <h2 className="display-4 fw-bold mb-lg">Découvrez toutes ces fonctionnalités</h2>
          <p className="lead mb-xl opacity-90" style={{maxWidth: '600px', margin: '0 auto'}}>
            Commencez votre essai gratuit aujourd'hui et transformez votre facturation collaborative
          </p>
          
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link href="/auth/register"
              className="btn btn-light btn-lg px-xxxl py-xl shadow-lg text-primary fw-bold"
              style={{fontSize: '20px'}}
            >
              🚀 Essai gratuit
            </Link>
            <Link href="/comment-ca-marche"
              className="btn btn-outline-light btn-lg px-xxxl py-xl"
              style={{fontSize: '20px'}}
            >
              Comment ça marche
            </Link>
          </div>
          
          <p className="mb-0 opacity-75 mt-lg">
            <i className="bi bi-shield-check me-2"></i>
            Gratuit pour toujours • Sans engagement • Support français
          </p>
        </div>
      </section>
    </div>
  );
}