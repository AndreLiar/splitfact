import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de Confidentialite - Splitfact',
  description: 'Politique de confidentialite et protection des donnees personnelles de Splitfact',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body p-5">
              <h1 className="h2 mb-4 text-primary">
                <i className="bi bi-shield-check me-2"></i>
                Politique de Confidentialite
              </h1>
              
              <p className="text-muted mb-4">
                <strong>Derniere mise a jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>

              <div className="mb-5">
                <h2 className="h4 mb-3">1. Introduction</h2>
                <p>
                  Splitfact s&apos;engage a proteger votre vie privee et vos donnees personnelles. Cette politique de confidentialite 
                  explique comment nous collectons, utilisons, stockons et protegeons vos informations lorsque vous utilisez 
                  notre plateforme de gestion fiscale pour micro-entrepreneurs.
                </p>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">2. Donnees Collectees</h2>
                
                <h3 className="h5 mb-2">2.1 Donnees d&apos;Inscription</h3>
                <ul className="mb-3">
                  <li>Nom et prenom</li>
                  <li>Adresse email</li>
                  <li>Mot de passe (chiffre)</li>
                  <li>Informations professionnelles (SIRET, statut juridique, adresse)</li>
                </ul>

                <h3 className="h5 mb-2">2.2 Donnees Fiscales</h3>
                <ul className="mb-3">
                  <li>Factures et documents comptables</li>
                  <li>Informations clients</li>
                  <li>Donnees de revenus et depenses</li>
                  <li>Declarations fiscales</li>
                </ul>

                <h3 className="h5 mb-2">2.3 Integration Notion</h3>
                <ul className="mb-3">
                  <li>Token d&apos;acces Notion (chiffre)</li>
                  <li>Donnees synchronisees depuis votre workspace Notion</li>
                  <li>Metadonnees des bases de donnees connectees</li>
                  <li>Historique des synchronisations</li>
                </ul>

                <h3 className="h5 mb-2">2.4 Donnees Techniques</h3>
                <ul>
                  <li>Adresse IP et donnees de connexion</li>
                  <li>Donnees d&apos;utilisation et de navigation</li>
                  <li>Journaux d&apos;audit et de securite</li>
                  <li>Cookies et technologies similaires</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">3. Utilisation des Donnees</h2>
                <p>Nous utilisons vos donnees pour :</p>
                <ul>
                  <li><strong>Fourniture du service :</strong> Gestion comptable, generation de rapports, conseils fiscaux</li>
                  <li><strong>Assistant IA :</strong> Analyse de vos donnees pour fournir des conseils personnalises</li>
                  <li><strong>Integrations :</strong> Synchronisation avec Notion et autres services tiers</li>
                  <li><strong>Amelioration :</strong> Analyse d&apos;usage pour ameliorer la plateforme</li>
                  <li><strong>Communication :</strong> Notifications importantes et support client</li>
                  <li><strong>Securite :</strong> Detection de fraudes et protection des comptes</li>
                  <li><strong>Conformite :</strong> Respect des obligations legales et fiscales</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">4. Integration Notion - Traitement Specifique</h2>
                
                <h3 className="h5 mb-2">4.1 Donnees Notion Collectees</h3>
                <p>Lorsque vous connectez votre workspace Notion :</p>
                <ul className="mb-3">
                  <li>Nous accedons uniquement aux bases de donnees que vous autorisez</li>
                  <li>Les donnees sont synchronisees de maniere bidirectionnelle</li>
                  <li>Nous stockons un token d&apos;acces chiffre pour maintenir la connexion</li>
                  <li>Aucun acces aux autres pages ou bases de donnees de votre workspace</li>
                </ul>

                <h3 className="h5 mb-2">4.2 Securite de l&apos;Integration</h3>
                <ul className="mb-3">
                  <li>Utilisation du protocole OAuth 2.0 securise</li>
                  <li>Chiffrement end-to-end des tokens d&apos;acces</li>
                  <li>Possibilite de revoquer l&apos;acces a tout moment</li>
                  <li>Audit regulier des acces et permissions</li>
                </ul>

                <h3 className="h5 mb-2">4.3 Deconnexion</h3>
                <p>
                  Vous pouvez deconnecter Notion a tout moment depuis vos parametres. 
                  Cela revoque immediatement tous les acces et supprime les tokens stockes.
                </p>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">5. Vos Droits (RGPD)</h2>
                <p>Conformement au Reglement General sur la Protection des Donnees, vous disposez des droits suivants :</p>
                
                <div className="row">
                  <div className="col-md-6">
                    <ul>
                      <li><strong>Acces :</strong> Consulter vos donnees</li>
                      <li><strong>Rectification :</strong> Corriger vos informations</li>
                      <li><strong>Suppression :</strong> Effacer vos donnees</li>
                      <li><strong>Portabilite :</strong> Recuperer vos donnees</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul>
                      <li><strong>Opposition :</strong> Refuser certains traitements</li>
                      <li><strong>Limitation :</strong> Restreindre l&apos;usage</li>
                      <li><strong>Revocation :</strong> Retirer votre consentement</li>
                      <li><strong>Reclamation :</strong> Saisir la CNIL</li>
                    </ul>
                  </div>
                </div>

                <div className="alert alert-info mt-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Exercer vos droits :</strong> Contactez-nous a l&apos;adresse{' '}
                  <a href="mailto:privacy@splitfact.com" className="alert-link">privacy@splitfact.com</a>
                </div>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">6. Contact</h2>
                <p>Pour toute question concernant cette politique de confidentialite :</p>
                
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Email :</strong> privacy@splitfact.com</p>
                    <p><strong>Support :</strong> support@splitfact.com</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>DPO :</strong> dpo@splitfact.com</p>
                    <p><strong>Adresse :</strong> [Votre adresse legale]</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-5 pt-4 border-top">
                <Link href="/" className="btn btn-primary me-3">
                  <i className="bi bi-house me-2"></i>
                  Retour a l&apos;accueil
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