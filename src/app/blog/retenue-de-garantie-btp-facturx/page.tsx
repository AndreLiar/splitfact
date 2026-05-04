import type { Metadata } from 'next';
import Link from 'next/link';
import BlogArticleLayout from '../BlogArticleLayout';
import { getPost } from '@/lib/blog/posts';

const SLUG = 'retenue-de-garantie-btp-facturx';
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
        La retenue de garantie de 5% est l'un des trois pièges qui font rejeter le plus de factures BTP sur Chorus Pro,
        avec l'autoliquidation TVA et les factures de situation. Mal présentée sur le PDF ou mal encodée dans le XML
        Factur-X, elle bloque le paiement et oblige à recommencer la procédure. Cet article explique comment la
        formaliser correctement, avec un exemple chiffré et l'extrait XML conforme.
      </p>

      <h2 id="quest-ce-que-la-rg">Qu'est-ce que la retenue de garantie 5% ?</h2>

      <p>
        La <strong>retenue de garantie</strong> (RG) est une fraction du montant facturé que le maître d'ouvrage (ou le
        donneur d'ordre) conserve pendant <strong>une année après la réception des travaux</strong>, à titre de
        garantie contre d'éventuelles malfaçons. Son taux légal maximum est de <strong>5%</strong> du montant TTC du
        marché, et elle est encadrée par&nbsp;:
      </p>

      <ul>
        <li>L'article <strong>1799-1 du Code de la construction et de l'habitation</strong> pour les marchés privés</li>
        <li>Les articles <strong>R. 2191-32 à R. 2191-37 du Code de la commande publique</strong> pour les marchés publics</li>
        <li>L'article <strong>L. 111-5 du Code de la consommation</strong> pour les contrats avec un particulier</li>
      </ul>

      <h3>Quand la RG s'applique-t-elle ?</h3>

      <ul>
        <li>Marchés <strong>publics</strong> de travaux passés par l'État, une collectivité, un hôpital, etc.</li>
        <li>Marchés <strong>privés</strong> dès que le contrat le prévoit (clause CCAG, CCAP, ou marché type FFB)</li>
        <li>Sous-traitance BTP : la RG est répercutée par le donneur d'ordre sur le sous-traitant</li>
      </ul>

      <h3>Quand elle ne s'applique PAS</h3>

      <ul>
        <li>Le contrat ne la prévoit pas explicitement (sauf marchés publics où elle est de droit)</li>
        <li>L'entrepreneur a fourni une <strong>caution bancaire</strong> à première demande à la place — la RG est alors libérée immédiatement</li>
        <li>Vente de matériel sans pose</li>
      </ul>

      <h2 id="exemple-chiffre">Exemple chiffré : facture d'un maçon sous-traitant</h2>

      <p>
        Sylvie est maçon, sous-traitante d'<em>BTP Construct SAS</em> sur un chantier de rénovation d'école. Son marché
        prévoit une RG de 5% sur le TTC. Comme c'est de la sous-traitance BTP, elle facture également en autoliquidation
        TVA. Voici ce que doit afficher sa facture pour 8 000 € HT de travaux&nbsp;:
      </p>

      <div className="table-responsive my-4">
        <table className="table table-bordered" style={{ fontSize: '0.95rem' }}>
          <thead style={{ background: 'var(--gold-surface)' }}>
            <tr>
              <th style={{ width: '60%' }}>Désignation</th>
              <th>Quantité</th>
              <th>PU HT</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Reprise de murs porteurs — chantier école Pasteur</td>
              <td>1</td>
              <td>8 000,00 €</td>
              <td>8 000,00 €</td>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td colSpan={3}>
                <strong>Total HT</strong>
              </td>
              <td>
                <strong>8 000,00 €</strong>
              </td>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td colSpan={3}>TVA 20% (autoliquidation — code AE)</td>
              <td>0,00 €</td>
            </tr>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <td colSpan={3}>
                <strong>Total TTC</strong>
              </td>
              <td>
                <strong>8 000,00 €</strong>
              </td>
            </tr>
            <tr style={{ background: 'rgba(255,180,0,0.08)' }}>
              <td colSpan={3}>
                <strong>Retenue de garantie 5%</strong> (libération sous 1 an)
              </td>
              <td>
                <strong>− 400,00 €</strong>
              </td>
            </tr>
            <tr>
              <td colSpan={3}>
                <strong>Net à payer</strong>
              </td>
              <td>
                <strong>7 600,00 €</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p>
        En pied de facture, Sylvie <strong>doit</strong> ajouter la mention&nbsp;:
      </p>

      <blockquote
        style={{
          borderLeft: '3px solid var(--gold)',
          padding: '0.75rem 1rem',
          background: 'var(--gold-surface)',
          color: 'var(--text-primary)',
          fontStyle: 'italic',
          margin: '1.5rem 0',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        }}
      >
        « Retenue de garantie 5% conformément à l'article 1799-1 du CCH — libération à l'issue du délai de garantie d'un an
        à compter de la réception des travaux. »
      </blockquote>

      <p>
        Sans cette mention <strong>et</strong> sans la ligne explicite « Retenue de garantie » dans le détail des
        montants, le donneur d'ordre est en droit de payer le TTC complet — ce qui semble bénéfique mais provoque, en
        pratique, une re-facturation après réception. C'est le moment où Chorus Pro se complique.
      </p>

      <h2 id="encodage-facturx">Encodage Factur-X : le code EN 16931 à utiliser</h2>

      <p>
        Dans le XML Factur-X, la retenue de garantie n'est <strong>pas</strong> une remise commerciale ni une déduction
        de TVA. C'est une <strong>retenue sur paiement</strong> qui doit apparaître au niveau du document, pas de la
        ligne. La norme EN 16931 prévoit pour cela un élément{' '}
        <code>SpecifiedTradeAllowanceCharge</code> avec un code de raison spécifique.
      </p>

      <p>
        Le code à utiliser est <strong>BT-92 / Code 102</strong> (UNTDID 5189 — « Retention »), avec un{' '}
        <code>ChargeIndicator</code> à <code>false</code> (c'est une déduction).
      </p>

      <div className="table-responsive my-4">
        <table className="table table-bordered" style={{ fontSize: '0.9rem' }}>
          <thead style={{ background: 'var(--gold-surface)' }}>
            <tr>
              <th>Champ EN 16931</th>
              <th>Valeur pour la RG</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>ChargeIndicator</code>
              </td>
              <td>
                <code>false</code>
              </td>
              <td>C'est une déduction, pas un frais ajouté</td>
            </tr>
            <tr>
              <td>
                <code>ActualAmount</code>
              </td>
              <td>
                <code>400.00</code>
              </td>
              <td>Montant absolu en euros</td>
            </tr>
            <tr style={{ background: 'var(--gold-surface)' }}>
              <td>
                <strong>
                  <code>ReasonCode</code>
                </strong>
              </td>
              <td>
                <strong>
                  <code>102</code>
                </strong>
              </td>
              <td>
                <strong>« Retention » — UNTDID 5189</strong>
              </td>
            </tr>
            <tr>
              <td>
                <code>Reason</code>
              </td>
              <td>
                <code>"Retenue de garantie 5%"</code>
              </td>
              <td>Texte libre lisible par l'humain</td>
            </tr>
            <tr>
              <td>
                <code>CategoryTradeTax</code>
              </td>
              <td>
                <code>AE</code>
              </td>
              <td>Doit reprendre le code TVA de la facture (autoliquidation ici)</td>
            </tr>
          </tbody>
        </table>
      </div>

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
        {`<ram:SpecifiedTradeAllowanceCharge>
  <ram:ChargeIndicator>
    <udt:Indicator>false</udt:Indicator>
  </ram:ChargeIndicator>
  <ram:ActualAmount>400.00</ram:ActualAmount>
  <ram:ReasonCode>102</ram:ReasonCode>
  <ram:Reason>Retenue de garantie 5%</ram:Reason>
  <ram:CategoryTradeTax>
    <ram:TypeCode>VAT</ram:TypeCode>
    <ram:CategoryCode>AE</ram:CategoryCode>
    <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
  </ram:CategoryTradeTax>
</ram:SpecifiedTradeAllowanceCharge>`}
      </pre>

      <p>
        Le bloc s'insère <strong>au niveau du document</strong> (dans <code>ApplicableHeaderTradeSettlement</code>),
        après les lignes de facture mais avant le bloc <code>SpecifiedTradeSettlementHeaderMonetarySummation</code>. Le
        montant net à payer doit refléter la RG&nbsp;:{' '}
        <code>DuePayableAmount = TotalTTC − Retenue = 8000 − 400 = 7600</code>.
      </p>

      <h2 id="erreurs-courantes">Les 4 erreurs Chorus Pro les plus fréquentes</h2>

      <h3>Erreur 1 : encoder la RG comme une remise commerciale</h3>
      <p>
        Beaucoup d'outils de facturation traitent la RG comme une <code>ReasonCode = 95</code> (« Discount »). Chorus
        Pro accepte le XML mais le donneur d'ordre comptabilise une <em>remise définitive</em> au lieu d'une retenue
        temporaire — la RG ne sera jamais libérée. Solution&nbsp;: utiliser <code>ReasonCode = 102</code> (Retention).
      </p>

      <h3>Erreur 2 : déduire la RG du montant HT au lieu du TTC</h3>
      <p>
        La RG s'applique sur le <strong>TTC</strong> (article 1799-1 CCH), même si dans une facture en autoliquidation
        le TTC = HT. Pour une facture standard avec TVA collectée, déduire la RG du HT sous-évalue la retenue de 20%.
        Le donneur d'ordre détecte l'écart et rejette ou paie un montant erroné.
      </p>

      <h3>Erreur 3 : oublier le <code>CategoryTradeTax</code> sur le bloc RG</h3>
      <p>
        EN 16931 impose qu'une déduction au niveau document reprenne le régime TVA appliqué. Sans ce sous-élément,
        Chorus Pro lève l'erreur{' '}
        <code>« Cardinality violation : CategoryTradeTax required on TradeAllowanceCharge »</code>.
      </p>

      <h3>Erreur 4 : facturer la libération de RG sans nouveau Factur-X</h3>
      <p>
        À l'issue du délai d'un an, la libération de la RG <strong>n'est pas un avoir</strong> sur la facture d'origine
        — c'est une <strong>nouvelle facture</strong> portant uniquement la mention « Libération de la retenue de
        garantie — facture n°XXXX du JJ/MM/AAAA », au format Factur-X complet. Sans nouveau dépôt PPF, le donneur
        d'ordre ne peut pas mandater le paiement.
      </p>

      <h2 id="caution-alternative">L'alternative : la caution bancaire à première demande</h2>

      <p>
        Si vous voulez encaisser 100% du marché immédiatement, vous pouvez fournir une <strong>caution bancaire à
        première demande</strong> d'un montant équivalent à 5% du marché (article 1799-1 CCH). Le donneur d'ordre
        renonce alors à la retenue. Coût bancaire&nbsp;: typiquement <strong>0,5% à 1,5% par an</strong> du montant
        cautionné, soit pour un marché de 100 000 € une caution de 5 000 € à environ 50 €/an.
      </p>

      <p>
        En pratique, la caution est intéressante si&nbsp;:
      </p>

      <ul>
        <li>Vous avez besoin de la trésorerie maintenant (cas d'achats matériel à honorer)</li>
        <li>Le coût bancaire est inférieur au coût d'opportunité de la trésorerie immobilisée</li>
        <li>Votre banque vous l'accorde rapidement (encours, garanties)</li>
      </ul>

      <h2 id="liberation">Comment se passe la libération de la RG ?</h2>

      <p>
        Au terme du délai de garantie d'un an à compter de la réception des travaux (ou réception définitive selon le
        marché), <strong>vous devez émettre une facture distincte</strong> pour réclamer la RG. Cette facture porte&nbsp;:
      </p>

      <ul>
        <li>Référence à la facture initiale&nbsp;: <code>« Libération de la RG — facture n°2026-042 du 15/05/2026 »</code></li>
        <li>Le montant exact de la RG retenue (400 € dans notre exemple)</li>
        <li>Le même régime TVA (autoliquidation si la facture initiale l'était)</li>
        <li>Le même format Factur-X et un dépôt Chorus Pro distinct</li>
      </ul>

      <p>
        Si le donneur d'ordre tarde à libérer la RG, l'article 1799-1 du CCH prévoit qu'à défaut de notification de
        malfaçon dans les 30 jours suivant la fin du délai de garantie, la RG est <strong>réputée acquise</strong> de
        plein droit.
      </p>

      <h2 id="reforme-2026">Et avec la réforme française 2026 ?</h2>

      <p>
        La réforme e-invoicing 2026-2027 ne change pas les règles de la RG, mais elle <strong>renforce l'exigence
        d'encodage XML</strong>. À partir de septembre 2027, toutes les factures BTP devront passer par une PDP ou le
        PPF directement, et chaque déduction document devra être structurée en EN 16931. Les outils qui se contentent
        d'écrire « − 5% RG » dans une cellule de tableau PDF seront <strong>incompatibles</strong> avec la réforme.
      </p>

      <h2 id="checklist">Checklist : votre facture avec retenue est-elle conforme ?</h2>

      <ul>
        <li>☐ Mention « Retenue de garantie 5% — article 1799-1 CCH » sur le PDF</li>
        <li>☐ Ligne « Retenue de garantie » distincte dans le détail des montants</li>
        <li>☐ Calcul sur le TTC, pas sur le HT</li>
        <li>☐ Net à payer = TTC − RG (champ <code>DuePayableAmount</code>)</li>
        <li>☐ Bloc <code>SpecifiedTradeAllowanceCharge</code> au niveau document dans le XML</li>
        <li>☐ <code>ReasonCode = 102</code> (et non 95 « Discount »)</li>
        <li>☐ <code>CategoryTradeTax</code> reprend le régime TVA (souvent <code>AE</code> en sous-traitance BTP)</li>
        <li>☐ Document au format Factur-X (PDF/A-3 + XML embarqué)</li>
        <li>☐ Plan de libération communiqué (date prévisionnelle)</li>
      </ul>

      <h2 id="pour-aller-plus-loin">Pour aller plus loin</h2>

      <p>
        La retenue de garantie est rarement seule sur une facture BTP. Elle se combine systématiquement avec d'autres
        mécanismes&nbsp;:
      </p>

      <ul>
        <li>
          <Link href="/blog/tva-autoliquidation-btp">L'autoliquidation TVA</Link> en sous-traitance (le code <code>AE</code> et la mention 283-2 nonies CGI)
        </li>
        <li>Les factures de situation sur travaux longs (cumul, références au marché — article à venir)</li>
        <li>Le décompte général et définitif (DGD) à la réception</li>
      </ul>

      <p>
        InvoiceOps gère ces trois cas nativement&nbsp;: la RG est calculée automatiquement sur le TTC, l'XML Factur-X
        est encodé avec le bon <code>ReasonCode = 102</code>, et le suivi de libération de RG est géré dans votre
        tableau de bord. Plan gratuit jusqu'à 10 factures/mois pour tester sur vos chantiers en cours.
      </p>
    </BlogArticleLayout>
  );
}
