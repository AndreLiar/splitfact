import prisma from '@/lib/prisma';
import type {
  UserFiscalProfile,
  MonthlyRevenue,
  ClientInsight,
  ClientRisk,
  FiscalDeadline,
  SeasonalPattern,
  CashFlowPrediction,
} from '@/types/fiscal';

export type { UserFiscalProfile } from '@/types/fiscal';

export class FiscalContextService {

  static async getUserFiscalProfile(userId: string): Promise<UserFiscalProfile> {
    const currentYear = new Date().getFullYear();

    const [user, invoices, clients] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.invoice.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.client.findMany({
        where: { userId },
        include: { invoices: true }
      }),
    ]);

    if (!user) throw new Error('User not found');

    const revenue = this.calculateRevenueMetrics(invoices, currentYear);
    const clientAnalysis = this.analyzeClients(clients, invoices);
    const invoicingPatterns = this.analyzeInvoicingPatterns(invoices, currentYear);
    const compliance = this.assessFiscalCompliance(revenue, currentYear);
    const insights = this.generateBusinessInsights(invoices, clients, currentYear);

    return {
      userId,
      userName: user.name || 'Utilisateur',
      businessStartDate: this.estimateBusinessStartDate(invoices),
      currentYear,
      revenue,
      clients: clientAnalysis,
      invoicing: invoicingPatterns,
      compliance,
      insights,
    };
  }

  private static calculateRevenueMetrics(invoices: InvoiceRecord[], currentYear: number) {
    const currentYearInvoices = invoices.filter(inv =>
      new Date(inv.invoiceDate).getFullYear() === currentYear
    );

    const totalPaid = currentYearInvoices
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

    const totalPending = currentYearInvoices
      .filter(inv => inv.paymentStatus === 'pending')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

    const totalOverdue = currentYearInvoices
      .filter(inv => {
        const dueDate = new Date(inv.dueDate || inv.invoiceDate);
        return inv.paymentStatus !== 'paid' && dueDate < new Date();
      })
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

    const monthlyTrend = this.calculateMonthlyTrend(currentYearInvoices);

    const lastYearRevenue = invoices
      .filter(inv => new Date(inv.invoiceDate).getFullYear() === currentYear - 1)
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

    const yearOverYear = lastYearRevenue > 0
      ? ((totalPaid - lastYearRevenue) / lastYearRevenue) * 100
      : 0;

    return { totalPaid, totalPending, totalOverdue, monthlyTrend, yearOverYear };
  }

  private static calculateMonthlyTrend(invoices: InvoiceRecord[]): MonthlyRevenue[] {
    const monthlyData: Record<string, MonthlyRevenue> = {};

    invoices.forEach(invoice => {
      const date = new Date(invoice.invoiceDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;

      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: date.getMonth(),
          year: date.getFullYear(),
          paid: 0,
          pending: 0,
          invoiceCount: 0
        };
      }

      const amount = parseFloat(invoice.totalAmount || '0');
      if (invoice.paymentStatus === 'paid') {
        monthlyData[key].paid += amount;
      } else {
        monthlyData[key].pending += amount;
      }
      monthlyData[key].invoiceCount++;
    });

    return Object.values(monthlyData).sort((a, b) =>
      new Date(a.year, a.month).getTime() - new Date(b.year, b.month).getTime()
    );
  }

  private static analyzeClients(clients: ClientRecord[], invoices: InvoiceRecord[]) {
    const clientInsights: ClientInsight[] = clients.map(client => {
      const clientInvoices = invoices.filter(inv => inv.clientId === client.id);

      const totalRevenue = clientInvoices
        .filter(inv => inv.paymentStatus === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

      const averagePaymentDelay = this.calculateAveragePaymentDelay(clientInvoices);
      const riskScore = this.assessClientRisk(client, clientInvoices);

      return {
        id: client.id,
        name: client.name,
        totalRevenue,
        invoiceCount: clientInvoices.length,
        averagePaymentDelay,
        lastInvoiceDate: clientInvoices[0]?.invoiceDate || new Date(),
        riskScore
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);

    const riskAnalysis: ClientRisk[] = clients
      .map(client => this.assessClientOutstandingRisk(client, invoices))
      .filter(risk => risk.outstandingAmount > 0);

    return {
      total: clients.length,
      topClients: clientInsights.slice(0, 10),
      averagePaymentDelay: clientInsights.reduce((sum, c) => sum + c.averagePaymentDelay, 0) / clientInsights.length || 0,
      riskAnalysis
    };
  }

  private static analyzeInvoicingPatterns(invoices: InvoiceRecord[], currentYear: number) {
    const currentYearInvoices = invoices.filter(inv =>
      new Date(inv.invoiceDate).getFullYear() === currentYear
    );

    const totalInvoices = currentYearInvoices.length;
    const totalAmount = currentYearInvoices.reduce((sum, inv) =>
      sum + parseFloat(inv.totalAmount || '0'), 0
    );

    const paymentStatusBreakdown = {
      paid: {
        count: currentYearInvoices.filter(inv => inv.paymentStatus === 'paid').length,
        amount: currentYearInvoices
          .filter(inv => inv.paymentStatus === 'paid')
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0)
      },
      pending: {
        count: currentYearInvoices.filter(inv => inv.paymentStatus === 'pending').length,
        amount: currentYearInvoices
          .filter(inv => inv.paymentStatus === 'pending')
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0)
      },
      overdue: {
        count: currentYearInvoices.filter(inv => {
          const dueDate = new Date(inv.dueDate || inv.invoiceDate);
          return inv.paymentStatus !== 'paid' && dueDate < new Date();
        }).length,
        amount: currentYearInvoices
          .filter(inv => {
            const dueDate = new Date(inv.dueDate || inv.invoiceDate);
            return inv.paymentStatus !== 'paid' && dueDate < new Date();
          })
          .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0)
      }
    };

    const monthlyInvoiceCount = Array.from({ length: 12 }, (_, month) =>
      currentYearInvoices.filter(inv =>
        new Date(inv.invoiceDate).getMonth() === month
      ).length
    );

    return {
      totalInvoices,
      averageInvoiceValue: totalAmount / totalInvoices || 0,
      paymentStatusBreakdown,
      monthlyInvoiceCount
    };
  }

  private static assessFiscalCompliance(revenue: ReturnType<typeof FiscalContextService.calculateRevenueMetrics>, currentYear: number) {
    const BNC_THRESHOLD = 39100; // Services
    const BIC_THRESHOLD = 91900; // Goods

    const bncThresholdProgress = (revenue.totalPaid / BNC_THRESHOLD) * 100;
    const bicThresholdProgress = (revenue.totalPaid / BIC_THRESHOLD) * 100;

    // ~12.4% for micro-entrepreneur
    const estimatedQuarterlyPayments = revenue.totalPaid * 0.124;

    const nextDeadlines: FiscalDeadline[] = this.calculateNextFiscalDeadlines(currentYear);

    return {
      bncThresholdProgress: Math.min(bncThresholdProgress, 100),
      bicThresholdProgress: Math.min(bicThresholdProgress, 100),
      estimatedQuarterlyPayments,
      nextDeadlines
    };
  }

  private static generateBusinessInsights(invoices: InvoiceRecord[], clients: ClientRecord[], currentYear: number) {
    const seasonalPatterns = this.analyzeSeasonalPatterns(invoices);
    const cashFlowForecast = this.generateCashFlowForecast(invoices);
    const businessGrowthStage = this.assessBusinessGrowthStage(invoices, clients);
    const riskFactors = this.identifyRiskFactors(invoices, clients);

    return { seasonalPatterns, cashFlowForecast, businessGrowthStage, riskFactors };
  }

  private static calculateAveragePaymentDelay(_invoices: InvoiceRecord[]): number {
    return 15;
  }

  private static assessClientRisk(_client: ClientRecord, _invoices: InvoiceRecord[]): 'low' | 'medium' | 'high' {
    return 'low';
  }

  private static assessClientOutstandingRisk(client: ClientRecord, _invoices: InvoiceRecord[]): ClientRisk {
    return {
      clientId: client.id,
      clientName: client.name,
      outstandingAmount: 0,
      daysPastDue: 0,
      riskLevel: 'low'
    };
  }

  private static estimateBusinessStartDate(invoices: InvoiceRecord[]): Date | undefined {
    if (invoices.length === 0) return undefined;
    return new Date(invoices[invoices.length - 1].invoiceDate);
  }

  private static calculateNextFiscalDeadlines(year: number): FiscalDeadline[] {
    return [
      {
        type: 'URSSAF',
        description: 'Déclaration trimestrielle URSSAF',
        dueDate: new Date(year, 3, 30),
        priority: 'high'
      }
    ];
  }

  private static analyzeSeasonalPatterns(_invoices: InvoiceRecord[]): SeasonalPattern[] {
    return [];
  }

  private static generateCashFlowForecast(_invoices: InvoiceRecord[]): CashFlowPrediction[] {
    return [];
  }

  private static assessBusinessGrowthStage(_invoices: InvoiceRecord[], _clients: ClientRecord[]): 'startup' | 'growth' | 'mature' {
    return 'growth';
  }

  private static identifyRiskFactors(_invoices: InvoiceRecord[], _clients: ClientRecord[]): string[] {
    return [];
  }
}

// Minimal local types scoped to DB shape — not exported (use @/types/fiscal for shared types)
interface InvoiceRecord {
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  paymentStatus: string | null;
  totalAmount: string | null;
  clientId: string | null;
}

interface ClientRecord {
  id: string;
  name: string;
}

export default FiscalContextService;
