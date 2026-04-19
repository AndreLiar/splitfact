'use client';

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    icon: "bi-diagram-3",
    title: "Orchestration du workflow de facturation",
    description: "Splitfact relie devis signé, jalon validé, récurrence mensuelle ou timesheet approuvée à un flux de facturation prêt à exécuter.",
    details: [
      "Déclencheurs de billing centralisés",
      "Pipeline de préparation facture",
      "Statuts de progression et audit trail",
      "Vue unique des blocages",
    ],
    color: "primary",
  },
  {
    icon: "bi-file-earmark-check",
    title: "Contrôle de conformité facture",
    description: "Le produit vérifie les mentions et signaux de préparation avant émission pour limiter les allers-retours administratifs.",
    details: [
      "Détection des champs manquants",
      "Contrôle des informations client",
      "Vérification des données de facturation",
      "Préparation à la réforme e-invoicing 2026-2027",
    ],
    color: "validationGreen",
  },
  {
    icon: "bi-magic",
    title: "Extraction et enrichissement des données",
    description: "Les données de facturation sont récupérées à partir des sources déjà utilisées par les agences: email, CRM, PDF, devis ou tableurs.",
    details: [
      "Lecture des documents de vente",
      "Préremplissage des drafts",
      "Normalisation des données client",
      "Réduction des ressaisies",
    ],
    color: "optionalAccent",
  },
  {
    icon: "bi-exclamation-octagon",
    title: "Gestion des exceptions",
    description: "Au lieu de bloquer tout le flux, Splitfact isole les cas ambigus pour que l'équipe traite seulement ce qui demande un jugement humain.",
    details: [
      "Inbox d'exceptions dédiée",
      "Motifs de blocage visibles",
      "Validation humaine sur les cas sensibles",
      "Priorisation des corrections",
    ],
    color: "primary",
  },
  {
    icon: "bi-building-check",
    title: "Conçu pour les agences françaises",
    description: "Le produit est pensé pour les agences et sociétés de services qui facturent par retainer, au jalon, ou au temps passé.",
    details: [
      "Cas d'usage agence et conseil",
      "Billing mensuel ou par projet",
      "Focus sur le back-office finance ops",
      "Positionnement vertical plutôt qu'outil générique",
    ],
    color: "validationGreen",
  },
  {
    icon: "bi-lightning-charge",
    title: "Moins d'admin, plus de vitesse d'encaissement",
    description: "L'objectif n'est pas seulement de générer un document, mais d'accélérer le passage du travail validé à la facture prête à émettre.",
    details: [
      "Moins de tâches manuelles",
      "Moins de retards liés aux données manquantes",
      "Moins de friction entre delivery et finance",
      "Plus de visibilité opérationnelle",
    ],
    color: "optionalAccent",
  },
];

const outcomes = [
  {
    title: "Réduire le temps de préparation",
    items: [
      "Moins de copies manuelles entre outils",
      "Moins de vérifications répétitives",
      "Moins de dépendance à une seule personne côté admin",
    ],
    color: "primary",
  },
  {
    title: "Fiabiliser l'émission",
    items: [
      "Factures mieux préparées avant émission",
      "Problèmes détectés plus tôt",
      "Flux plus clair vers le futur cadre électronique",
    ],
    color: "validationGreen",
  },
  {
    title: "Préparer la réforme sans chaos",
    items: [
      "Réception obligatoire au 1er septembre 2026",
      "Émission obligatoire pour PME et micro au 1er septembre 2027",
      "Approche workflow plutôt que check-list manuelle",
    ],
    color: "optionalAccent",
  },
];

export default function FonctionnalitesPage() {
  return (
    <div className="bg-softWhite text-darkGray">
      <section className="splitfact-section main-container py-xxxl">
        <div className="text-center mb-xxl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="badge bg-primary text-white px-xl py-md rounded-pill mb-lg d-inline-flex align-items-center">
              <i className="bi bi-stars me-sm fs-6"></i>
              Workflow IA de facturation
            </span>
            <h1 className="display-3 fw-bold mb-lg text-darkGray">
              Les fonctionnalités qui rendent la
              <span className="text-primary"> facturation opérationnelle</span>
            </h1>
            <p className="lead text-mediumGray mb-xl" style={{ maxWidth: "760px", margin: "0 auto" }}>
              Splitfact ne se positionne pas comme un simple générateur de facture. Le produit orchestre le workflow
              entre travail validé, conformité, données client et émission.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="row g-xl">
            {features.map((feature, index) => (
              <div key={feature.title} className="col-lg-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="card h-100 p-xxl shadow-subtle rounded-xl border-0"
                >
                  <div className="d-flex align-items-start mb-lg">
                    <div
                      className={`bg-${feature.color} rounded-circle d-flex align-items-center justify-content-center me-lg flex-shrink-0`}
                      style={{ width: "60px", height: "60px" }}
                    >
                      <i className={`${feature.icon} text-white`} style={{ fontSize: "24px" }}></i>
                    </div>
                    <div>
                      <h3 className="text-darkGray mb-md fw-bold">{feature.title}</h3>
                      <p className="text-mediumGray mb-lg lead">{feature.description}</p>
                    </div>
                  </div>

                  <ul className="list-unstyled mb-0">
                    {feature.details.map((detail) => (
                      <li key={detail} className="d-flex align-items-start mb-md">
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

      <section className="splitfact-section bg-lightGray">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Ce que l'équipe gagne réellement</h2>
            <p className="lead text-mediumGray">Le bénéfice n'est pas un écran de plus. C'est une exécution plus propre du billing.</p>
          </div>

          <div className="row g-xl">
            {outcomes.map((outcome) => (
              <div key={outcome.title} className="col-md-4">
                <div className="card p-xl shadow-subtle rounded-xl border-0 text-center h-100">
                  <i className={`bi bi-check2-square text-${outcome.color} mb-lg`} style={{ fontSize: "48px" }}></i>
                  <h4 className="text-darkGray mb-lg">{outcome.title}</h4>
                  <ul className="list-unstyled text-mediumGray mb-0">
                    {outcome.items.map((item) => (
                      <li key={item} className="mb-md">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div
            className="rounded-xxl p-4 p-lg-5 text-center shadow-lg"
            style={{ background: "linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(14,165,233,1) 55%, rgba(16,185,129,0.95) 100%)" }}
          >
            <h2 className="display-5 fw-bold text-white mb-lg">Voir le produit appliqué à votre workflow réel</h2>
            <p className="lead text-white opacity-90 mx-auto mb-xl" style={{ maxWidth: "760px" }}>
              Si vous gérez des retainers, des jalons ou du temps passé, Splitfact peut montrer comment isoler les
              exceptions et préparer la facture avant qu'elle ne ralentisse l'encaissement.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link href="/#design-partner-form" className="btn btn-light btn-lg rounded-pill px-4 py-3 text-primary fw-bold">
                Réserver une démo
              </Link>
              <Link href="/comment-ca-marche" className="btn btn-outline-light btn-lg rounded-pill px-4 py-3">
                Voir le workflow détaillé
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
