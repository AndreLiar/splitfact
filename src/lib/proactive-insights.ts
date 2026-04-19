// Proactive Insights Engine for French Micro-Entrepreneur
// AI-powered system that proactively identifies opportunities, risks, and actionable recommendations

import { UserFiscalProfile } from './fiscal-context';
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { OllamaLangChainLLM } from './ollama-service';

export interface ProactiveInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'recommendation' | 'deadline' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
  dueDate?: Date;
  estimatedImpact?: {
    financial: number; // Estimated euro impact
    risk: 'reduces' | 'increases' | 'neutral';
    effort: 'low' | 'medium' | 'high';
  };
  category: 'fiscal' | 'financial' | 'clients' | 'growth' | 'compliance';
  dismissed: boolean;
  createdAt: Date;
}

export interface FiscalHealthScore {
  overall: number; // 0-100
  breakdown: {
    compliance: number;
    cashFlow: number;
    growth: number;
    efficiency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  benchmarkComparison: string;
}

export interface SmartSuggestion {
  id: string;
  context: string; // Where to show this suggestion
  title: string;
  description: string;
  confidence: number; // 0-1
  type: 'tip' | 'warning' | 'opportunity';
  actionable: boolean;
  learnMoreUrl?: string;
}

export class ProactiveInsightEngine {
  // private llm: ChatGoogleGenerativeAI; // Commented for production use
  private llm: OllamaLangChainLLM;

  constructor() {
    // Production: Use Google Gemini
    // this.llm = new ChatGoogleGenerativeAI({
    //   model: "gemini-2.5-flash",
    //   apiKey: process.env.GEMINI_API_KEY,
    //   temperature: 0.2,
    // });
    
    // Development: Use local Ollama
    this.llm = new OllamaLangChainLLM('deepseek-coder-v2:latest', { temperature: 0.2 });
  }

  /**
   * Generate comprehensive proactive insights for a user
   */
  async generateInsights(fiscalProfile: UserFiscalProfile): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    // 1. Threshold alerts
    insights.push(...this.generateThresholdAlerts(fiscalProfile));

    // 2. Cash flow insights
    insights.push(...this.generateCashFlowInsights(fiscalProfile));

    // 3. Client risk insights
    insights.push(...this.generateClientInsights(fiscalProfile));

    // 4. Growth opportunities
    insights.push(...this.generateGrowthInsights(fiscalProfile));

    // 5. Fiscal optimization opportunities
    insights.push(...await this.generateFiscalOptimizations(fiscalProfile));

    // 6. Compliance deadlines
    insights.push(...this.generateComplianceDeadlines(fiscalProfile));

    // Sort by priority and relevance
    return this.prioritizeInsights(insights);
  }

  /**
   * Calculate fiscal health score
   */
  calculateFiscalHealth(fiscalProfile: UserFiscalProfile): FiscalHealthScore {
    const compliance = this.calculateComplianceScore(fiscalProfile);
    const cashFlow = this.calculateCashFlowScore(fiscalProfile);
    const growth = this.calculateGrowthScore(fiscalProfile);
    const efficiency = this.calculateEfficiencyScore(fiscalProfile);

    const overall = Math.round((compliance + cashFlow + growth + efficiency) / 4);

    return {
      overall,
      breakdown: { compliance, cashFlow, growth, efficiency },
      trend: this.determineTrend(fiscalProfile),
      benchmarkComparison: this.generateBenchmarkComparison(overall)
    };
  }

  /**
   * Generate contextual smart suggestions
   */
  async generateSmartSuggestions(
    context: string,
    fiscalProfile: UserFiscalProfile
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    switch (context) {
      case 'create-invoice':
        suggestions.push(...this.getInvoiceCreationSuggestions(fiscalProfile));
        break;
      case 'dashboard':
        suggestions.push(...this.getDashboardSuggestions(fiscalProfile));
        break;
      case 'clients':
        suggestions.push(...this.getClientManagementSuggestions(fiscalProfile));
        break;
      case 'assistant':
        suggestions.push(...await this.getAIAssistantSuggestions(fiscalProfile));
        break;
    }

    return suggestions.filter(s => s.confidence > 0.7);
  }

  // Private methods for generating specific insights

