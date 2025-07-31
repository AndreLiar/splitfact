// Comprehensive Fiscal Context System for AI Assistant
// Read-only access to all user business data for intelligent context awareness

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserFiscalProfile {
  // Basic Business Info
  userId: string;
  userName: string;
  businessStartDate?: Date;
  currentYear: number;
  
  // Financial Metrics
  revenue: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    monthlyTrend: MonthlyRevenue[];
    yearOverYear: number; // Growth rate
  };
  
  // Client Analysis
  clients: {
    total: number;
    topClients: ClientInsight[];
    averagePaymentDelay: number;
    riskAnalysis: ClientRisk[];
  };
  
  // Invoice Patterns
  invoicing: {
    totalInvoices: number;
    averageInvoiceValue: number;
    paymentStatusBreakdown: PaymentStatusSummary;
    monthlyInvoiceCount: number[];
  };
  
  // Fiscal Compliance
  compliance: {
    bncThresholdProgress: number; // % of 39,100€
    bicThresholdProgress: number; // % of 91,900€
    estimatedQuarterlyPayments: number;
    nextDeadlines: FiscalDeadline[];
  };
  
  // Business Intelligence
  insights: {
    seasonalPatterns: SeasonalPattern[];
    cashFlowForecast: CashFlowPrediction[];
    businessGrowthStage: 'startup' | 'growth' | 'mature';
    riskFactors: string[];
  };
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  paid: number;
  pending: number;
  invoiceCount: number;
}

export interface ClientInsight {
  id: string;
  name: string;
  totalRevenue: number;
  invoiceCount: number;
  averagePaymentDelay: number;
  lastInvoiceDate: Date;
  riskScore: 'low' | 'medium' | 'high';
}

export interface ClientRisk {
  clientId: string;
  clientName: string;
  outstandingAmount: number;
  daysPastDue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PaymentStatusSummary {
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  overdue: { count: number; amount: number };
}

export interface FiscalDeadline {
  type: 'URSSAF' | 'TVA' | 'CFE' | 'DECLARATION';
  description: string;
  dueDate: Date;
  estimatedAmount?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SeasonalPattern {
  period: string; // Q1, Q2, etc.
  averageRevenue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CashFlowPrediction {
  month: Date;
  predictedRevenue: number;
  confidence: number; // 0-1
  basedOnInvoices: string[]; // Invoice IDs
}

export class FiscalContextService {
  
  static async getUserFiscalProfile(userId: string): Promise<UserFiscalProfile> {
    const currentYear = new Date().getFullYear();
    
    // Fetch all user data in parallel for performance
    const [user, invoices, clients, collectives] = await Promise.all([
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
      prisma.collective.findMany({
        where: { 
          members: { some: { userId } }
        },
        include: { 
          invoices: { include: { client: true } },
          members: { include: { user: true } }
        }
      })
    ]);

    if (!user) throw new Error('User not found');

    // Calculate revenue metrics
    const revenue = this.calculateRevenueMetrics(invoices, currentYear);
    
    // Analyze clients
    const clientAnalysis = this.analyzeClients(clients, invoices);
    
    // Calculate invoicing patterns
    const invoicingPatterns = this.analyzeInvoicingPatterns(invoices, currentYear);
    
    // Assess fiscal compliance
    const compliance = this.assessFiscalCompliance(revenue, currentYear);
    
    // Generate business insights
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
      insights
    };
  }

  private static calculateRevenueMetrics(invoices: any[], currentYear: number) {
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
        const today = new Date();
        return inv.paymentStatus !== 'paid' && dueDate < today;
      })
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

    // Calculate monthly trend
    const monthlyTrend = this.calculateMonthlyTrend(currentYearInvoices);
    
    // Calculate year-over-year growth
    const lastYearRevenue = invoices
      .filter(inv => new Date(inv.invoiceDate).getFullYear() === currentYear - 1)
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);
    
