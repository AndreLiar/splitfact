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
  period: string;
  averageRevenue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CashFlowPrediction {
  month: Date;
  predictedRevenue: number;
  confidence: number;
  basedOnInvoices: string[];
}

export interface UserFiscalProfile {
  userId: string;
  userName: string;
  businessStartDate?: Date;
  currentYear: number;
  revenue: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    monthlyTrend: MonthlyRevenue[];
    yearOverYear: number;
  };
  clients: {
    total: number;
    topClients: ClientInsight[];
    averagePaymentDelay: number;
    riskAnalysis: ClientRisk[];
  };
  invoicing: {
    totalInvoices: number;
    averageInvoiceValue: number;
    paymentStatusBreakdown: PaymentStatusSummary;
    monthlyInvoiceCount: number[];
  };
  compliance: {
    bncThresholdProgress: number;
    bicThresholdProgress: number;
    estimatedQuarterlyPayments: number;
    nextDeadlines: FiscalDeadline[];
  };
  insights: {
    seasonalPatterns: SeasonalPattern[];
    cashFlowForecast: CashFlowPrediction[];
    businessGrowthStage: 'startup' | 'growth' | 'mature';
    riskFactors: string[];
  };
}
