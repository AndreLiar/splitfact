import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isPro } from "@/lib/subscription";

const getUrssafRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 0.128;
    case "PRESTATAIRE": return 0.22;
    case "LIBERAL": return 0.22;
    default: return 0;
  }
};

const getIncomeTaxRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 0.01;
    case "PRESTATAIRE": return 0.017;
    case "LIBERAL": return 0.022;
    default: return 0;
  }
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!(await isPro(session.user.id))) {
    return NextResponse.json(
      { error: 'URSSAF reports require an InvoiceOps Pro plan.', upgrade: true },
      { status: 403 }
    );
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  if (!startDateParam || !endDateParam) {
    return new NextResponse("Start date and end date are required", { status: 400 });
  }

  const startDate = new Date(startDateParam);
  const endDate = new Date(endDateParam);

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, siret: true, fiscalRegime: true, microEntrepreneurType: true },
    });

    if (!userProfile || (userProfile.fiscalRegime !== "MicroBIC" && userProfile.fiscalRegime !== "BNC")) {
      return new NextResponse("This report is only available for Micro-Entrepreneurs.", { status: 403 });
    }

    const urssafRate = getUrssafRate(userProfile.microEntrepreneurType || "");
    const incomeTaxRate = getIncomeTaxRate(userProfile.microEntrepreneurType || "");

    const userInvoices = await prisma.invoice.findMany({
      where: {
        userId: userId,
        status: 'paid',
        payments: {
          some: {
            paidAt: { gte: startDate, lte: endDate },
          },
        },
      },
      select: { totalAmount: true },
    });

    let caTotal = 0;
    userInvoices.forEach((invoice) => {
      caTotal += parseFloat(invoice.totalAmount.toString());
    });

    const cotisations = caTotal * urssafRate;
    const impotRevenu = caTotal * incomeTaxRate;
    const revenuNet = caTotal - cotisations - impotRevenu;

    const nextDeclarationDate = new Date(endDate);
    nextDeclarationDate.setMonth(nextDeclarationDate.getMonth() + 1);
    nextDeclarationDate.setDate(20);
    const message = `Déclaration à faire avant le ${nextDeclarationDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`;

    const reportData = {
      period: `${startDate.toLocaleDateString('fr-FR')} - ${endDate.toLocaleDateString('fr-FR')}`,
      user: {
        name: userProfile.name,
        siret: userProfile.siret,
        fiscalRegime: userProfile.fiscalRegime,
        microEntrepreneurType: userProfile.microEntrepreneurType,
      },
      caTotal: parseFloat(caTotal.toFixed(2)),
      tauxUrssaf: parseFloat((urssafRate * 100).toFixed(1)),
      cotisations: parseFloat(cotisations.toFixed(2)),
      tauxImpot: parseFloat((incomeTaxRate * 100).toFixed(1)),
      impotRevenu: parseFloat(impotRevenu.toFixed(2)),
      revenuNet: parseFloat(revenuNet.toFixed(2)),
      message,
      disclaimer: 'Ce rapport est une estimation et ne remplace pas votre déclaration officielle sur autoentrepreneur.urssaf.fr.',
      paidInvoicesDisclaimer: `Seules les factures payées entre le ${startDate.toLocaleDateString('fr-FR')} et le ${endDate.toLocaleDateString('fr-FR')} sont incluses.`,
    };

    const report = await prisma.urssafReport.create({
      data: {
        userId: userId,
        reportData: reportData,
        periodStartDate: startDate,
        periodEndDate: endDate,
        isAutomatic: false,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating URSSAF report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
