import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server";


export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '12months';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '12months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 12, 1);
        break;
      default:
        startDate = new Date(2020, 0, 1); // Beginning of time
    }

    // Get user's collectives
    const userCollectives = await prisma.collectiveMember.findMany({
      where: { userId: session.user.id },
      include: { collective: true }
    });

    const collectiveIds = userCollectives.map(cm => cm.collectiveId);

    // If no collectives, return empty analytics
    if (collectiveIds.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        projectsCompleted: 0,
        averageProjectValue: 0,
        clientRetentionRate: 0,
        teamPerformance: [],
        monthlyRevenue: Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return {
            month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
            revenue: 0,
            projects: 0
          };
        }),
        clientMetrics: []
      });
    }

    // Get all invoices for user's collectives in the timeframe
    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          {
            OR: [
              { collectiveId: { in: collectiveIds } },
              { userId: session.user.id } // Individual invoices
            ]
          },
          { createdAt: { gte: startDate } },
          { status: { in: ['sent', 'paid'] } }
        ]
      },
      include: {
        client: true,
        project: true,
        shares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no invoices, return empty analytics with proper structure
    if (invoices.length === 0) {
      return NextResponse.json({
        totalRevenue: 0,
        projectsCompleted: 0,
        averageProjectValue: 0,
        clientRetentionRate: 0,
        teamPerformance: [],
        monthlyRevenue: Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
          return {
            month: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
            revenue: 0,
            projects: 0
          };
        }),
        clientMetrics: []
      });
    }

    // Calculate total revenue
    const totalRevenue = invoices.reduce((sum, invoice) => {
      return sum + parseFloat(invoice.totalAmount.toString());
    }, 0);

    // Calculate projects completed
    const projectsCompleted = invoices.filter(inv => inv.status === 'paid').length;

    // Calculate average project value
    const averageProjectValue = projectsCompleted > 0 ? totalRevenue / projectsCompleted : 0;

    // Calculate client retention (clients with more than 1 project)
    const clientProjectCounts = invoices.reduce((acc, invoice) => {
      acc[invoice.clientId] = (acc[invoice.clientId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalClients = Object.keys(clientProjectCounts).length;
    const returningClients = Object.values(clientProjectCounts).filter(count => count > 1).length;
    const clientRetentionRate = totalClients > 0 ? Math.round((returningClients / totalClients) * 100) : 0;

    // Team performance analysis
    const teamPerformance = await prisma.user.findMany({
      where: {
        OR: [
          { id: session.user.id },
          {
            collectives: {
              some: {
                collectiveId: { in: collectiveIds }
              }
            }
          }
        ]
      },
      include: {
        invoiceShares: {
          where: {
            invoice: {
              createdAt: { gte: startDate },
              status: { in: ['sent', 'paid'] }
            }
          },
          include: {
            invoice: true
          }
        }
      }
    });

    const teamPerformanceData = teamPerformance.map(user => {
      const totalEarned = user.invoiceShares.reduce((sum, share) => {
        return sum + parseFloat(share.calculatedAmount.toString());
      }, 0);
      
      const projectsCount = user.invoiceShares.length;
      const averageContribution = projectsCount > 0 
        ? Math.round(user.invoiceShares.reduce((sum, share) => {
            return sum + parseFloat(share.shareValue.toString());
          }, 0) / projectsCount)
        : 0;

      return {
        userId: user.id,
        userName: user.name || user.email || 'Utilisateur',
        totalEarned,
        projectsCount,
        averageContribution
      };
    }).filter(user => user.totalEarned > 0)
      .sort((a, b) => b.totalEarned - a.totalEarned);

    // Monthly revenue breakdown
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd;
      });
      
      const monthRevenue = monthInvoices.reduce((sum, invoice) => {
        return sum + parseFloat(invoice.totalAmount.toString());
      }, 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        revenue: monthRevenue,
        projects: monthInvoices.length
      });
    }

    // Client metrics
    const clientMetrics = await prisma.client.findMany({
      where: {
        invoices: {
          some: {
            createdAt: { gte: startDate },
            AND: [
              {
                OR: [
                  { collectiveId: { in: collectiveIds } },
                  { userId: session.user.id }
                ]
              }
            ]
          }
        }
      },
      include: {
        invoices: {
          where: {
            createdAt: { gte: startDate },
            AND: [
              {
                OR: [
                  { collectiveId: { in: collectiveIds } },
                  { userId: session.user.id }
                ]
              }
            ]
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const clientMetricsData = clientMetrics.map(client => {
      const totalSpent = client.invoices.reduce((sum, invoice) => {
        return sum + parseFloat(invoice.totalAmount.toString());
      }, 0);
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalSpent,
        projectsCount: client.invoices.length,
        lastProject: client.invoices[0]?.createdAt.toISOString() || ''
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      projectsCompleted,
      averageProjectValue: Math.round(averageProjectValue),
      clientRetentionRate,
      teamPerformance: teamPerformanceData,
      monthlyRevenue,
      clientMetrics: clientMetricsData
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}