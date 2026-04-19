// Cross-Platform Fiscal Insights
// Combines data from Splitfact, Notion, and external sources for comprehensive business intelligence

import { getNotionService, NotionFiscalData } from './notion-service';
import { getWebSearchService } from './web-search-service';
import { getUniversalAI } from './ai-service';
import FiscalContextService, { UserFiscalProfile } from './fiscal-context';
import { prisma } from './prisma';

export interface CrossPlatformInsight {
  id: string;
  userId: string;
  category: 'PERFORMANCE' | 'OPTIMIZATION' | 'RISK' | 'GROWTH' | 'COMPLIANCE' | 'MARKET';
  title: string;
  description: string;
  keyFindings: string[];
  recommendations: string[];
  dataSource: {
    splitfact: boolean;
    notion: boolean;
    external: boolean;
    confidence: number;
  };
  impact: {
    financial?: {
      potential: number; // EUR
      probability: number; // 0-1
      timeframe: string; // "immediate", "short-term", "long-term"
    };
    operational?: {
      efficiency: number; // % improvement
      automation: string[];
    };
    compliance?: {
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      actions: string[];
    };
  };
  visualizations: {
    charts: ChartConfig[];
    metrics: MetricDisplay[];
  };
  createdAt: Date;
  validUntil: Date;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      color: string;
    }[];
  };
}

export interface MetricDisplay {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  comparison?: {
    period: string;
    value: number;
    change: number;
  };
}

export interface InsightGenerationContext {
  timeframe: 'week' | 'month' | 'quarter' | 'year';
  includeProjections: boolean;
  focusAreas: string[];
  comparisonPeriod?: string;
}

export class CrossPlatformInsightsEngine {
  private webSearchService = getWebSearchService();
  private aiService = getUniversalAI();

