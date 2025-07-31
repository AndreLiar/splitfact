import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to get URSSAF rates (simplified for example)
const getUrssafRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 0.128; // 12.8%
    case "PRESTATAIRE": return 0.22; // 22%
    case "LIBERAL": return 0.22; // 22%
    default: return 0;
  }
};

// Helper to get Income Tax rates (simplified, assuming versement libératoire)
const getIncomeTaxRate = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 0.01; // 1%
    case "PRESTATAIRE": return 0.017; // 1.7%
    case "LIBERAL": return 0.022; // 2.2%
    default: return 0;
  }
};

// Helper to get TVA thresholds (simplified, confirm actual values for current year)
const getTvaThreshold = (microEntrepreneurType: string) => {
  switch (microEntrepreneurType) {
    case "COMMERCANT": return 91900; // Commercial activities
    case "PRESTATAIRE": return 36800; // Service activities (BIC)
    case "LIBERAL": return 36800; // Liberal activities (BNC)
    default: return 0;
  }
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
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
      select: { name: true, siret: true, fiscalRegime: true, microEntrepreneurType: true, tvaNumber: true },
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
            paidAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: { totalAmount: true },
    });

    const userSubInvoices = await prisma.subInvoice.findMany({
      where: {
        receiverId: userId, // Sub-invoices where the user is the receiver
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { amount: true },
    });

    let caTotal = 0;
    userInvoices.forEach((invoice) => {
      caTotal += parseFloat(invoice.totalAmount.toString());
    });
    userSubInvoices.forEach((subInvoice) => {
      caTotal += parseFloat(subInvoice.amount.toString());
    });

    const cotisations = caTotal * urssafRate;
    const impotRevenu = caTotal * incomeTaxRate;
    const revenuNet = caTotal - cotisations - impotRevenu;

    // Determine TVA status
    const tvaThreshold = userProfile.microEntrepreneurType ? getTvaThreshold(userProfile.microEntrepreneurType) : 0;
    const tvaApplicable = caTotal >= tvaThreshold;
    let alerte = "Sous seuil de TVA";
    if (tvaApplicable) {
      alerte = "Seuil TVA dépassé";
    } else if (caTotal >= tvaThreshold * 0.8) {
      alerte = "Proche du seuil TVA";
    }

    // Determine URSSAF declaration message (simplified example)
    const nextDeclarationDate = new Date(endDate);
    nextDeclarationDate.setMonth(nextDeclarationDate.getMonth() + 1);
    nextDeclarationDate.setDate(20); // Assuming declaration by 20th of next month
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
      tvaApplicable: tvaApplicable,
      alerte: alerte,
      message: message,
      disclaimer: 'Ce rapport est une estimation et ne remplace pas votre déclaration officielle sur autoentrepreneur.urssaf.fr.',
      paidInvoicesDisclaimer: `Only invoices that were paid between ${startDate.toLocaleDateString('fr-FR')} and ${endDate.toLocaleDateString('fr-FR')} are included in this declaration. Unpaid invoices are excluded.`,
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
