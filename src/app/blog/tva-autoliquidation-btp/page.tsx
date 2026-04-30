import type { Metadata } from 'next';
import Link from 'next/link';
import BlogArticleLayout from '../BlogArticleLayout';
import { getPost } from '@/lib/blog/posts';

const SLUG = 'tva-autoliquidation-btp';
const post = getPost(SLUG)!;

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: {
    title: post.title,
    description: post.description,
    url: `/blog/${SLUG}`,
    type: 'article',
    publishedTime: post.publishedAt,
    authors: [post.author.name],
    tags: post.tags,
  },
  twitter: {
    card: 'summary_large_image',
    title: post.title,
    description: post.description,
  },
};

export default function Page() {
  return (
    <BlogArticleLayout post={post}>
      <p>
        En BTP, environ <strong>une facture sur trois déposée sur Chorus Pro est rejetée</strong>, et la principale
        cause technique reste la TVA mal encodée — particulièrement dans les cas d'autoliquidation. Une virgule mal
        placée dans le XML Factur-X, et le donneur d'ordre vous renvoie la facture sans paiement. Cet article explique,
        avec un exemple concret, comment éviter ce piège.
      </p>

      <h2 id="quest-ce-que-lautoliquidation">Qu'est-ce que l'autoliquidation TVA en BTP ?</h2>

      <p>
        L'autoliquidation, c'est le mécanisme par lequel <strong>ce n'est plus le sous-traitant qui collecte la TVA, mais
        le donneur d'ordre qui la déclare et la paie directement</strong>. Le sous-traitant facture sans TVA, et précise
        sur la facture la mention obligatoire&nbsp;:
      </p>

      <blockquote
        style={{
          borderLeft: '3px solid #D4921A',
          padding: '0.5rem 1rem',
          background: '#fafafa',
          fontStyle: 'italic',
          margin: '1.5rem 0',
        }}
      >
        « Autoliquidation — TVA due par le preneur — Article 283-2 nonies du CGI »
      </blockquote>

      <p>
        Cette règle s'applique <strong>uniquement aux contrats de sous-traitance dans le BTP</strong>, c'est-à-dire
        quand vous (sous-traitant) intervenez sur un chantier pour le compte d'une entreprise principale (donneur
        d'ordre) qui a elle-même contracté avec le maître d'ouvrage. Elle est encadrée par l'article 283-2 nonies du
        Code Général des Impôts.
      </p>

      <h3>Quand l'autoliquidation s'applique-t-elle ?</h3>

      <ul>
        <li>Vous êtes sous-traitant d'une entreprise principale BTP</li>
        <li>Le contrat porte sur des travaux immobiliers (gros œuvre, second œuvre, fluides, finitions)</li>
        <li>Le donneur d'ordre est assujetti à la TVA en France</li>
        <li>Il s'agit de travaux, pas de simples ventes de matériel sans pose</li>
      </ul>

      <h3>Quand elle ne s'applique PAS</h3>

      <ul>
        <li>
          Vente de matériel <em>sans</em> pose (le sous-traitant facture la TVA normalement)
        </li>
        <li>Particulier maître d'ouvrage (pas d'autoliquidation entre pro et particulier)</li>
        <li>Donneur d'ordre étranger non-établi en France (autres règles d'extra-territorialité)</li>
        <li>Contrat direct avec le maître d'ouvrage (vous n'êtes pas sous-traitant — vous êtes l'entreprise principale)</li>
      </ul>

      <h2 id="exemple-concret">Exemple concret : facture d'un électricien sous-traitant</h2>

      <p>
        Marc est électricien micro-entrepreneur. Il intervient pour <em>BTP Construct SAS</em> (entreprise principale)
        sur un chantier de rénovation d'un collège — le maître d'ouvrage est le département. Marc facture 4 000 € HT
        à BTP Construct, qui refacturera l'ensemble du chantier au département via Chorus Pro.
      </p>

      <p>
        Voici ce que doit afficher la facture de Marc&nbsp;:
      </p>

      <div className="table-responsive my-4">
        <table className="table table-bordered" style={{ fontSize: '0.95rem' }}>
          <thead style={{ background: '#fef3e2' }}>
            <tr>
              <th style={{ width: '60%' }}>Désignation</th>
              <th>Quantité</th>
              <th>PU HT</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Installation tableau électrique TGBT — chantier collège Jean Moulin</td>
              <td>1</td>
              <td>4 000,00 €</td>
              <td>4 000,00 €</td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td colSpan={3}>
                <strong>Total HT</strong>
              </td>
              <td>
                <strong>4 000,00 €</strong>
              </td>
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td colSpan={3}>TVA 20% (autoliquidation)</td>
              <td>0,00 €</td>
            </tr>
            <tr>
              <td colSpan={3}>
                <strong>Total à payer</strong>
              </td>
              <td>
                <strong>4 000,00 €</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        En bas de la facture, Marc <strong>doit</strong> ajouter la mention&nbsp;:
      </p>

      <blockquote
        style={{
          borderLeft: '3px solid #D4921A',
          padding: '0.5rem 1rem',
          background: '#fafafa',
          fontStyle: 'italic',
          margin: '1.5rem 0',
        }}
      >
        « Autoliquidation — TVA due par le preneur — Article 283-2 nonies du CGI »
      </blockquote>

      <p>
        Sans cette mention, la facture est juridiquement non-conforme et le donneur d'ordre peut la rejeter.
      </p>

      <h2 id="encodage-facturx">Encodage Factur-X : le code EN 16931 à connaître</h2>

      <p>
        C'est ici que la majorité des erreurs de Chorus Pro se produisent. Pour qu'une facture soit acceptée par le
        Portail Public de Facturation (PPF), elle doit être au format <strong>Factur-X</strong> — c'est-à-dire un PDF/A-3
        avec un fichier XML structuré embarqué, conforme à la norme européenne EN 16931.
      </p>

      <p>
        Dans le XML, chaque ligne de facture porte un <strong>code de catégorie de TVA</strong>. Ce code est lu par
        Chorus Pro pour déterminer quel régime appliquer. Voici les codes pertinents&nbsp;:
      </p>

      <div className="table-responsive my-4">
        <table className="table table-bordered" style={{ fontSize: '0.9rem' }}>
          <thead style={{ background: '#fef3e2' }}>
            <tr>
              <th>Code EN 16931</th>
              <th>Signification</th>
              <th>Quand l'utiliser</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>S</code>
              </td>
              <td>Standard rate</td>
              <td>TVA classique 20%, 10% ou 5,5% facturée normalement</td>
            </tr>
            <tr>
              <td>
                <code>Z</code>
              </td>
              <td>Zero rate</td>
              <td>Taux zéro (export, livraisons intra-UE)</td>
            </tr>
            <tr>
              <td>
                <code>E</code>
              </td>
              <td>Exempt</td>
              <td>Opérations exonérées (assurance, santé)</td>
            </tr>
            <tr style={{ background: '#fff3cd' }}>
              <td>
                <strong>
                  <code>AE</code>
                </strong>
              </td>
              <td>
                <strong>Reverse charge / Autoliquidation</strong>
              </td>
              <td>
                <strong>BTP sous-traitance, services intra-UE</strong>
              </td>
            </tr>
            <tr>
              <td>
                <code>O</code>
              </td>
              <td>Out of scope</td>
              <td>Hors champ TVA</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        Pour la facture de Marc, chaque ligne doit avoir <code>CategoryCode = AE</code>, le taux <code>RateApplicablePercent = 0</code>,
        et un texte de motif explicite&nbsp;: <code>ExemptionReason = "Autoliquidation — Article 283-2 nonies du CGI"</code>.
      </p>

      <h3>Extrait XML correct (Factur-X EN 16931)</h3>

      <pre
        style={{
          background: '#1a1d27',
          color: '#e6e6e6',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.85rem',
          overflowX: 'auto',
        }}
      >
        {`<ram:ApplicableTradeTax>
  <ram:CalculatedAmount>0.00</ram:CalculatedAmount>
  <ram:TypeCode>VAT</ram:TypeCode>
  <ram:ExemptionReason>Autoliquidation — Article 283-2 nonies du CGI</ram:ExemptionReason>
  <ram:BasisAmount>4000.00</ram:BasisAmount>
  <ram:CategoryCode>AE</ram:CategoryCode>
  <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
</ram:ApplicableTradeTax>`}
      </pre>

      <h2 id="erreurs-courantes">Les 4 erreurs Chorus Pro les plus fréquentes</h2>

      <h3>Erreur 1 : utiliser le code <code>S</code> avec un taux à 0%</h3>
      <p>
        Si vous laissez le code <code>S</code> (standard) mais mettez un taux à 0%, Chorus Pro lève une incohérence —
        message d'erreur typique <code>« Code TVA et taux incompatibles »</code>. Solution&nbsp;: changer en code <code>AE</code>.
      </p>

      <h3>Erreur 2 : oublier le champ <code>ExemptionReason</code></h3>
      <p>
        EN 16931 impose un motif d'exonération en texte libre quand le code n'est pas <code>S</code>. Sans ce champ,
        le validateur PPF rejette la facture pour <code>« Cardinality violation : ExemptionReason required when CategoryCode != S »</code>.
      </p>

      <h3>Erreur 3 : mention légale absente du PDF</h3>
      <p>
        Le XML peut être correct, mais si le <strong>PDF visible</strong> n'affiche pas la phrase
        « Autoliquidation — TVA due par le preneur », la facture est juridiquement vicieuse. Le donneur d'ordre peut
        légalement la refuser même si Chorus Pro l'accepte. Vérifiez que cette mention est imprimée en pied de page.
      </p>

      <h3>Erreur 4 : autoliquidation avec un client particulier</h3>
      <p>
        L'autoliquidation entre un pro et un particulier <strong>n'existe pas</strong>. Si vous travaillez en
        sous-traitance pour un artisan qui rénove la maison d'un particulier, l'artisan principal facture la TVA au
        particulier et vous facturez en autoliquidation à l'artisan — donc la chaîne est&nbsp;: vous→artisan en
        autoliquidation, artisan→particulier en TVA classique.
      </p>

      <h2 id="impact-tresorerie">Impact sur la trésorerie : pas de TVA déductible</h2>

      <p>
        Côté trésorerie, l'autoliquidation présente un avantage&nbsp;: <strong>vous n'avancez pas la TVA</strong>. Vous
        encaissez le HT directement, sans délai de remboursement de la part de l'État.
      </p>

      <p>
        En contrepartie, vous ne pouvez pas non plus déduire la TVA sur les achats <em>liés exclusivement à ce
        chantier</em>. Pour un micro-entrepreneur en franchise de TVA, cela ne change rien (vous ne déduisez jamais).
        Pour une entreprise au régime réel, c'est neutre.
      </p>

      <h2 id="reforme-2026">Et avec la réforme française 2026 ?</h2>

      <p>
        À partir de septembre 2026, toutes les entreprises assujetties à la TVA en France <strong>devront recevoir</strong>{' '}
        leurs factures au format électronique structuré (Factur-X ou UBL). En septembre 2027, les PME et
        micro-entreprises devront également <strong>les émettre</strong> dans ce format, via une Plateforme de
        Dématérialisation Partenaire (PDP) ou le PPF directement.
      </p>

      <p>
        Conséquence pour le BTP&nbsp;: les factures en autoliquidation devront être encodées en EN 16931 avec le code{' '}
        <code>AE</code> dès la première soumission. Les outils de facturation traditionnels qui ne gèrent pas ce code
        seront <strong>incompatibles</strong> avec la réforme. C'est précisément le problème qu'InvoiceOps résout.
      </p>

      <h2 id="checklist">Checklist : votre facture autoliquidation est-elle conforme ?</h2>

      <ul>
        <li>☐ Mention « Autoliquidation — TVA due par le preneur » sur le PDF</li>
        <li>☐ Référence à l'article 283-2 nonies CGI</li>
        <li>☐ Total TVA = 0,00 €, total TTC = total HT</li>
        <li>☐ Code EN 16931 = <code>AE</code> sur chaque ligne dans le XML</li>
        <li>☐ Champ <code>ExemptionReason</code> renseigné dans le XML</li>
        <li>☐ SIRET du donneur d'ordre validé via INSEE SIRENE</li>
        <li>☐ Document au format Factur-X (PDF/A-3 + XML embarqué)</li>
      </ul>

      <h2 id="pour-aller-plus-loin">Pour aller plus loin</h2>

      <p>
        Cet article couvre l'autoliquidation TVA dans le cadre BTP « simple ». D'autres cas méritent une lecture
        dédiée — nous publierons prochainement des guides sur&nbsp;:
      </p>

      <ul>
        <li>
          <Link href="/blog">Les factures de situation (avancement de travaux)</Link> et leur cumul
        </li>
        <li>
          <Link href="/blog">La retenue de garantie 5%</Link> et son encodage Factur-X
        </li>
        <li>
          <Link href="/blog">Les codes de rejet Chorus Pro</Link> et comment les résoudre
        </li>
      </ul>

      <p className="text-muted small mt-4 pt-3" style={{ borderTop: '1px solid #e5e7eb' }}>
        <strong>Avertissement</strong>&nbsp;: cet article est fourni à titre informatif. Pour des cas complexes
        (autoliquidation sur travaux mixtes, sous-traitance en cascade, opérations transfrontalières), consultez
        votre expert-comptable ou le site officiel <a href="https://www.impots.gouv.fr" target="_blank" rel="noreferrer">impots.gouv.fr</a>.
      </p>
    </BlogArticleLayout>
  );
}