  private generateThresholdAlerts(fiscalProfile: UserFiscalProfile): ProactiveInsight[] {
    const alerts: ProactiveInsight[] = [];

    // BNC threshold alert
    if (fiscalProfile.compliance.bncThresholdProgress > 80) {
      alerts.push({
        id: `threshold-bnc-${Date.now()}`,
        type: 'alert',
        priority: fiscalProfile.compliance.bncThresholdProgress > 95 ? 'critical' : 'high',
        title: '🚨 Seuil BNC bientôt atteint',
        description: `Vous avez utilisé ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}% du seuil BNC (39 100€). Au-delà, vous devrez passer au régime réel et facturer la TVA.`,
        actionable: true,
        actionText: 'Voir les options',
        actionUrl: '/dashboard/assistant',
        category: 'compliance',
        dismissed: false,
        createdAt: new Date(),
        estimatedImpact: {
          financial: -5000, // Estimated additional costs
          risk: 'increases',
          effort: 'high'
        }
      });
    }

    // Revenue growth alert
    if (fiscalProfile.revenue.yearOverYear < -10) {
      alerts.push({
        id: `revenue-decline-${Date.now()}`,
        type: 'alert',
        priority: 'high',
        title: '📉 Baisse de chiffre d\'affaires',
        description: `Votre CA a diminué de ${Math.abs(fiscalProfile.revenue.yearOverYear).toFixed(1)}% par rapport à l'année dernière. Actions recommandées pour relancer l'activité.`,
        actionable: true,
        actionText: 'Stratégies de relance',
        actionUrl: '/dashboard/assistant',
        category: 'growth',
        dismissed: false,
        createdAt: new Date()
      });
    }

    return alerts;
  }

  private generateCashFlowInsights(fiscalProfile: UserFiscalProfile): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    if (fiscalProfile.revenue.totalOverdue > 5000) {
      insights.push({
        id: `cashflow-overdue-${Date.now()}`,
        type: 'recommendation',
        priority: 'high',
        title: '💸 Factures en retard importantes',
        description: `${fiscalProfile.revenue.totalOverdue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de factures en retard. Améliorez votre trésorerie avec des relances automatisées.`,
        actionable: true,
        actionText: 'Gérer les impayés',
        actionUrl: '/dashboard/invoices?filter=overdue',
        category: 'financial',
        dismissed: false,
        createdAt: new Date(),
        estimatedImpact: {
          financial: fiscalProfile.revenue.totalOverdue * 0.8,
          risk: 'reduces',
          effort: 'medium'
        }
      });
    }

    if (fiscalProfile.clients.averagePaymentDelay > 45) {
      insights.push({
        id: `payment-delay-${Date.now()}`,
        type: 'optimization',
        priority: 'medium',
        title: '⏰ Délais de paiement trop longs',
        description: `Délai moyen de ${fiscalProfile.clients.averagePaymentDelay.toFixed(0)} jours. Optimisez vos conditions de paiement pour améliorer votre trésorerie.`,
        actionable: true,
        actionText: 'Optimiser les paiements',
        actionUrl: '/dashboard/assistant',
        category: 'financial',
        dismissed: false,
        createdAt: new Date()
      });
    }

