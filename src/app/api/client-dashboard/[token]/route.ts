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
    
    if (!token) {
      return new NextResponse("Token required", { status: 400 });
    }

    // Parse and validate the token
    const tokenData = parseClientDashboardToken(token);
    if (!tokenData) {
      return new NextResponse("Invalid token", { status: 404 });
    }

    const { clientId, collectiveId } = tokenData;

    // Fetch client dashboard data
    const collective = await prisma.collective.findFirst({
      where: {
        id: collectiveId,
        collectiveClients: {
          some: {
            clientId: clientId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        projects: {
          where: {
            clientId: clientId
          },
          include: {
            invoices: {
              select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                paymentStatus: true,
                invoiceDate: true,
                dueDate: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!collective) {
      return new NextResponse("Dashboard not found", { status: 404 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        name: true,
        email: true
      }
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // Calculate totals
    const allInvoices = collective.projects.flatMap(project => project.invoices);
    const totalRevenue = allInvoices
      .filter(invoice => invoice.paymentStatus === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);
    
    const totalPendingAmount = allInvoices
      .filter(invoice => invoice.paymentStatus === 'pending')
      .reduce((sum, invoice) => sum + Number(invoice.totalAmount), 0);

    const dashboardData = {
      client,
      collective: {
        id: collective.id,
        name: collective.name,
        description: collective.description,
        type: collective.type,
        members: collective.members
      },
      projects: collective.projects,
      totalRevenue,
      totalPendingAmount
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Error fetching client dashboard:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

