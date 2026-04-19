import prisma from '@/lib/prisma';
import { NextResponse } from "next/server";
import { parseClientDashboardToken } from "@/lib/client-dashboard-tokens";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;

    if (!token) return new NextResponse("Token required", { status: 400 });

    const tokenData = parseClientDashboardToken(token);
    if (!tokenData) return new NextResponse("Invalid token", { status: 404 });

    const { clientId } = tokenData;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { name: true, email: true },
    });

    if (!client) return new NextResponse("Client not found", { status: 404 });

    const invoices = await prisma.invoice.findMany({
      where: { clientId },
      select: {
        id: true, invoiceNumber: true, totalAmount: true,
        paymentStatus: true, invoiceDate: true, dueDate: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    const totalRevenue = invoices
      .filter(i => i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + Number(i.totalAmount), 0);

    const totalPendingAmount = invoices
      .filter(i => i.paymentStatus === 'pending')
      .reduce((sum, i) => sum + Number(i.totalAmount), 0);

    return NextResponse.json({ client, invoices, totalRevenue, totalPendingAmount });
  } catch (error) {
    console.error("Error fetching client dashboard:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
