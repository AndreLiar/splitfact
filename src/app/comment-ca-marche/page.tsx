'use client';

import Link from "next/link";
import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Le travail validé devient un signal de billing",
    subtitle: "Le flux démarre depuis un événement réel",
    description: "Le point de départ n'est pas la facture elle-même, mais un événement métier: devis signé, jalon validé, récurrence mensuelle ou timesheet approuvée.",
    details: [
      "Centralisation des déclencheurs de facturation",
      "Réduction des oublis côté delivery ou admin",
      "Lien clair entre exécution projet et émission facture",
    ],
    color: "primary",
    mockupTitle: "Déclencheurs détectés",
    mockupItems: [
      "Devis client signé",
      "Jalon projet approuvé",
      "Facturation mensuelle due",
      "Temps passé validé",
    ],
  },
  {
    number: 2,
    title: "Splitfact collecte et vérifie les données",
    subtitle: "Le travail d'admin est préparé avant l'émission",
    description: "Le produit rassemble les informations depuis les sources déjà utilisées par l'agence, détecte les champs manquants et vérifie l'état de préparation.",
    details: [
      "Extraction depuis PDF, email, CRM ou tableur",
      "Préremplissage des données client et facture",
      "Détection des manques et incohérences",
      "Contrôle de conformité avant émission",
    ],
    color: "validationGreen",
    mockupTitle: "Contrôles en cours",
    mockupItems: [
      "SIREN client trouvé",
      "Adresse de facturation vérifiée",
      "Mention obligatoire manquante détectée",
      "Draft facture généré",
    ],
  },
  {
    number: 3,
    title: "L'équipe traite seulement les exceptions",
    subtitle: "Les cas ambigus ne bloquent plus tout le flux",
    description: "Les situations qui demandent un jugement humain sont isolées dans une inbox dédiée. Le reste du workflow continue normalement.",
    details: [
      "Inbox d'exceptions avec motifs de blocage",
      "Validation humaine sur les cas sensibles",
      "Moins de coordination dispersée entre outils",
      "Meilleure vitesse de préparation à l'émission",
    ],
    color: "optionalAccent",
    mockupTitle: "Exceptions prioritaires",
    mockupItems: [
      "TVA à confirmer",
      "Adresse de livraison absente",
      "Montant inhabituel",
      "Validation humaine requise",
    ],
  },
  {
    number: 4,
    title: "La facture est prête à être émise",
    subtitle: "Visibilité, traçabilité et préparation au cadre électronique",
    description: "L'objectif du produit est d'aboutir à une facture prête, traçable et mieux alignée avec les obligations à venir de la réforme française.",
    details: [
      "Statut final clair dans le pipeline",
      "Historique des actions et validations",
      "Moins de retards avant émission",
      "Approche workflow pour la réforme 2026-2027",
    ],
    color: "primary",
    mockupTitle: "Sortie du workflow",
    mockupItems: [
      "Facture prête à émettre",
      "Audit trail complet",
      "Exception levée",
      "Équipe notifiée",
    ],
  },
];

const comparisonData = [
  {
    aspect: "Point de départ",
    traditional: "On ouvre l'outil de facturation à la fin",
    splitfact: "Le flux part du travail validé",
  },
  {
    aspect: "Préparation des données",
    traditional: "Recherche manuelle dans plusieurs outils",
    splitfact: "Collecte et préremplissage centralisés",
  },
  {
    aspect: "Gestion des blocages",
    traditional: "Back-and-forth diffus entre équipes",
    splitfact: "Inbox d'exceptions dédiée",
  },
  {
    aspect: "Vision opérationnelle",
    traditional: "Peu de visibilité sur l'état réel du billing",
    splitfact: "Pipeline et statuts visibles",
  },
  {
    aspect: "Préparation à la réforme",
    traditional: "Check-lists manuelles",
    splitfact: "Approche workflow pilotée",
  },
];