    const yearOverYear = lastYearRevenue > 0 ? 
      ((totalPaid - lastYearRevenue) / lastYearRevenue) * 100 : 0;

    return {
      totalPaid,
      totalPending,
      totalOverdue,
      monthlyTrend,
      yearOverYear
    };
  }

  private static calculateMonthlyTrend(invoices: any[]): MonthlyRevenue[] {
    const monthlyData: { [key: string]: MonthlyRevenue } = {};
    
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

  private static analyzeClients(clients: any[], invoices: any[]) {
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

  private static analyzeInvoicingPatterns(invoices: any[], currentYear: number) {
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

  private static assessFiscalCompliance(revenue: any, currentYear: number) {
    const BNC_THRESHOLD = 39100; // Services
    const BIC_THRESHOLD = 91900; // Goods
    
    const bncThresholdProgress = (revenue.totalPaid / BNC_THRESHOLD) * 100;
    const bicThresholdProgress = (revenue.totalPaid / BIC_THRESHOLD) * 100;
    
    // Estimate quarterly URSSAF payments (approximate)
    const estimatedQuarterlyPayments = revenue.totalPaid * 0.124; // ~12.4% for micro-entrepreneur
    
    const nextDeadlines: FiscalDeadline[] = this.calculateNextFiscalDeadlines(currentYear);

    return {
      bncThresholdProgress: Math.min(bncThresholdProgress, 100),
      bicThresholdProgress: Math.min(bicThresholdProgress, 100),
      estimatedQuarterlyPayments,
      nextDeadlines
    };
  }

  private static generateBusinessInsights(invoices: any[], clients: any[], currentYear: number) {
    const seasonalPatterns = this.analyzeSeasonalPatterns(invoices);
    const cashFlowForecast = this.generateCashFlowForecast(invoices);
    const businessGrowthStage = this.assessBusinessGrowthStage(invoices, clients);
    const riskFactors = this.identifyRiskFactors(invoices, clients);

    return {
      seasonalPatterns,
      cashFlowForecast,
      businessGrowthStage,
      riskFactors
    };
  }

  // Helper methods (simplified implementations)
  private static calculateAveragePaymentDelay(invoices: any[]): number {
    // Implementation for calculating average payment delay
    return 15; // Placeholder
  }

  private static assessClientRisk(client: any, invoices: any[]): 'low' | 'medium' | 'high' {
    // Risk assessment logic
    return 'low'; // Placeholder
  }

  private static assessClientOutstandingRisk(client: any, invoices: any[]): ClientRisk {
    // Outstanding risk calculation
    return {
      clientId: client.id,
      clientName: client.name,
      outstandingAmount: 0,
      daysPastDue: 0,
      riskLevel: 'low'
    };
  }

  private static estimateBusinessStartDate(invoices: any[]): Date | undefined {
    if (invoices.length === 0) return undefined;
    return new Date(invoices[invoices.length - 1].invoiceDate);
  }

  private static calculateNextFiscalDeadlines(year: number): FiscalDeadline[] {
    // Generate upcoming fiscal deadlines
    return [
      {
        type: 'URSSAF',
        description: 'Déclaration trimestrielle URSSAF',
        dueDate: new Date(year, 3, 30), // April 30
        priority: 'high'
      }
    ];
  }

  private static analyzeSeasonalPatterns(invoices: any[]): SeasonalPattern[] {
    // Seasonal analysis implementation
    return [];
  }

  private static generateCashFlowForecast(invoices: any[]): CashFlowPrediction[] {
    // Cash flow forecasting
    return [];
  }

  private static assessBusinessGrowthStage(invoices: any[], clients: any[]): 'startup' | 'growth' | 'mature' {
    // Growth stage assessment
    return 'growth';
  }

  private static identifyRiskFactors(invoices: any[], clients: any[]): string[] {
    // Risk factor identification
    return [];
  }
}

export default FiscalContextService;