import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { testPisteConnection } from '@/lib/piste-api';
import { getUserPisteCredentials } from '@/lib/user-piste-credentials';
import { isPro } from '@/lib/subscription';

export interface PpfPreflightResult {
  ready: boolean;
  blockers: string[];
  warnings: string[];
  pisteEnv: 'sandbox' | 'production' | null;
}

// GET /api/invoices/[invoiceId]/ppf-preflight
// Validates all conditions for a successful PPF submission without submitting.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { invoiceId } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
    include: { client: true, items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  // ── Plan check ────────────────────────────────────────────────────────────
  const pro = await isPro(session.user.id);
  if (!pro) {
    blockers.push('Le dépôt PPF requiert le plan InvoiceOps Pro.');
  }

  // ── Workflow status ───────────────────────────────────────────────────────
  if (invoice.workflowStatus !== 'issued') {
    blockers.push(`La facture doit être en statut "issued" (actuel : ${invoice.workflowStatus}).`);
  }

  // ── Transaction type (B2C goes to e-reporting, not PPF) ───────────────────
  if (invoice.transactionType === 'B2C') {
    blockers.push('Les transactions B2C ne sont pas soumises au PPF — elles relèvent de l\'e-reporting.');
  }

  // ── Issuer SIRET ──────────────────────────────────────────────────────────
  if (!invoice.issuerSiret || invoice.issuerSiret.length !== 14) {
    blockers.push('Le SIRET de l\'émetteur est manquant ou invalide (14 chiffres requis).');
  }

  // ── Buyer SIRET (required for B2B/B2G) ───────────────────────────────────
  const buyerSiret = invoice.clientSiret ?? invoice.client?.siret;
  if (!buyerSiret || buyerSiret.length !== 14) {
    if (invoice.transactionType === 'B2G') {
      blockers.push('Le SIRET du destinataire est obligatoire pour les transactions B2G.');
    } else {
      warnings.push('Le SIRET du client est absent — la facture peut être rejetée par Chorus Pro.');
    }
  }

  // ── B2G Chorus Pro routing fields ────────────────────────────────────────
  if (invoice.transactionType === 'B2G') {
    if (!(invoice as any).codeService) {
      blockers.push('Code Service manquant — obligatoire pour le routage Chorus Pro vers une entité publique.');
    }
    if (!(invoice as any).numeroEngagement) {
      warnings.push('N° Engagement (bon de commande) absent — peut entraîner un rejet ou un blocage de paiement par l\'entité publique.');
    }
  }

  // ── Factur-X PDF ─────────────────────────────────────────────────────────
  // null facturxPdfUrl is fine — submit-ppf regenerates in-memory when Cloudinary is not configured
  if (!invoice.facturxPdfUrl && invoice.facturxStatus !== 'generated') {
    warnings.push('Le PDF Factur-X sera régénéré à la soumission (Cloudinary non configuré).');
  }

  if (invoice.facturxStatus === 'validation_failed') {
    blockers.push('La validation du XML Factur-X a échoué. Corrigez les erreurs avant soumission.');
  }

  // ── Line items ───────────────────────────────────────────────────────────
  if (!invoice.items || invoice.items.length === 0) {
    blockers.push('La facture ne contient aucun article.');
  }

  // ── Already submitted & terminal ─────────────────────────────────────────
  const terminalStatuses = ['approuvee', 'payee'];
  if (terminalStatuses.includes(invoice.ppfStatus)) {
    blockers.push(`La facture est déjà en statut terminal PPF : ${invoice.ppfStatus}.`);
  }

  // ── PISTE credentials ────────────────────────────────────────────────────
  let pisteEnv: 'sandbox' | 'production' | null = null;
  const creds = await getUserPisteCredentials(session.user.id);

  if (!creds) {
    blockers.push('Aucun credential Chorus Pro configuré. Renseignez-les dans Paramètres → Chorus Pro.');
  } else {
    pisteEnv = creds.pisteEnv;
    if (creds.pisteEnv === 'sandbox') {
      warnings.push('Vous êtes en mode sandbox PISTE — la soumission n\'atteindra pas le PPF de production.');
    }
    // Test token acquisition without submitting
    const connTest = await testPisteConnection(creds);
    if (!connTest.ok) {
      blockers.push(`Connexion PISTE échouée : ${connTest.error}. Vérifiez vos credentials dans Paramètres.`);
    }
  }

  const result: PpfPreflightResult = {
    ready: blockers.length === 0,
    blockers,
    warnings,
    pisteEnv,
  };

  return NextResponse.json(result);
}
