'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import PWAInstallPrompt from '@/app/components/PWAInstallPrompt';

export default function LandingPage() {
  return (
    <div className="bg-softWhite text-darkGray">
      {/* Hero Section */}
      <section className="splitfact-section main-container py-xxxl d-flex align-items-center">
        <div className="row align-items-center w-100">
          <div className="col-lg-6 col-12 pe-lg-5 mb-4 mb-lg-0">
            <div className="mb-lg">
              <span className="badge bg-primary text-white px-lg py-sm rounded-pill d-inline-flex align-items-center">
                <i className="bi bi-robot me-sm fs-6"></i>
                IA Fiscale Intégrée
              </span>
            </div>
            <h1 className="text-darkGray mb-lg hero-title" style={{fontSize: '48px', lineHeight: '1.2'}}>
              <span className="text-primary">Facturez en collectif</span><br/>
              <span className="text-optionalAccent">100% conforme URSSAF</span>
            </h1>
            <p className="lead mb-xl text-mediumGray" style={{fontSize: '20px', maxWidth: '500px', lineHeight: '1.5'}}>
              La première plateforme qui automatise vos déclarations URSSAF Micro-BIC et génère vos factures collectives d'auto-entrepreneurs en toute légalité.
            </p>
            
            {/* CTAs */}
            <div className="d-flex flex-column flex-sm-row gap-3 mb-lg">
              <Link href="/auth/register"
                className="btn btn-primary btn-lg px-4 py-3 shadow-subtle text-center"
                style={{fontSize: '18px', fontWeight: '600', minHeight: '50px'}}
              >
                Commencer gratuitement
              </Link>
              <Link href="#demo"
                className="btn btn-outline-primary btn-lg px-4 py-3 text-center"
                style={{fontSize: '18px', minHeight: '50px'}}
              >
                Voir comment ça marche
              </Link>
            </div>
            
            {/* PWA Download Section */}
            <div className="mb-xl">
              <PWAInstallPrompt className="mb-3" />
              
              {/* Alternative download buttons for non-PWA browsers */}
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <small className="text-mediumGray me-2">📱 Aussi disponible comme app :</small>
                <button 
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={() => {
                    // Fallback for browsers that don't support PWA
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                    const isAndroid = /Android/.test(navigator.userAgent);
                    
                    if (isIOS) {
                      alert('Sur iOS : Appuyez sur "Partager" puis "Ajouter à l\'écran d\'accueil"');
                    } else if (isAndroid) {
                      alert('Sur Android : Menu → "Ajouter à l\'écran d\'accueil"');
                    } else {
                      alert('Utilisez Chrome, Edge ou Safari pour installer l\'application');
                    }
                  }}
                  style={{ fontSize: '13px' }}
                >
                  <i className="bi bi-phone me-1"></i>
                  Installer l'app
                </button>
                
                <div className="d-flex align-items-center text-muted" style={{ fontSize: '12px' }}>
                  <i className="bi bi-check-circle text-success me-1"></i>
                  <span>Fonctionne hors ligne</span>
                </div>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="d-flex flex-wrap align-items-center gap-4 text-mediumGray">
              <div className="d-flex align-items-center">
                <i className="bi bi-shield-check text-validationGreen me-2"></i>
                <span className="fw-semibold">Conforme URSSAF</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-clock text-primary me-2"></i>
                <span className="fw-semibold">2 minutes setup</span>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-12 d-flex justify-content-center ps-lg-4 mt-4 mt-lg-0">
            <div
              className="position-relative w-100"
              style={{ maxWidth: '480px' }}
            >
              <div className="card p-xl shadow-lg rounded-xl bg-white w-100 position-relative overflow-hidden"
                   style={{ 
                     background: 'rgba(255, 255, 255, 0.95)', 
                     backdropFilter: 'blur(15px)', 
                     WebkitBackdropFilter: 'blur(15px)',
                     border: '1px solid rgba(255, 255, 255, 0.3)' 
                   }}
              >
                {/* Mockup Card Header */}
                <div className="card-header text-center text-darkGray border-0 pb-0 bg-lightGray rounded-top-xl py-lg">
                  <h5 className="card-title h4 mb-0">Projet DevSquad - Facture Client</h5>
                </div>
                {/* Mockup Card Body */}
                <div className="card-body pt-xl pb-xxl">
                  <div className="d-flex justify-content-between align-items-center mb-md">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-md text-primary fs-4"></i>
                      <p className="fw-bold mb-0">Alex (Lead Dev)</p>
                    </div>
                    <p className="mb-0 fw-semibold">4 000 €</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-md">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-md text-primary fs-4"></i>
                      <p className="fw-bold mb-0">Sarah (Designer)</p>
                    </div>
                    <p className="mb-0 fw-semibold">3 000 €</p>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-md">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle me-md text-primary fs-4"></i>
                      <p className="fw-bold mb-0">Marc (Marketing)</p>
                    </div>
                    <p className="mb-0 fw-semibold">2 000 €</p>
                  </div>
                  <hr className="my-xl" />
                  <div className="d-flex justify-content-between align-items-center mb-md fw-bold fs-5">
                    <p className="mb-0">Total Facture</p>
                    <p className="mb-0">9 000 €</p>
                  </div>
                  <div className="text-center mt-xl">
                    <span className="badge bg-validationGreen text-white px-lg py-sm rounded-pill d-inline-flex align-items-center">
                      <i className="bi bi-check-circle-fill me-sm fs-6"></i>
                      Conforme URSSAF
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <motion.section
        id="problems"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section main-container"
      >
        <div className="text-center mb-xxl">
          <h2 className="display-4 fw-semibold mb-lg text-darkGray">Vous en avez marre de...</h2>
        </div>
        
        <div className="row g-xl mb-xxl">
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center"
                 style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <i className="bi bi-calculator text-danger mb-lg" style={{ fontSize: '48px' }}></i>
              <h5 className="text-darkGray mb-md">Calculs URSSAF compliqués</h5>
              <p className="text-mediumGray mb-0">Des heures perdues sur les déclarations</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center"
                 style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <i className="bi bi-people text-danger mb-lg" style={{ fontSize: '48px' }}></i>
              <h5 className="text-darkGray mb-md">Répartition chaotique</h5>
              <p className="text-mediumGray mb-0">Conflits et négociations sans fin</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center"
                 style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <i className="bi bi-exclamation-triangle text-danger mb-lg" style={{ fontSize: '48px' }}></i>
              <h5 className="text-darkGray mb-md">Risque de redressement</h5>
              <p className="text-mediumGray mb-0">Rétrocessions illégales non conformes</p>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center"
                 style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <i className="bi bi-hourglass text-danger mb-lg" style={{ fontSize: '48px' }}></i>
              <h5 className="text-darkGray mb-md">Perte de temps</h5>
              <p className="text-mediumGray mb-0">Focus sur l'admin plutôt que vos projets</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="card py-xl px-xxl shadow-subtle rounded-xl border border-validationGreen bg-white d-inline-block">
            <h3 className="text-validationGreen mb-md">
              <i className="bi bi-arrow-down-circle-fill me-md"></i>
              Splitfact résout tout ça automatiquement
            </h3>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        id="how-it-works"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section main-container"
      >
        <div className="text-center mb-xxl">
          <h2 className="display-4 fw-semibold mb-lg text-darkGray">Comment ça marche</h2>
          <p className="lead text-mediumGray">3 étapes pour révolutionner votre facturation</p>
        </div>
        
        <div className="row g-xxl align-items-center">
          <div className="col-md-4 text-center">
            <div className="mb-xxl">
              <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-xl" 
                   style={{width: '100px', height: '100px'}}>
                <span className="text-white fw-bold" style={{ fontSize: '36px' }}>1</span>
              </div>
              <h4 className="text-darkGray mb-lg fw-bold">Créez votre équipe</h4>
              <p className="text-mediumGray lead">Ajoutez vos collaborateurs et définissez les parts de chacun</p>
            </div>
          </div>
          
          <div className="col-md-4 text-center">
            <div className="mb-xxl">
              <div className="bg-validationGreen rounded-circle d-inline-flex align-items-center justify-content-center mb-xl" 
                   style={{width: '100px', height: '100px'}}>
                <span className="text-white fw-bold" style={{ fontSize: '36px' }}>2</span>
              </div>
              <h4 className="text-darkGray mb-lg fw-bold">Facturez en 1 clic</h4>
              <p className="text-mediumGray lead">L'IA génère automatiquement toutes les factures conformes</p>
            </div>
          </div>
          
          <div className="col-md-4 text-center">
            <div className="mb-xxl">
              <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-xl" 
                   style={{width: '100px', height: '100px', backgroundColor: '#F59E0B'}}>
                <span className="text-white fw-bold" style={{ fontSize: '36px' }}>3</span>
              </div>
              <h4 className="text-darkGray mb-lg fw-bold">Encaissez & Répartissez</h4>
              <p className="text-mediumGray lead">L'argent est automatiquement réparti sur vos comptes</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Key Features */}
      <motion.section
        id="features"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section bg-white"
      >
        <div className="main-container">
          <div className="text-center mb-xxl">
            <h2 className="display-4 fw-semibold mb-lg text-darkGray">Pourquoi choisir Splitfact</h2>
          </div>
          
          <div className="row g-xl">
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center">
                <i className="bi bi-robot text-primary mb-lg" style={{ fontSize: '48px' }}></i>
                <h4 className="text-darkGray mb-lg">IA Fiscale Micro-BIC</h4>
                <p className="text-mediumGray">Assistant IA spécialisé auto-entrepreneur qui génère vos déclarations URSSAF Micro-BIC automatiquement</p>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center">
                <i className="bi bi-shield-check text-validationGreen mb-lg" style={{ fontSize: '48px' }}></i>
                <h4 className="text-darkGray mb-lg">100% Conforme</h4>
                <p className="text-mediumGray">Rétrocessions légales avec génération automatique de sous-factures Micro-BIC conformes URSSAF</p>
              </div>
            </div>
            
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center">
                <i className="bi bi-lightning-charge text-optionalAccent mb-lg" style={{ fontSize: '48px' }}></i>
                <h4 className="text-darkGray mb-lg">Ultra Rapide</h4>
                <p className="text-mediumGray">De la création à la répartition : 2 minutes au lieu de 2 heures par projet</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        id="pricing"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section bg-primary text-white"
      >
        <div className="main-container text-center">
          <h2 className="display-4 fw-bold mb-lg">Prêt à révolutionner votre facturation ?</h2>
          <p className="lead mb-xl opacity-90" style={{maxWidth: '600px', margin: '0 auto'}}>
            Rejoignez les auto-entrepreneurs qui ont simplifié leur gestion administrative
          </p>
          
          <div className="d-flex justify-content-center mb-xl">
            <Link href="/auth/register"
              className="btn btn-light btn-lg px-xxxl py-xl shadow-lg text-primary fw-bold"
              style={{fontSize: '20px'}}
            >
              🚀 Commencer gratuitement
            </Link>
          </div>
          
          <p className="mb-0 opacity-75">
            <i className="bi bi-shield-check me-2"></i>
            Gratuit pour toujours • Sans engagement • Support français
          </p>
        </div>
      </motion.section>

      {/* PWA Features Section */}
      <motion.section
        id="mobile-app"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section bg-white"
      >
        <div className="main-container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-4 fw-semibold mb-lg text-darkGray">
                <i className="bi bi-phone me-3 text-primary"></i>
                Une app qui marche partout
              </h2>
              <p className="lead text-mediumGray mb-xxl">
                Installez Splitfact sur tous vos appareils. Travaillez en ligne ou hors ligne, 
                vos données se synchronisent automatiquement.
              </p>
            </div>
          </div>
          
          <div className="row g-xl mb-xxl">
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-lg" 
                     style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-download text-primary" style={{fontSize: '32px'}}></i>
                </div>
                <h4 className="text-darkGray mb-md fw-bold">Installation instantanée</h4>
                <p className="text-mediumGray">
                  Un clic pour installer sur votre téléphone, tablette ou ordinateur. 
                  Aucun app store requis.
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-lg" 
                     style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-wifi-off text-success" style={{fontSize: '32px'}}></i>
                </div>
                <h4 className="text-darkGray mb-md fw-bold">Mode hors ligne</h4>
                <p className="text-mediumGray">
                  Créez vos factures même sans internet. Tout se synchronise 
                  automatiquement une fois reconnecté.
                </p>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="text-center">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-lg" 
                     style={{width: '80px', height: '80px'}}>
                  <i className="bi bi-lightning text-info" style={{fontSize: '32px'}}></i>
                </div>
                <h4 className="text-darkGray mb-md fw-bold">Ultra rapide</h4>
                <p className="text-mediumGray">
                  Lancement instantané et navigation fluide grâce à la technologie PWA. 
                  Comme une app native.
                </p>
              </div>
            </div>
          </div>
          
          {/* App Preview Mockup */}
          <div className="row justify-content-center mb-xxl">
            <div className="col-lg-10">
              <div className="bg-gradient-primary rounded-xl p-xxl shadow-lg" 
                   style={{background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)'}}>
                <div className="row align-items-center">
                  <div className="col-md-6 text-start">
                    <div className="text-white">
                      <h3 className="fw-bold mb-lg">📱 Télécharger l'app Splitfact</h3>
                      <div className="mb-lg">
                        <div className="d-flex align-items-center mb-md">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Fonctionne sur iOS, Android, Windows</span>
                        </div>
                        <div className="d-flex align-items-center mb-md">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Accès rapide depuis l'écran d'accueil</span>
                        </div>
                        <div className="d-flex align-items-center mb-md">
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <span>Notifications des échéances URSSAF</span>
                        </div>
                      </div>
                      
                      <div className="d-flex flex-wrap gap-2">
                        <PWAInstallPrompt className="d-inline-block" />
                        
                        <button 
                          className="btn btn-light d-flex align-items-center"
                          onClick={() => {
                            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                            if (isIOS) {
                              alert('📱 Sur Safari iOS :\n1. Appuyez sur le bouton "Partager"\n2. Sélectionnez "Ajouter à l\'écran d\'accueil"');
                            } else {
                              alert('💻 Instructions d\'installation :\n• Chrome/Edge : Icône d\'installation dans la barre d\'adresse\n• Safari : Menu Fichier → Ajouter à l\'écran d\'accueil');
                            }
                          }}
                        >
                          <i className="bi bi-info-circle me-2"></i>
                          Comment installer ?
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6 text-center">
                    <div className="position-relative d-inline-block">
                      {/* Phone mockup */}
                      <div className="bg-white rounded-4 shadow-lg p-3" 
                           style={{width: '200px', height: '400px', display: 'inline-block'}}>
                        <div className="bg-primary rounded-3 h-100 d-flex flex-column justify-content-center align-items-center text-white">
                          <i className="bi bi-phone-landscape mb-3" style={{fontSize: '48px'}}></i>
                          <div className="fw-bold mb-2">Splitfact</div>
                          <div className="small opacity-75">Facturation Collaborative</div>
                          <div className="mt-4">
                            <div className="bg-white bg-opacity-20 rounded px-3 py-1 small">
                              📊 Dashboard
                            </div>
                            <div className="bg-white bg-opacity-20 rounded px-3 py-1 small mt-2">
                              🧾 Factures
                            </div>
                            <div className="bg-white bg-opacity-20 rounded px-3 py-1 small mt-2">
                              🤖 IA Fiscale
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Floating elements */}
                      <div className="position-absolute top-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
                           style={{width: '40px', height: '40px', transform: 'translate(50%, -50%)'}}>
                        <i className="bi bi-wifi small"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Support Section */}
      <motion.section
        id="support"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="splitfact-section bg-lightGray"
      >
        <div className="main-container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h2 className="display-5 fw-semibold mb-lg text-darkGray">Des questions ? On est là pour vous !</h2>
              <p className="lead text-mediumGray mb-xxl">
                Notre équipe d'experts fiscaux français spécialisés Micro-BIC vous accompagne dans votre transition vers une facturation collaborative conforme.
              </p>
              
              <div className="row g-xl">
                <div className="col-md-4">
                  <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center card-hover">
                    <i className="bi bi-chat-dots-fill text-primary mb-lg" style={{ fontSize: '40px' }}></i>
                    <h5 className="text-darkGray mb-md fw-bold">Chat en direct</h5>
                    <p className="text-mediumGray mb-lg">Réponse en moins de 2 minutes</p>
                    <Link href="#contact" className="btn btn-outline-primary btn-sm px-lg py-sm rounded-pill">
                      Démarrer le chat
                    </Link>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center card-hover">
                    <i className="bi bi-calendar-check-fill text-validationGreen mb-lg" style={{ fontSize: '40px' }}></i>
                    <h5 className="text-darkGray mb-md fw-bold">Démo personnalisée</h5>
                    <p className="text-mediumGray mb-lg">Avec un expert de votre secteur</p>
                    <Link href="#demo" className="btn btn-outline-validationGreen btn-sm px-lg py-sm rounded-pill">
                      Réserver 15min
                    </Link>
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card h-100 p-xl shadow-subtle rounded-xl border-0 text-center card-hover">
                    <i className="bi bi-book-fill text-optionalAccent mb-lg" style={{ fontSize: '40px' }}></i>
                    <h5 className="text-darkGray mb-md fw-bold">Centre d'aide</h5>
                    <p className="text-mediumGray mb-lg">Guides et tutoriels détaillés</p>
                    <Link href="#help" className="btn btn-outline-optionalAccent btn-sm px-lg py-sm rounded-pill">
                      Voir les guides
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Simplified Footer */}
      <footer className="bg-white" style={{marginTop: '0', position: 'relative', zIndex: 10, borderTop: '1px solid var(--light-gray)'}}>
        <div className="main-container py-xxl">
          <div className="row align-items-center g-xl">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-lg">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                     style={{width: '45px', height: '45px'}}>
                  <i className="bi bi-lightning-charge-fill text-white" style={{fontSize: '20px'}}></i>
                </div>
                <div>
                  <h4 className="text-darkGray mb-0 fw-bold">Splitfact</h4>
                  <small className="text-mediumGray">Facturation collaborative</small>
                </div>
              </div>
              <p className="text-mediumGray mb-lg" style={{maxWidth: '320px'}}>
                La plateforme IA qui automatise votre facturation collective d'auto-entrepreneurs et vos déclarations URSSAF Micro-BIC.
              </p>
              <div className="d-flex gap-3 mb-lg">
                <span className="badge bg-validationGreen text-white px-md py-sm rounded-pill">
                  <i className="bi bi-shield-check me-1"></i>
                  100% Conforme
                </span>
                <span className="badge bg-primary text-white px-md py-sm rounded-pill">
                  <i className="bi bi-geo-alt me-1"></i>
                  Made in France
                </span>
              </div>
            </div>
            
            <div className="col-md-3">
              <h6 className="text-darkGray mb-lg fw-bold">Liens utiles</h6>
              <ul className="list-unstyled">
                <li className="mb-md">
                  <Link href="/fonctionnalites" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                    Fonctionnalités
                  </Link>
                </li>
                <li className="mb-md">
                  <Link href="/comment-ca-marche" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                    Comment ça marche
                  </Link>
                </li>
                <li className="mb-md">
                  <Link href="#support" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                    Support
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="col-md-3">
              <h6 className="text-darkGray mb-lg fw-bold">Contact</h6>
              <ul className="list-unstyled">
                <li className="mb-md">
                  <Link href="mailto:contact@splitfact.com" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                    <i className="bi bi-envelope me-2"></i>
                    contact@splitfact.com
                  </Link>
                </li>
                <li className="mb-md">
                  <Link href="#" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                    <i className="bi bi-chat-dots me-2"></i>
                    Chat en direct
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <hr className="my-xl" />
          
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="mb-0 text-mediumGray">
                &copy; {new Date().getFullYear()} Splitfact. Tous droits réservés.
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex justify-content-md-end gap-3">
                <Link href="#privacy" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                  Confidentialité
                </Link>
                <Link href="#terms" className="text-mediumGray text-decoration-none hover-text-primary transition-all">
                  CGV
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}