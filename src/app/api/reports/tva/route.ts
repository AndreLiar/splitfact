import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
      select: { fiscalRegime: true, tvaNumber: true },
    });

    // This report is primarily for users who are subject to TVA
    if (!userProfile || !userProfile.tvaNumber) {
      return new NextResponse("This report is only available for users with a TVA number.", { status: 403 });
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        userId: userId,
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        invoiceNumber: true,
        invoiceDate: true,
        clientName: true,
        totalAmount: true,
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            tvaRate: true,
          },
        },
      },
      orderBy: { invoiceDate: "asc" },
    });

    const formattedInvoices = invoices.map(invoice => {
      let totalHT = 0;
      let totalTVA = 0;
      invoice.items.forEach(item => {
        const itemHT = item.quantity * parseFloat(item.unitPrice.toString());
        const itemTVA = itemHT * (parseFloat(item.tvaRate.toString()) / 100);
        totalHT += itemHT;
        totalTVA += itemTVA;
      });

      return {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate.toISOString().split('T')[0],
        clientName: invoice.clientName,
        totalHT: parseFloat(totalHT.toFixed(2)),
        totalTVA: parseFloat(totalTVA.toFixed(2)),
        totalTTC: parseFloat(invoice.totalAmount.toFixed(2)),
      };
    });

    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error("Error generating TVA report:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
