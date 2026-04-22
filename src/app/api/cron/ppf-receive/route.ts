import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchReceivedInvoicesFromPpf, downloadReceivedInvoiceXml } from '@/lib/piste-api';

// GET /api/cron/ppf-receive
// Polls Chorus Pro for invoices received since yesterday, stores new ones, notifies users.
// Called by Vercel cron daily at 07:00.
export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 2); // 48h window to avoid gaps

  const fromStr = fromDate.toISOString().split('T')[0];
  const toStr = toDate.toISOString().split('T')[0];

  const fetched = await fetchReceivedInvoicesFromPpf({ fromDate: fromStr, toDate: toStr });

  if (!fetched.success) {
    return NextResponse.json({ error: fetched.error }, { status: 502 });
  }

  if (fetched.invoices.length === 0) {
    return NextResponse.json({ created: 0, skipped: 0 });
  }

  // Build a SIRET → userId index for fast lookup
  const usersWithSiret = await prisma.user.findMany({
    where: { siret: { not: null } },
    select: { id: true, siret: true },
  });
  const siretToUserId = new Map(usersWithSiret.map((u) => [u.siret!, u.id]));

  // Check which cppIds already exist so we skip duplicates
  const incomingCppIds = fetched.invoices.map((i) => i.cppId).filter(Boolean);
  const existing = await prisma.receivedInvoice.findMany({
    where: { cppId: { in: incomingCppIds } },
    select: { cppId: true },
  });
  const existingSet = new Set(existing.map((e) => e.cppId));

  let created = 0;
  let skipped = 0;

  for (const inv of fetched.invoices) {
    if (!inv.cppId || existingSet.has(inv.cppId)) { skipped++; continue; }

    const userId = inv.buyerSiret ? siretToUserId.get(inv.buyerSiret) : undefined;
    if (!userId) { skipped++; continue; } // no matching user for this SIRET

    // Best-effort XML download — don't block on failure
    const rawXml = await downloadReceivedInvoiceXml(inv.cppId).catch(() => null);

    await prisma.receivedInvoice.create({
      data: {
        userId,
        cppId: inv.cppId,
        invoiceNumber: inv.invoiceNumber,
        supplierName: inv.supplierName,
        supplierSiret: inv.supplierSiret,
        buyerSiret: inv.buyerSiret,
        totalAmountTTC: inv.totalAmountTTC,
        ppfStatus: inv.ppfStatus,
        depositedAt: inv.depositedAt ? new Date(inv.depositedAt) : null,
        rawXml: rawXml ?? null,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'INVOICE_RECEIVED',
        title: `Facture reçue — ${inv.supplierName}`,
        message: `Facture n° ${inv.invoiceNumber} de ${inv.supplierName} (${inv.totalAmountTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}) disponible dans votre inbox.`,
        actionUrl: '/dashboard/received-invoices',
        metadata: { cppId: inv.cppId, supplierSiret: inv.supplierSiret },
      },
    });

    created++;
  }

  return NextResponse.json({ created, skipped, total: fetched.total });
}
