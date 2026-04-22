import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation - InvoiceOps',
  description: 'Conditions générales d\'utilisation de la plateforme InvoiceOps pour agences et sociétés de services françaises.',
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
                Conditions Générales d&apos;Utilisation
              </h1>

              <p className="text-muted mb-4">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>

              <div className="mb-5">
                <h2 className="h4 mb-3">1. Objet et Acceptation</h2>
                <p>
                  Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme
                  InvoiceOps, service de workflow de facturation électronique destiné aux agences et sociétés de services françaises.
                </p>
                <p>
                  L&apos;utilisation de la plateforme implique l&apos;acceptation pleine et entière des présentes CGU.
                  Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser nos services.
                </p>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">2. Description des Services</h2>

                <h3 className="h5 mb-2">2.1 Services Principaux</h3>
                <ul className="mb-3">
                  <li>Automatisation du workflow de facturation (du déclencheur à l&apos;émission)</li>
                  <li>Moteur de conformité — vérification des champs EN 16931 obligatoires</li>
                  <li>Inbox des exceptions — centralisation des factures bloquées</li>
                  <li>Génération de factures Factur-X (PDF/A-3 + XML) conformes à la réforme 2026-2027</li>
                  <li>Suivi des statuts de livraison et de paiement</li>
                  <li>Tableau de bord et piste d&apos;audit complète</li>
                </ul>

                <h3 className="h5 mb-2">2.2 Fonctionnalités Avancées</h3>
                <ul className="mb-3">
                  <li>Extraction automatique de données depuis PDF et documents</li>
                  <li>Validation SIRET via INSEE SIRENE v3</li>
                  <li>Soumission PPF / Chorus Pro via PISTE API</li>
                  <li>Notifications intelligentes avec retry automatique</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">3. Intégrations et Services Tiers</h2>

                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important :</strong> Les services tiers ont leurs propres conditions d&apos;utilisation.
                  Nous ne sommes pas responsables de leur disponibilité ou de leurs modifications.
                </div>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">4. Obligations de l&apos;Utilisateur</h2>

                <h3 className="h5 mb-2">4.1 Usage Conforme</h3>
                <p>Vous vous engagez à :</p>
                <ul className="mb-3">
                  <li>Utiliser la plateforme dans le respect de la législation</li>
                  <li>Ne pas porter atteinte aux droits de tiers</li>
                  <li>Maintenir la confidentialité de vos identifiants</li>
                  <li>Signaler toute utilisation non autorisée de votre compte</li>
                </ul>

                <h3 className="h5 mb-2">4.2 Données de Facturation</h3>
                <p>Concernant vos données de facturation, vous devez :</p>
                <ul>
                  <li>Fournir des informations exactes et complètes</li>
                  <li>Vérifier la cohérence des données avant émission</li>
                  <li>Conserver vos justificatifs selon la réglementation</li>
                  <li>Assumer la responsabilité finale de vos factures émises</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">5. IA et Extraction Automatique</h2>

                <h3 className="h5 mb-2">5.1 Nature du Service</h3>
                <p>
                  InvoiceOps utilise l&apos;IA pour extraire et structurer des données de facturation.
                  Ces extractions sont indicatives — vous devez vérifier et valider les données avant émission.
                </p>

                <h3 className="h5 mb-2">5.2 Responsabilité</h3>
                <ul className="mb-3">
                  <li>Vous devez vérifier et valider toutes les données extraites</li>
                  <li>L&apos;IA peut commettre des erreurs ou être incomplète</li>
                  <li>La conformité finale de chaque facture relève de votre responsabilité</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">6. Protection des Données</h2>
                <p>
                  Le traitement de vos données personnelles est régi par notre{' '}
                  <a href="/privacy-policy" className="text-decoration-none">Politique de Confidentialité</a>,
                  qui fait partie intégrante des présentes CGU.
                </p>

                <h3 className="h5 mb-2">6.1 Sécurité</h3>
                <ul className="mb-3">
                  <li>Chiffrement de toutes les communications</li>
                  <li>Authentification sécurisée</li>
                  <li>Sauvegardes régulières et chiffrées</li>
                  <li>Accès restreint aux données sensibles</li>
                </ul>
              </div>

              <div className="mb-5">
                <h2 className="h4 mb-3">7. Limitation de Responsabilité</h2>
                <div className="alert alert-info">
                  <p><strong>Important :</strong> InvoiceOps est un outil d&apos;automatisation du workflow de facturation.
                  Vous restez seul responsable de :</p>
                  <ul className="mb-0">
                    <li>L&apos;exactitude de vos factures émises</li>
                    <li>Le respect des obligations légales de facturation</li>
                    <li>La validation des données extraites automatiquement</li>
                    <li>La sauvegarde de vos données importantes</li>
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
                  Engagement InvoiceOps
                </h4>
                <p className="mb-0">
                  Nous nous engageons à fournir un service de qualité, respectueux de vos données
                  et conforme à la réglementation française et européenne sur la facturation électronique.
                </p>
              </div>

              <div className="text-center mt-5 pt-4 border-top">
                <p className="text-muted mb-3">
                  En utilisant InvoiceOps, vous acceptez l&apos;ensemble de ces conditions.
                </p>
                <Link href="/" className="btn btn-primary me-3">
                  <i className="bi bi-house me-2"></i>
                  Retour à l&apos;accueil
                </Link>
                <Link href="/privacy-policy" className="btn btn-outline-secondary me-3">
                  <i className="bi bi-shield-check me-2"></i>
                  Politique de Confidentialité
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
