import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Generales d\'Utilisation - Splitfact',
  description: 'Conditions generales d\'utilisation de la plateforme Splitfact pour micro-entrepreneurs',
};

export default function TermsOfServicePage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h1 className="h2 mb-4 text-primary">
                <i className="bi bi-file-text me-2"></i>
                Conditions Generales d&apos;Utilisation
              </h1>
              
              <p className="text-muted mb-4">
                <strong>Derniere mise a jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>

              <div className="mb-5">
                <h2 className="h4 mb-3">1. Objet et Acceptation</h2>
                <p>
                  Les presentes Conditions Generales d&apos;Utilisation (CGU) regissent l&apos;utilisation de la plateforme 
                  Splitfact, service de gestion fiscale et comptable destine aux micro-entrepreneurs francais.
                </p>
                <p>
                  L&apos;utilisation de la plateforme implique l&apos;acceptation pleine et entiere des presentes CGU. 
                  Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser nos services.
                </p>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">2. Description des Services</h2>
                
                <h3 className="h5 mb-2">2.1 Services Principaux</h3>
                <ul className="mb-3">
                  <li>Gestion des factures et devis</li>
                  <li>Suivi du chiffre d&apos;affaires et des seuils</li>
                  <li>Generation de rapports URSSAF et TVA</li>
                  <li>Assistant fiscal intelligent avec IA</li>
                  <li>Gestion des clients et projets</li>
                  <li>Tableaux de bord et analyses</li>
                </ul>

                <h3 className="h5 mb-2">2.2 Fonctionnalites Avancees</h3>
                <ul className="mb-3">
                  <li>Integration avec Notion (synchronisation bidirectionnelle)</li>
                  <li>Recherche web intelligente pour conseils fiscaux</li>
                  <li>Alertes automatiques et notifications</li>
                  <li>Rapports multi-sources et benchmarking</li>
                  <li>Multi-agents IA pour analyses complexes</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">3. Integrations et Services Tiers</h2>
                
                <h3 className="h5 mb-2">3.1 Integration Notion</h3>
                
                <h4 className="h6 mb-2">Connexion et Autorisation</h4>
                <ul className="mb-3">
                  <li>L&apos;integration Notion utilise le protocole OAuth 2.0 securise</li>
                  <li>Vous autorisez Splitfact a acceder a votre workspace Notion</li>
                  <li>L&apos;acces est limite aux bases de donnees que vous selectionnez</li>
                  <li>Vous pouvez revoquer l&apos;acces a tout moment depuis vos parametres</li>
                </ul>

                <h4 className="h6 mb-2">Synchronisation des Donnees</h4>
                <ul className="mb-3">
                  <li>Synchronisation bidirectionnelle entre Splitfact et Notion</li>
                  <li>Respect de la structure de vos bases de donnees existantes</li>
                  <li>Creation automatique de nouveaux elements si autorisee</li>
                  <li>Sauvegarde de l&apos;historique des synchronisations</li>
                </ul>

                <h4 className="h6 mb-2">Responsabilites</h4>
                <ul className="mb-3">
                  <li><strong>Splitfact :</strong> Securite des tokens, respect des permissions</li>
                  <li><strong>Utilisateur :</strong> Configuration appropriee, sauvegarde des donnees Notion</li>
                  <li><strong>Notion :</strong> Disponibilite de l&apos;API, securite de la plateforme</li>
                </ul>

                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important :</strong> Les services tiers ont leurs propres conditions d&apos;utilisation. 
                  Nous ne sommes pas responsables de leur disponibilite ou de leurs modifications.
                </div>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">4. Obligations de l&apos;Utilisateur</h2>
                
                <h3 className="h5 mb-2">4.1 Usage Conforme</h3>
                <p>Vous vous engagez a :</p>
                <ul className="mb-3">
                  <li>Utiliser la plateforme dans le respect de la legislation</li>
                  <li>Ne pas porter atteinte aux droits de tiers</li>
                  <li>Maintenir la confidentialite de vos identifiants</li>
                  <li>Signaler toute utilisation non autorisee de votre compte</li>
                </ul>

                <h3 className="h5 mb-2">4.2 Donnees Fiscales</h3>
                <p>Concernant vos donnees fiscales, vous devez :</p>
                <ul>
                  <li>Fournir des informations exactes et completes</li>
                  <li>Verifier la coherence des donnees synchronisees</li>
                  <li>Conserver vos justificatifs selon la reglementation</li>
                  <li>Assumer la responsabilite finale de vos declarations</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">5. Assistant IA et Conseils Automatises</h2>
                
                <h3 className="h5 mb-2">5.1 Nature des Conseils</h3>
                <p>
                  L&apos;assistant IA fournit des conseils bases sur vos donnees et les reglementations en vigueur. 
                  Ces conseils sont informatifs et ne constituent pas un avis juridique ou comptable personnalise.
                </p>

                <h3 className="h5 mb-2">5.2 Responsabilite</h3>
                <ul className="mb-3">
                  <li>Vous devez verifier et valider tous les conseils recus</li>
                  <li>Consulter un professionnel pour les situations complexes</li>
                  <li>L&apos;IA peut commettre des erreurs ou être incomplete</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">6. Protection des Donnees</h2>
                <p>
                  Le traitement de vos donnees personnelles est regi par notre{' '}
                  <a href="/privacy-policy" className="text-decoration-none">Politique de Confidentialite</a>, 
                  qui fait partie integrante des presentes CGU.
                </p>
                
                <h3 className="h5 mb-2">6.1 Securite</h3>
                <ul className="mb-3">
                  <li>Chiffrement de toutes les communications</li>
                  <li>Authentification securisee</li>
                  <li>Sauvegardes regulieres et chiffrees</li>
                  <li>Acces restreint aux donnees sensibles</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">7. Limitation de Responsabilite</h2>
                <div className="alert alert-info">
                  <p><strong>Important :</strong> Splitfact est un outil d&apos;aide a la gestion fiscale. 
                  Vous restez seul responsable de :</p>
                  <ul className="mb-0">
                    <li>L&apos;exactitude de vos declarations fiscales</li>
                    <li>Le respect des obligations legales</li>
                    <li>La validation des conseils automatises</li>
                    <li>La sauvegarde de vos donnees importantes</li>
                  </ul>
                </div>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">8. Contact et Support</h2>
                
                <div className="row">
                  <div className="col-md-6">
                    <h3 className="h6">Support Technique</h3>
                    <p>
                      <i className="bi bi-envelope me-2"></i>
                      <a href="mailto:support@splitfact.com">support@splitfact.com</a>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h3 className="h6">Questions Juridiques</h3>
                    <p>
                      <i className="bi bi-envelope me-2"></i>
                      <a href="mailto:legal@splitfact.com">legal@splitfact.com</a>
                    </p>
                  </div>
                </div>
              </div>

              <div className="alert alert-success">
                <h4 className="h5 mb-2">
                  <i className="bi bi-check-circle me-2"></i>
                  Engagement Splitfact
                </h4>
                <p className="mb-0">
                  Nous nous engageons a fournir un service de qualite, respectueux de vos donnees 
                  et conforme a la reglementation francaise et europeenne. Notre equipe reste 
                  disponible pour repondre a vos questions et ameliorer continuellement la plateforme.
                </p>
              </div>

              <div className="text-center mt-5 pt-4 border-top">
                <p className="text-muted mb-3">
                  En utilisant Splitfact, vous acceptez l&apos;ensemble de ces conditions.
                </p>
                <Link href="/" className="btn btn-primary me-3">
                  <i className="bi bi-house me-2"></i>
                  Retour a l&apos;accueil
                </Link>
                <Link href="/privacy-policy" className="btn btn-outline-secondary me-3">
                  <i className="bi bi-shield-check me-2"></i>
                  Politique de Confidentialite
                </Link>
                <Link href="/dashboard" className="btn btn-outline-primary">
                  <i className="bi bi-speedometer2 me-2"></i>
                  Tableau de bord
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}