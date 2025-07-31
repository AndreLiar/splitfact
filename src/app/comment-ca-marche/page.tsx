'use client';

import Link from "next/link";
import { motion } from "framer-motion";

export default function CommentCaMarchePage() {
  const steps = [
    {
      number: 1,
      title: "Créez votre équipe",
      subtitle: "Configuration en 2 minutes",
      description: "Ajoutez vos collaborateurs et définissez les parts de chacun selon votre accord commercial",
      details: [
        "Invitez vos collaborateurs par email",
        "Définissez les pourcentages de répartition",
        "Confirmez le statut auto-entrepreneur de chaque membre",
        "Validez la répartition avec tous les membres"
      ],
      icon: "bi-people",
      color: "primary",
      mockup: {
        title: "Équipe DevSquad",
        members: [
          { name: "Alex (Lead Dev)", percentage: "45%", status: "Auto-entrepreneur" },
          { name: "Sarah (Designer)", percentage: "30%", status: "Auto-entrepreneur" },
          { name: "Marc (Marketing)", percentage: "25%", status: "Auto-entrepreneur" }
        ]
      }
    },
    {
      number: 2,
      title: "Facturez en 1 clic",
      subtitle: "L'IA génère tout automatiquement",
      description: "Notre IA crée toutes les factures Micro-BIC conformes et calcule automatiquement les cotisations sociales (22%)",
      details: [
        "Saisissez le montant total et la description",
        "L'IA génère la facture principale + sous-factures",
        "Calculs automatiques des cotisations sociales (22%)",
        "Vérification de conformité URSSAF en temps réel"
      ],
      icon: "bi-robot",
      color: "validationGreen",
      mockup: {
        title: "Génération Automatique",
        process: [
          "Facture principale: 9,000€",
          "Alex: 4,050€ + cotisations (22%)",
          "Sarah: 2,700€ + cotisations (22%)", 
          "Marc: 2,250€ + cotisations (22%)"
        ]
      }
    },
    {
      number: 3,
      title: "Encaissez & Répartissez",
      subtitle: "Paiement et distribution automatiques",
      description: "L'argent est automatiquement réparti sur les comptes de chaque membre selon les parts définies",
      details: [
        "Encaissement via Stripe Connect sécurisé",
        "Répartition automatique instantanée",
        "Virements directs sur les comptes bancaires",
        "Notifications de paiement en temps réel"
      ],
      icon: "bi-credit-card",
      color: "optionalAccent",
      mockup: {
        title: "Répartition Automatique",
        transfers: [
          "Alex: 4,050€ → Compte BNP",
          "Sarah: 2,700€ → Compte LCL",
          "Marc: 2,250€ → Compte Crédit Agricole"
        ]
      }
    }
  ];

  const advantages = [
    {
      icon: "bi-shield-check",
      title: "100% Conforme URSSAF",
      description: "Génération automatique de sous-factures conformes aux règles de rétrocession",
      color: "validationGreen"
    },
    {
      icon: "bi-lightning-charge",
      title: "Ultra-rapide",
      description: "De 2 heures de paperasse à 2 minutes de configuration automatique",
      color: "primary"
    },
    {
      icon: "bi-calculator",
      title: "Calculs automatiques",
      description: "L'IA calcule automatiquement les cotisations sociales Micro-BIC (22%)",
      color: "optionalAccent"
    },
    {
      icon: "bi-bank",
      title: "Paiements sécurisés",
      description: "Technologie bancaire Stripe Connect avec chiffrement de niveau militaire",
      color: "validationGreen"
    }
  ];

  const comparisonData = [
    {
      aspect: "Création des factures",
      traditional: "2h par projet, erreurs fréquentes",
      splitfact: "2 minutes, génération IA parfaite"
    },
    {
      aspect: "Conformité URSSAF",
      traditional: "Risque de redressement élevé",
      splitfact: "100% conforme automatiquement"
    },
    {
      aspect: "Répartition des paiements",
      traditional: "Virements manuels, disputes",
      splitfact: "Automatique et instantané"
    },
    {
      aspect: "Calculs des charges",
      traditional: "Calculs manuels complexes",
      splitfact: "IA calcule automatiquement (22%)"
    },
    {
      aspect: "Suivi et reporting",
      traditional: "Excel chaotique",
      splitfact: "Dashboard temps réel"
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
            <span className="badge bg-validationGreen text-white px-xl py-md rounded-pill mb-lg d-inline-flex align-items-center">
              <i className="bi bi-play-circle me-sm fs-6"></i>
              Guide Complet
            </span>
            <h1 className="display-3 fw-bold mb-lg text-darkGray">
              Comment fonctionne 
              <span className="text-primary"> Splitfact</span> ?
            </h1>
            <p className="lead text-mediumGray mb-xl" style={{maxWidth: '700px', margin: '0 auto'}}>
              Découvrez étape par étape comment révolutionner votre facturation collaborative en moins de 5 minutes.
            </p>
          </motion.div>
        </div>
        
        {/* Quick metrics */}
        <div className="row g-xl text-center mb-xxl">
          <div className="col-md-3">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-primary fw-bold mb-sm">2 min</h3>
              <small className="text-mediumGray">Setup initial</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-validationGreen fw-bold mb-sm">100%</h3>
              <small className="text-mediumGray">Conforme URSSAF</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-optionalAccent fw-bold mb-sm">1 clic</h3>
              <small className="text-mediumGray">Facturation</small>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card p-xl shadow-subtle rounded-xl border-0">
              <h3 className="text-primary fw-bold mb-sm">Instantané</h3>
              <small className="text-mediumGray">Répartition</small>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Steps */}
      {steps.map((step, index) => (
        <section key={index} className={`splitfact-section ${index % 2 === 0 ? 'bg-white' : 'bg-lightGray'}`}>
          <div className="main-container">
            <div className="row align-items-center g-xxl">
              <div className={`col-lg-6 ${index % 2 === 1 ? 'order-lg-2' : ''}`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="d-flex align-items-center mb-lg">
                    <div className={`bg-${step.color} rounded-circle d-flex align-items-center justify-content-center me-lg`}
                         style={{width: '80px', height: '80px'}}>
                      <span className="text-white fw-bold" style={{fontSize: '32px'}}>{step.number}</span>
                    </div>
                    <div>
                      <h2 className="text-darkGray mb-md fw-bold">{step.title}</h2>
                      <p className={`text-${step.color} fw-semibold mb-0`}>{step.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="lead text-mediumGray mb-xl">{step.description}</p>
                  
                  <ul className="list-unstyled">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="d-flex align-items-start mb-lg">
                        <i className={`bi bi-check-circle-fill text-${step.color} me-md mt-1 flex-shrink-0`}></i>
                        <span className="text-darkGray">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
              
              <div className={`col-lg-6 ${index % 2 === 1 ? 'order-lg-1' : ''}`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="position-relative"
                >
                  <div className="card p-xxl shadow-lg rounded-xl bg-white position-relative overflow-hidden">
                    <div className={`card-header text-center border-0 pb-0 bg-${step.color} text-white rounded-top-xl py-lg`}>
                      <h5 className="card-title h4 mb-0">{step.mockup.title}</h5>
                    </div>
                    <div className="card-body pt-xl">
                      {step.mockup.members && step.mockup.members.map((member, memberIndex) => (
                        <div key={memberIndex} className="d-flex justify-content-between align-items-center mb-lg p-md rounded" 
                             style={{backgroundColor: '#f8f9fa'}}>
                          <div className="d-flex align-items-center">
                            <i className={`bi ${step.icon} me-md text-${step.color} fs-4`}></i>
                            <div>
                              <p className="fw-bold mb-0">{member.name}</p>
                              <small className="text-mediumGray">{member.status}</small>
                            </div>
                          </div>
                          <span className={`fw-bold text-${step.color}`}>{member.percentage}</span>
                        </div>
                      ))}
                      
                      {step.mockup.process && step.mockup.process.map((process, processIndex) => (
                        <div key={processIndex} className="d-flex align-items-center mb-md">
                          <i className={`bi ${step.icon} me-md text-${step.color}`}></i>
                          <span className="text-darkGray">{process}</span>
                        </div>
                      ))}
                      
                      {step.mockup.transfers && step.mockup.transfers.map((transfer, transferIndex) => (
                        <div key={transferIndex} className="d-flex align-items-center mb-md p-md rounded"
                             style={{backgroundColor: '#f0f9ff'}}>
                          <i className={`bi ${step.icon} me-md text-${step.color}`}></i>
                          <span className="text-darkGray">{transfer}</span>
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

      {/* Advantages Section */}
      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Pourquoi choisir Splitfact</h2>
            <p className="lead text-mediumGray">Les avantages qui font la différence</p>
          </div>
          
          <div className="row g-xl">
            {advantages.map((advantage, index) => (
              <div key={index} className="col-md-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card h-100 p-xl shadow-subtle rounded-xl border-0"
                >
                  <div className="d-flex align-items-center mb-lg">
                    <div className={`bg-${advantage.color} rounded-circle d-flex align-items-center justify-content-center me-lg`}
                         style={{width: '60px', height: '60px'}}>
                      <i className={`${advantage.icon} text-white`} style={{fontSize: '24px'}}></i>
                    </div>
                    <h4 className="text-darkGray mb-0 fw-bold">{advantage.title}</h4>
                  </div>
                  <p className="text-mediumGray mb-0">{advantage.description}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="splitfact-section bg-lightGray">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Avant / Après Splitfact</h2>
            <p className="lead text-mediumGray">Découvrez la transformation de votre workflow</p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow-lg rounded-xl border-0 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-primary text-white">
                      <tr>
                        <th className="p-xl border-0" style={{fontSize: '18px'}}>Aspect</th>
                        <th className="p-xl border-0 text-center" style={{fontSize: '18px'}}>
                          <i className="bi bi-x-circle me-2"></i>Méthode Traditionnelle
                        </th>
                        <th className="p-xl border-0 text-center" style={{fontSize: '18px'}}>
                          <i className="bi bi-check-circle me-2"></i>Avec Splitfact
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((item, index) => (
                        <motion.tr 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.3 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <td className="p-xl fw-bold text-darkGray">{item.aspect}</td>
                          <td className="p-xl text-center">
                            <span className="badge bg-danger text-white px-md py-sm rounded-pill">
                              {item.traditional}
                            </span>
                          </td>
                          <td className="p-xl text-center">
                            <span className="badge bg-validationGreen text-white px-md py-sm rounded-pill">
                              {item.splitfact}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="splitfact-section bg-white">
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Questions Fréquentes</h2>
            <p className="lead text-mediumGray">Tout ce que vous devez savoir</p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    question: "Comment Splitfact garantit-il la conformité URSSAF ?",
                    answer: "Notre IA est entraînée sur la réglementation URSSAF Micro-BIC la plus récente. Elle génère automatiquement les sous-factures conformes aux règles de rétrocession et calcule les cotisations sociales (22%) pour tous les auto-entrepreneurs."
                  },
                  {
                    question: "Que se passe-t-il si un membre modifie ses informations auto-entrepreneur ?",
                    answer: "Il suffit de mettre à jour son profil dans l'équipe. Tous les membres doivent être sous le régime Micro-BIC auto-entrepreneur pour utiliser la plateforme."
                  },
                  {
                    question: "Comment fonctionne la répartition des paiements ?",
                    answer: "Via Stripe Connect, l'argent est automatiquement réparti selon les parts définies. Chaque membre reçoit son virement directement, sans passer par un compte intermédiaire."
                  },
                  {
                    question: "Puis-je modifier les parts après création de l'équipe ?",
                    answer: "Oui, les parts peuvent être modifiées à tout moment avec l'accord de tous les membres. La modification ne s'applique qu'aux nouvelles factures."
                  }
                ].map((faq, index) => (
                  <div key={index} className="accordion-item border-0 shadow-sm rounded-xl mb-lg">
                    <h2 className="accordion-header">
                      <button className="accordion-button fw-bold text-darkGray rounded-xl" type="button" 
                              data-bs-toggle="collapse" data-bs-target={`#collapse${index}`}>
                        {faq.question}
                      </button>
                    </h2>
                    <div id={`collapse${index}`} className="accordion-collapse collapse" 
                         data-bs-parent="#faqAccordion">
                      <div className="accordion-body text-mediumGray">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="splitfact-section bg-primary text-white">
        <div className="main-container text-center">
          <h2 className="display-4 fw-bold mb-lg">Prêt à commencer ?</h2>
          <p className="lead mb-xl opacity-90" style={{maxWidth: '600px', margin: '0 auto'}}>
            Configuration en 2 minutes, première facture en 1 clic. Rejoignez les freelances qui ont simplifié leur facturation.
          </p>
          
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Link href="/auth/register"
              className="btn btn-light btn-lg px-xxxl py-xl shadow-lg text-primary fw-bold"
              style={{fontSize: '20px'}}
            >
              🚀 Commencer maintenant
            </Link>
            <Link href="/fonctionnalites"
              className="btn btn-outline-light btn-lg px-xxxl py-xl"
              style={{fontSize: '20px'}}
            >
              Voir les fonctionnalités
            </Link>
          </div>
          
          <p className="mb-0 opacity-75 mt-lg">
            <i className="bi bi-shield-check me-2"></i>
            Gratuit pour toujours • Configuration en 2 minutes • Support français
          </p>
        </div>
      </section>
    </div>
  );
}