  /**
   * Generate comprehensive cross-platform insights for a user
   */
  async generateInsights(
    userId: string, 
    context: InsightGenerationContext = {
      timeframe: 'month',
      includeProjections: true,
      focusAreas: ['performance', 'optimization', 'compliance']
    }
  ): Promise<CrossPlatformInsight[]> {
    
    console.log(`[CrossPlatformInsights] Generating insights for user ${userId}`);
    
    try {
      // Step 1: Collect data from all platforms
      const dataCollection = await this.collectCrossPlatformData(userId, context.timeframe);
      
      if (!dataCollection.hasData) {
        console.log(`[CrossPlatformInsights] Insufficient data for user ${userId}`);
        return [];
      }

      // Step 2: Generate different types of insights
      const insights: CrossPlatformInsight[] = [];
      
      // Performance insights
      if (context.focusAreas.includes('performance')) {
        const performanceInsights = await this.generatePerformanceInsights(userId, dataCollection, context);
        insights.push(...performanceInsights);
      }

      // Optimization opportunities
      if (context.focusAreas.includes('optimization')) {
        const optimizationInsights = await this.generateOptimizationInsights(userId, dataCollection, context);
        insights.push(...optimizationInsights);
      }

      // Compliance insights
      if (context.focusAreas.includes('compliance')) {
        const complianceInsights = await this.generateComplianceInsights(userId, dataCollection, context);
        insights.push(...complianceInsights);
      }

      // Risk analysis
      const riskInsights = await this.generateRiskInsights(userId, dataCollection, context);
      insights.push(...riskInsights);

      // Market and growth insights
      const marketInsights = await this.generateMarketInsights(userId, dataCollection, context);
      insights.push(...marketInsights);

      console.log(`[CrossPlatformInsights] Generated ${insights.length} insights for user ${userId}`);
      return insights;

    } catch (error) {
      console.error(`[CrossPlatformInsights] Insight generation failed for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Collect data from all platforms
   */
  private async collectCrossPlatformData(userId: string, timeframe: string): Promise<{
    splitfact: UserFiscalProfile;
    notion?: NotionFiscalData;
    external: any;
    hasData: boolean;
  }> {
    
    try {
      // Get Splitfact data
      const splitfactData = await FiscalContextService.getUserFiscalProfile(userId);
      
      // Get Notion data if available
      let notionData: NotionFiscalData | undefined;
      try {
        notionData = await getNotionService(userId).syncFiscalData();
      } catch (error) {
        console.log(`[CrossPlatformInsights] No Notion data available for user ${userId}`);
      }

      // Get external market data
      const externalData = await this.collectExternalData(splitfactData, timeframe);

      return {
        splitfact: splitfactData,
        notion: notionData,
        external: externalData,
        hasData: true // We always have Splitfact data at minimum
      };

    } catch (error) {
      console.error(`[CrossPlatformInsights] Data collection failed:`, error);
      return { splitfact: {} as any, external: {}, hasData: false };
    }
  }

  /**
   * Collect external market and regulatory data
   */
  private async collectExternalData(fiscalProfile: UserFiscalProfile, timeframe: string): Promise<any> {
    try {
      // Search for relevant market trends and fiscal changes
      const marketQuery = `micro-entrepreneur tendances ${new Date().getFullYear()} secteur services`;
      const fiscalQuery = `évolution seuils TVA micro-entrepreneur ${new Date().getFullYear()}`;

      const [marketResults, fiscalResults] = await Promise.allSettled([
        this.webSearchService.searchFiscalInfo(marketQuery, { maxResults: 3 }),
        this.webSearchService.searchFiscalInfo(fiscalQuery, { maxResults: 3 })
      ]);

      return {
        marketTrends: marketResults.status === 'fulfilled' ? marketResults.value : [],
        fiscalChanges: fiscalResults.status === 'fulfilled' ? fiscalResults.value : [],
        benchmarks: await this.calculateIndustryBenchmarks(fiscalProfile)
      };

    } catch (error) {
      console.warn(`[CrossPlatformInsights] External data collection failed:`, error);
      return {};
    }
  }

  /**
   * Generate performance insights
   */
  private async generatePerformanceInsights(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight[]> {
    
    const insights: CrossPlatformInsight[] = [];
    
    try {
      // Revenue performance analysis
      const revenueInsight = await this.analyzeRevenuePerformance(userId, data, context);
      if (revenueInsight) insights.push(revenueInsight);

      // Client performance analysis
      const clientInsight = await this.analyzeClientPerformance(userId, data, context);
      if (clientInsight) insights.push(clientInsight);

      // Project efficiency analysis (if Notion data available)
      if (data.notion) {
        const projectInsight = await this.analyzeProjectEfficiency(userId, data, context);
        if (projectInsight) insights.push(projectInsight);
      }

    } catch (error) {
      console.warn(`[CrossPlatformInsights] Performance insight generation failed:`, error);
    }

    return insights;
  }

  /**
   * Analyze revenue performance with cross-platform data
   */
  private async analyzeRevenuePerformance(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight | null> {
    
    try {
      const fiscalProfile = data.splitfact;
      const monthlyTrend = fiscalProfile.revenue.monthlyTrend || [];
      
      // Calculate performance metrics
      const currentMonthRevenue = monthlyTrend[monthlyTrend.length - 1]?.amount || 0;
      const previousMonthRevenue = monthlyTrend[monthlyTrend.length - 2]?.amount || 0;
      const growthRate = previousMonthRevenue > 0 ? 
        ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

      // AI analysis for insights
      const analysisPrompt = `Analyse cette performance de revenus pour un micro-entrepreneur:

DONNÉES:
- CA total: ${fiscalProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Croissance mensuelle: ${growthRate.toFixed(1)}%
- Progression seuils: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%
- Clients actifs: ${fiscalProfile.clients.total}
- Délai moyen paiement: ${fiscalProfile.clients.averagePaymentDelay} jours

${data.notion ? `DONNÉES NOTION:
- Projets actifs: ${data.notion.projects.length}
- Pipeline: ${data.notion.clients.filter((c: any) => c.status === 'Negotiating').length} négociations
` : ''}

Génère des insights sur:
1. Performance vs objectifs
2. Tendances et saisonnalité  
3. Opportunités d'amélioration
4. Risques identifiés

Format: insights concis et actionnables.`;

      const aiAnalysis = await this.aiService.chat(
        'Tu es un analyste financier expert en micro-entrepreneuriat. Fournis des insights précis et actionnables.',
        analysisPrompt,
        { temperature: 0.3 }
      );

      // Create chart data
      const chartData: ChartConfig = {
        type: 'line',
        title: 'Évolution du chiffre d\'affaires',
        data: {
          labels: monthlyTrend.map((t: any) => `${t.month}/${t.year}`),
          datasets: [{
            label: 'CA mensuel',
            data: monthlyTrend.map((t: any) => t.amount),
            color: '#007bff'
          }]
        }
      };

      const metrics: MetricDisplay[] = [
        {
          label: 'CA Total',
          value: fiscalProfile.revenue.totalPaid,
          unit: '€',
          trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
          comparison: {
            period: 'vs mois précédent',
            value: previousMonthRevenue,
            change: growthRate
          }
        },
        {
          label: 'Progression Seuils',
          value: fiscalProfile.compliance.bncThresholdProgress.toFixed(1),
          unit: '%',
          trend: fiscalProfile.compliance.bncThresholdProgress > 70 ? 'up' : 'stable'
        }
      ];

      const insight: CrossPlatformInsight = {
        id: `perf_revenue_${userId}_${Date.now()}`,
        userId,
        category: 'PERFORMANCE',
        title: 'Analyse de Performance du Chiffre d\'Affaires',
        description: aiAnalysis,
        keyFindings: [
          `Croissance mensuelle: ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`,
          `Progression seuils: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%`,
          `${fiscalProfile.clients.total} clients actifs`
        ],
        recommendations: this.extractRecommendations(aiAnalysis),
        dataSource: {
          splitfact: true,
          notion: !!data.notion,
          external: true,
          confidence: 0.9
        },
        impact: {
          financial: {
            potential: Math.abs(currentMonthRevenue * 0.1), // 10% improvement potential
            probability: 0.7,
            timeframe: 'short-term'
          }
        },
        visualizations: {
          charts: [chartData],
          metrics
        },
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
      };

      return insight;

    } catch (error) {
      console.warn(`[CrossPlatformInsights] Revenue performance analysis failed:`, error);
      return null;
    }
  }

  /**
   * Generate optimization insights
   */
  private async generateOptimizationInsights(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight[]> {
    
    const insights: CrossPlatformInsight[] = [];

    try {
      // Cash flow optimization
      const cashFlowOptimization = await this.analyzeCashFlowOptimization(userId, data);
      if (cashFlowOptimization) insights.push(cashFlowOptimization);

      // Tax optimization
      const taxOptimization = await this.analyzeTaxOptimization(userId, data);
      if (taxOptimization) insights.push(taxOptimization);

    } catch (error) {
      console.warn(`[CrossPlatformInsights] Optimization insight generation failed:`, error);
    }

    return insights;
  }

  /**
   * Generate compliance insights
   */
  private async generateComplianceInsights(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight[]> {
    
    const insights: CrossPlatformInsight[] = [];

    try {
      const fiscalProfile = data.splitfact;
      
      // Threshold monitoring
      if (fiscalProfile.compliance.bncThresholdProgress > 70) {
        const thresholdInsight = await this.generateThresholdInsight(userId, data);
        if (thresholdInsight) insights.push(thresholdInsight);
      }

      // Deadline compliance
      const deadlineInsight = await this.generateDeadlineInsight(userId, data);
      if (deadlineInsight) insights.push(deadlineInsight);

    } catch (error) {
      console.warn(`[CrossPlatformInsights] Compliance insight generation failed:`, error);
    }

    return insights;
  }

  /**
   * Generate risk insights
   */
  private async generateRiskInsights(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight[]> {
    
    // Implementation for risk analysis
    return [];
  }

  /**
   * Generate market insights
   */
  private async generateMarketInsights(
    userId: string, 
    data: any, 
    context: InsightGenerationContext
  ): Promise<CrossPlatformInsight[]> {
    
    // Implementation for market analysis
    return [];
  }

  /**
   * Helper methods
   */
  private async calculateIndustryBenchmarks(fiscalProfile: UserFiscalProfile): Promise<any> {
    // Calculate industry benchmarks based on revenue and sector
    return {
      averageRevenue: 45000,
      averageGrowthRate: 15,
      averageClientCount: 8
    };
  }

  private extractRecommendations(aiAnalysis: string): string[] {
    // Extract action items from AI analysis
    const lines = aiAnalysis.split('\n');
    const recommendations = lines
      .filter(line => 
        line.includes('recommandation') || 
        line.includes('suggestion') || 
        line.includes('conseil') ||
        line.match(/^\d+\./) ||
        line.match(/^-\s/)
      )
      .map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 5);

    return recommendations.length > 0 ? recommendations : [
      'Continuer le suivi régulier des performances',
      'Optimiser la gestion de trésorerie',
      'Surveiller les seuils réglementaires'
    ];
  }

  private async analyzeCashFlowOptimization(userId: string, data: any): Promise<CrossPlatformInsight | null> {
    // Implementation for cash flow analysis
    return null;
  }

  private async analyzeTaxOptimization(userId: string, data: any): Promise<CrossPlatformInsight | null> {
    // Implementation for tax optimization analysis
    return null;
  }

  private async analyzeClientPerformance(userId: string, data: any, context: InsightGenerationContext): Promise<CrossPlatformInsight | null> {
    // Implementation for client performance analysis
    return null;
  }

  private async analyzeProjectEfficiency(userId: string, data: any, context: InsightGenerationContext): Promise<CrossPlatformInsight | null> {
    // Implementation for project efficiency analysis
    return null;
  }

  private async generateThresholdInsight(userId: string, data: any): Promise<CrossPlatformInsight | null> {
    // Implementation for threshold monitoring insight
    return null;
  }

  private async generateDeadlineInsight(userId: string, data: any): Promise<CrossPlatformInsight | null> {
    // Implementation for deadline compliance insight
    return null;
  }

  /**
   * Store insights for retrieval
   */
  async storeInsights(insights: CrossPlatformInsight[]): Promise<void> {
    // Store insights in database or cache for later retrieval
    for (const insight of insights) {
      try {
        await prisma.notification.create({
          data: {
            userId: insight.userId,
            type: 'FISCAL_INSIGHT',
            title: insight.title,
            message: insight.description,
            actionUrl: `/dashboard/insights/cross-platform/${insight.id}`,
            metadata: {
              insightId: insight.id,
              category: insight.category,
              impact: insight.impact,
              dataSource: insight.dataSource
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to store insight ${insight.id}:`, error);
      }
    }
  }
}

// Singleton instance
let crossPlatformInsightsInstance: CrossPlatformInsightsEngine | null = null;

export const getCrossPlatformInsights = (): CrossPlatformInsightsEngine => {
  if (!crossPlatformInsightsInstance) {
    crossPlatformInsightsInstance = new CrossPlatformInsightsEngine();
  }
  return crossPlatformInsightsInstance;
};

export default CrossPlatformInsightsEngine;