export default function CommentCaMarchePage() {
  return (
    <div className="bg-softWhite text-darkGray">
      <section className="splitfact-section main-container py-xxxl">
        <div className="text-center mb-xxl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="badge bg-validationGreen text-white px-xl py-md rounded-pill mb-lg d-inline-flex align-items-center">
              <i className="bi bi-play-circle me-sm fs-6"></i>
              Workflow détaillé
            </span>
            <h1 className="display-3 fw-bold mb-lg text-darkGray">
              Comment Splitfact fait passer votre équipe
              <span className="text-primary"> du travail validé à la facture prête</span>
            </h1>
            <p className="lead text-mediumGray mb-xl" style={{ maxWidth: "760px", margin: "0 auto" }}>
              Le produit est conçu pour automatiser le travail opérationnel autour de la facture, pas uniquement pour
              générer un document.
            </p>
          </motion.div>
        </div>

        <div className="row g-xl text-center mb-xxl">
          <div className="col-md-4">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-primary fw-bold mb-sm">1</h3>
              <small className="text-mediumGray">Déclencheur métier</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-validationGreen fw-bold mb-sm">2</h3>
              <small className="text-mediumGray">Préparation et contrôle</small>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-optionalAccent fw-bold mb-sm">3</h3>
              <small className="text-mediumGray">Exceptions puis émission</small>
            </div>
          </div>
        </div>
      </section>

      {steps.map((step, index) => (
        <section key={step.title} className={`splitfact-section ${index % 2 === 0 ? "bg-white" : "bg-lightGray"}`}>
          <div className="main-container">
            <div className="row align-items-center g-xxl">
              <div className={`col-lg-6 ${index % 2 === 1 ? "order-lg-2" : ""}`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7 }}
                >
                  <div className="d-flex align-items-center mb-lg">
                    <div
                      className={`bg-${step.color} rounded-circle d-flex align-items-center justify-content-center me-lg`}
                      style={{ width: "80px", height: "80px" }}
                    >
                      <span className="text-white fw-bold" style={{ fontSize: "32px" }}>{step.number}</span>
                    </div>
                    <div>
                      <h2 className="text-darkGray mb-md fw-bold">{step.title}</h2>
                      <p className={`text-${step.color} fw-semibold mb-0`}>{step.subtitle}</p>
                    </div>
                  </div>

                  <p className="lead text-mediumGray mb-xl">{step.description}</p>

                  <ul className="list-unstyled">
                    {step.details.map((detail) => (
                      <li key={detail} className="d-flex align-items-start mb-lg">
                        <i className={`bi bi-check-circle-fill text-${step.color} me-md mt-1 flex-shrink-0`}></i>
                        <span className="text-darkGray">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <div className={`col-lg-6 ${index % 2 === 1 ? "order-lg-1" : ""}`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  <div className="card p-xxl shadow-lg rounded-xl bg-white position-relative overflow-hidden border-0">
                    <div className={`card-header text-center border-0 pb-0 bg-${step.color} text-white rounded-top-xl py-lg`}>
                      <h5 className="card-title h4 mb-0">{step.mockupTitle}</h5>
                    </div>
                    <div className="card-body pt-xl">
                      {step.mockupItems.map((item) => (
                        <div
                          key={item}
                          className="d-flex align-items-center justify-content-between mb-lg p-md rounded"
                          style={{ backgroundColor: "#f8f9fa" }}
                        >
                          <div className="d-flex align-items-center">
                            <i className={`bi bi-arrow-right-circle text-${step.color} me-md fs-5`}></i>
                            <span className="text-darkGray">{item}</span>
                          </div>
                          <span className={`badge bg-${step.color} text-white rounded-pill px-3 py-2`}>
                            OK
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Avant / après le workflow Splitfact</h2>
            <p className="lead text-mediumGray">La différence n'est pas cosmétique. Elle est opérationnelle.</p>
          </div>

          <div className="table-responsive">
            <table className="table table-borderless align-middle">
              <thead>
                <tr>
                  <th className="text-darkGray fw-bold">Aspect</th>
                  <th className="text-mediumGray fw-bold">Approche classique</th>
                  <th className="text-primary fw-bold">Avec Splitfact</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr key={row.aspect} className="border-top">
                    <td className="fw-semibold py-4">{row.aspect}</td>
                    <td className="text-mediumGray py-4">{row.traditional}</td>
                    <td className="text-darkGray py-4">{row.splitfact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="splitfact-section bg-lightGray">
        <div className="main-container">
          <div className="text-center">
            <h2 className="display-5 fw-bold mb-lg text-darkGray">Tester le workflow sur votre cas réel</h2>
            <p className="lead text-mediumGray mb-xl" style={{ maxWidth: "760px", margin: "0 auto" }}>
              Le meilleur moyen de valider la promesse est de partir de votre vrai processus de billing et de voir où
              Splitfact peut éliminer les frictions.
            </p>
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Link href="/#design-partner-form" className="btn btn-primary btn-lg rounded-pill px-4 py-3">
                Réserver une démo
              </Link>
              <Link href="/fonctionnalites" className="btn btn-outline-primary btn-lg rounded-pill px-4 py-3">
                Revoir les fonctionnalités
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