    return insights;
  }

  private generateClientInsights(fiscalProfile: UserFiscalProfile): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    // Client concentration risk
    if (fiscalProfile.clients.topClients.length > 0) {
      const topClientRevenue = fiscalProfile.clients.topClients[0].totalRevenue;
      const totalRevenue = fiscalProfile.revenue.totalPaid;
      const concentration = (topClientRevenue / totalRevenue) * 100;

      if (concentration > 50) {
        insights.push({
          id: `client-concentration-${Date.now()}`,
          type: 'alert',
          priority: 'medium',
          title: '⚠️ Dépendance client élevée',
          description: `${concentration.toFixed(1)}% de votre CA provient d'un seul client. Diversifiez votre portefeuille pour réduire les risques.`,
          actionable: true,
          actionText: 'Stratégies de diversification',
          actionUrl: '/dashboard/assistant',
          category: 'clients',
          dismissed: false,
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  private generateGrowthInsights(fiscalProfile: UserFiscalProfile): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];

    if (fiscalProfile.revenue.yearOverYear > 20) {
      insights.push({
        id: `growth-opportunity-${Date.now()}`,
        type: 'opportunity',
        priority: 'medium',
        title: '🚀 Forte croissance détectée',
        description: `Croissance de ${fiscalProfile.revenue.yearOverYear.toFixed(1)}% ! Anticipez le passage vers une structure plus avantageuse (SASU/EURL).`,
        actionable: true,
        actionText: 'Explorer les options',
        actionUrl: '/dashboard/assistant',
        category: 'growth',
        dismissed: false,
        createdAt: new Date(),
        estimatedImpact: {
          financial: 10000,
          risk: 'reduces',
          effort: 'high'
        }
      });
    }

    return insights;
  }

  private async generateFiscalOptimizations(fiscalProfile: UserFiscalProfile): Promise<ProactiveInsight[]> {
    try {
      const systemPrompt = `Tu es un OPTIMISATEUR FISCAL IA spécialisé micro-entrepreneur France.

MISSION : Identifier 2-3 opportunités d'optimisation fiscale concrètes et chiffrées.

DONNÉES UTILISATEUR :
- CA encaissé: ${fiscalProfile.revenue.totalPaid}€
- Seuil BNC: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%
- Clients: ${fiscalProfile.clients.total}
- Croissance: ${fiscalProfile.revenue.yearOverYear.toFixed(1)}%

FORMAT RÉPONSE (JSON) :
[{
  "title": "🎯 Titre court actionnable",
  "description": "Description détaillée avec chiffres",
  "estimatedSavings": 1200,
  "effort": "low|medium|high",
  "priority": "high|medium|low"
}]

FOCUS sur micro-entrepreneur uniquement. Sois précis et chiffré.`;

      const response = await this.llm.invoke([
        new SystemMessage({ content: systemPrompt }) as any,
        new HumanMessage({ content: "Génère les optimisations fiscales pour ce profil." }) as any
      ]);

      const responseText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      
      try {
        const optimizations = JSON.parse(responseText);
        return optimizations.map((opt: any, index: number) => ({
          id: `optimization-${Date.now()}-${index}`,
          type: 'optimization' as const,
          priority: opt.priority || 'medium',
          title: opt.title,
          description: opt.description,
          actionable: true,
          actionText: 'En savoir plus',
          actionUrl: '/dashboard/assistant',
          category: 'fiscal' as const,
          dismissed: false,
          createdAt: new Date(),
          estimatedImpact: {
            financial: opt.estimatedSavings || 0,
            risk: 'reduces' as const,
            effort: opt.effort || 'medium'
          }
        }));
      } catch {
        return [];
      }
    } catch (error) {
      console.error('Error generating fiscal optimizations:', error);
      return [];
    }
  }

  private generateComplianceDeadlines(fiscalProfile: UserFiscalProfile): ProactiveInsight[] {
    const insights: ProactiveInsight[] = [];
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // URSSAF deadline
    const urssafDeadline = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    if (urssafDeadline > now) {
      insights.push({
        id: `deadline-urssaf-${Date.now()}`,
        type: 'deadline',
        priority: 'high',
        title: '📅 Déclaration URSSAF',
        description: `Déclaration trimestrielle URSSAF à effectuer avant le ${urssafDeadline.toLocaleDateString('fr-FR')}. Montant estimé : ${fiscalProfile.compliance.estimatedQuarterlyPayments.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}.`,
        actionable: true,
        actionText: 'Préparer la déclaration',
        actionUrl: '/dashboard/assistant',
        dueDate: urssafDeadline,
        category: 'compliance',
        dismissed: false,
        createdAt: new Date()
      });
    }

    return insights;
  }

  // Scoring methods
  private calculateComplianceScore(fiscalProfile: UserFiscalProfile): number {
    let score = 100;
    
    // Penalize approaching thresholds
    if (fiscalProfile.compliance.bncThresholdProgress > 90) score -= 30;
    else if (fiscalProfile.compliance.bncThresholdProgress > 80) score -= 15;
    
    // Penalize overdue amounts
    if (fiscalProfile.revenue.totalOverdue > 10000) score -= 25;
    else if (fiscalProfile.revenue.totalOverdue > 5000) score -= 15;
    
    return Math.max(score, 0);
  }

  private calculateCashFlowScore(fiscalProfile: UserFiscalProfile): number {
    let score = 100;
    
    const overdueRatio = fiscalProfile.revenue.totalOverdue / (fiscalProfile.revenue.totalPaid + fiscalProfile.revenue.totalPending);
    if (overdueRatio > 0.2) score -= 40;
    else if (overdueRatio > 0.1) score -= 20;
    
    if (fiscalProfile.clients.averagePaymentDelay > 60) score -= 30;
    else if (fiscalProfile.clients.averagePaymentDelay > 45) score -= 15;
    
    return Math.max(score, 0);
  }

  private calculateGrowthScore(fiscalProfile: UserFiscalProfile): number {
    const growth = fiscalProfile.revenue.yearOverYear;
    
    if (growth > 20) return 100;
    if (growth > 10) return 85;
    if (growth > 0) return 70;
    if (growth > -10) return 50;
    return 25;
  }

  private calculateEfficiencyScore(fiscalProfile: UserFiscalProfile): number {
    let score = 70; // Base score
    
    // Invoice efficiency
    const paidRatio = fiscalProfile.invoicing.paymentStatusBreakdown.paid.count / fiscalProfile.invoicing.totalInvoices;
    score += paidRatio * 30;
    
    return Math.min(score, 100);
  }

  private determineTrend(fiscalProfile: UserFiscalProfile): 'improving' | 'stable' | 'declining' {
    const growth = fiscalProfile.revenue.yearOverYear;
    if (growth > 5) return 'improving';
    if (growth < -5) return 'declining';
    return 'stable';
  }

  private generateBenchmarkComparison(score: number): string {
    if (score >= 85) return 'Excellente santé fiscale - dans le top 20% des micro-entrepreneurs';
    if (score >= 70) return 'Bonne santé fiscale - au-dessus de la moyenne';
    if (score >= 50) return 'Santé fiscale correcte - quelques améliorations possibles';
    return 'Santé fiscale à améliorer - actions recommandées';
  }

  // Context-specific suggestions
  private getInvoiceCreationSuggestions(fiscalProfile: UserFiscalProfile): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (fiscalProfile.clients.averagePaymentDelay > 30) {
      suggestions.push({
        id: 'invoice-payment-terms',
        context: 'create-invoice',
        title: 'Optimisez vos conditions de paiement',
        description: 'Réduisez vos délais moyens en proposant une remise pour paiement anticipé',
        confidence: 0.8,
        type: 'tip',
        actionable: true
      });
    }

    return suggestions;
  }

  private getDashboardSuggestions(fiscalProfile: UserFiscalProfile): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (fiscalProfile.compliance.bncThresholdProgress > 75) {
      suggestions.push({
        id: 'dashboard-threshold-warning',
        context: 'dashboard',
        title: 'Surveillance seuil BNC',
        description: 'Vous approchez du seuil. Planifiez votre stratégie avant de l\'atteindre.',
        confidence: 0.9,
        type: 'warning',
        actionable: true,
        learnMoreUrl: '/dashboard/assistant'
      });
    }

    return suggestions;
  }

  private getClientManagementSuggestions(fiscalProfile: UserFiscalProfile): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    if (fiscalProfile.clients.total < 5) {
      suggestions.push({
        id: 'client-diversification',
        context: 'clients',
        title: 'Diversifiez votre portefeuille client',
        description: 'Réduisez les risques en développant de nouveaux clients',
        confidence: 0.7,
        type: 'opportunity',
        actionable: true
      });
    }

    return suggestions;
  }

  private async getAIAssistantSuggestions(fiscalProfile: UserFiscalProfile): Promise<SmartSuggestion[]> {
    // Generate dynamic suggestions based on current context
    return [
      {
        id: 'assistant-fiscal-checkup',
        context: 'assistant',
        title: 'Bilan fiscal personnalisé',
        description: 'Demandez une analyse complète de votre situation fiscale actuelle',
        confidence: 0.9,
        type: 'tip',
        actionable: true
      }
    ];
  }

  private prioritizeInsights(insights: ProactiveInsight[]): ProactiveInsight[] {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    
    return insights.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by estimated impact
      const aImpact = a.estimatedImpact?.financial || 0;
      const bImpact = b.estimatedImpact?.financial || 0;
      return Math.abs(bImpact) - Math.abs(aImpact);
    });
  }
}

// Singleton instance
let insightEngineInstance: ProactiveInsightEngine | null = null;

export const getInsightEngine = (): ProactiveInsightEngine => {
  if (!insightEngineInstance) {
    insightEngineInstance = new ProactiveInsightEngine();
  }
  return insightEngineInstance;
};

export default ProactiveInsightEngine;