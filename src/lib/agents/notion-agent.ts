// Notion Agent - Specialized AI agent for workspace integration and business intelligence
// Leverages user's Notion workspace to provide personalized fiscal insights

import { getNotionService, NotionFiscalData } from '../notion-service';
import { getUniversalAI } from '../ai-service';
import FiscalContextService, { NotionEnhancedInsights } from '../fiscal-context';

export interface NotionQuery {
  query: string;
  context: {
    userId: string;
    includeProjects?: boolean;
    includeNotes?: boolean;
    includeMetrics?: boolean;
    timeframe?: 'week' | 'month' | 'quarter' | 'year';
  };
  analysisType?: 'descriptive' | 'predictive' | 'prescriptive';
}

export interface NotionInsight {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'revenue' | 'clients' | 'compliance' | 'strategy' | 'risk';
  actionable: boolean;
  recommendations?: string[];
}

export interface NotionAnalysisResult {
  answer: string;
  confidence: number;
  insights: NotionInsight[];
  crossPlatformAnalysis: {
    revenueDiscrepancies: number;
    clientInsights: string[];
    projectOpportunities: string[];
  };
  recommendations: string[];
  metadata: {
    dataSource: 'notion' | 'splitfact' | 'hybrid';
    lastSync: Date | null;
    analysisDepth: 'shallow' | 'deep' | 'comprehensive';
    workspaceHealth: number; // 0-1 score
  };
}

export class NotionAgent {
  private aiService = getUniversalAI();

  /**
   * Perform intelligent analysis of user's Notion workspace data
   */
  async analyzeWorkspace(notionQuery: NotionQuery): Promise<NotionAnalysisResult> {
    try {
      // Step 1: Initialize Notion service and get user context
      const notionService = getNotionService(notionQuery.context.userId);
      const isInitialized = await notionService.initialize();

      if (!isInitialized) {
        return this.getNotConnectedResponse(notionQuery);
      }

      // Step 2: Get comprehensive fiscal context (including Notion data)
      const fiscalContext = await FiscalContextService.getUserFiscalProfile(notionQuery.context.userId);

      if (!fiscalContext.notion.isConnected || !fiscalContext.notion.fiscalData) {
        return this.getNotConnectedResponse(notionQuery);
      }

      // Step 3: Perform specialized Notion analysis
      const notionData = fiscalContext.notion.fiscalData;
      const enhancedInsights = fiscalContext.notion.enhancedInsights;

      // Step 4: Cross-platform analysis
      const crossPlatformAnalysis = this.performCrossPlatformAnalysis(
        fiscalContext,
        notionData,
        enhancedInsights
      );

      // Step 5: Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(
        notionQuery,
        fiscalContext,
        notionData,
        crossPlatformAnalysis
      );

      // Step 6: Extract actionable insights
      const structuredInsights = this.extractStructuredInsights(aiInsights, notionData);

      // Step 7: Generate personalized recommendations
      const recommendations = await this.generatePersonalizedRecommendations(
        notionQuery,
        fiscalContext,
        structuredInsights
      );

      return {
        answer: aiInsights,
        confidence: this.calculateAnalysisConfidence(fiscalContext, notionData),
        insights: structuredInsights,
        crossPlatformAnalysis,
        recommendations,
        metadata: {
          dataSource: 'hybrid',
          lastSync: fiscalContext.notion.lastSyncAt || null,
          analysisDepth: this.determineAnalysisDepth(notionData),
          workspaceHealth: this.assessWorkspaceHealth(notionData)
        }
      };

    } catch (error) {
      console.error('Notion workspace analysis failed:', error);
      return this.getErrorResponse(notionQuery, error);
    }
  }

  /**
   * Analyze specific Notion projects for fiscal implications
   */
  async analyzeProjects(userId: string, projectFilter?: string): Promise<{
    projectsAnalysis: Array<{
      name: string;
      expectedRevenue: number;
      riskLevel: 'low' | 'medium' | 'high';
      fiscalImpact: string;
    }>;
    overallImpact: string;
  }> {
    try {
      const fiscalContext = await FiscalContextService.getUserFiscalProfile(userId);
      
      if (!fiscalContext.notion.fiscalData) {
        return { projectsAnalysis: [], overallImpact: 'Notion non connecté' };
      }

      const clients = fiscalContext.notion.fiscalData.clients;
      const projectsAnalysis = [];

      for (const client of clients) {
        if (client.projects.length > 0) {
          for (const project of client.projects) {
            if (!projectFilter || project.toLowerCase().includes(projectFilter.toLowerCase())) {
              // Estimate project value and risk
              const expectedRevenue = this.estimateProjectRevenue(client, project);
              const riskLevel = this.assessProjectRisk(client, project);
              const fiscalImpact = this.assessFiscalImpact(expectedRevenue, fiscalContext);

              projectsAnalysis.push({
                name: `${client.name} - ${project}`,
                expectedRevenue,
                riskLevel,
                fiscalImpact
              });
            }
          }
        }
      }

      // Generate overall impact analysis
      const totalExpectedRevenue = projectsAnalysis.reduce((sum, p) => sum + p.expectedRevenue, 0);
      const overallImpact = await this.generateOverallProjectImpact(
        totalExpectedRevenue,
        fiscalContext,
        projectsAnalysis
      );

      return { projectsAnalysis, overallImpact };

    } catch (error) {
      console.error('Project analysis failed:', error);
      return { projectsAnalysis: [], overallImpact: 'Erreur dans l\'analyse des projets' };
    }
  }

  /**
   * Analyze fiscal notes for compliance and strategic insights
   */
  async analyzeFiscalNotes(userId: string): Promise<{
    urgentActions: string[];
    strategicRecommendations: string[];
    complianceAlerts: string[];
    summary: string;
  }> {
    try {
      const fiscalContext = await FiscalContextService.getUserFiscalProfile(userId);
      
      if (!fiscalContext.notion.fiscalData?.fiscalNotes) {
        return {
          urgentActions: [],
          strategicRecommendations: [],
          complianceAlerts: [],
          summary: 'Aucune note fiscale trouvée dans Notion'
        };
      }

      const notes = fiscalContext.notion.fiscalData.fiscalNotes;
      
      // Categorize notes
      const urgentNotes = notes.filter(n => n.priority === 'urgent');
      const strategicNotes = notes.filter(n => n.category === 'strategy');
      const complianceNotes = notes.filter(n => n.category === 'regulation');

      // Generate AI analysis
      const notesContext = this.buildNotesContext(notes, fiscalContext);
      const aiAnalysis = await this.aiService.chat(
        this.getNotesAnalysisPrompt(),
        notesContext,
        { temperature: 0.3 }
      );

      // Parse AI response into categories
      const analysis = this.parseNotesAnalysis(aiAnalysis);

      return {
        urgentActions: analysis.urgent || urgentNotes.map(n => n.title),
        strategicRecommendations: analysis.strategic || strategicNotes.map(n => n.title),
        complianceAlerts: analysis.compliance || complianceNotes.map(n => n.title),
        summary: analysis.summary || `${notes.length} notes analysées avec ${urgentNotes.length} actions urgentes`
      };

    } catch (error) {
      console.error('Fiscal notes analysis failed:', error);
      return {
        urgentActions: [],
        strategicRecommendations: [],
        complianceAlerts: [],
        summary: 'Erreur dans l\'analyse des notes fiscales'
      };
    }
  }

  /**
   * Generate business intelligence insights from Notion metrics
   */
  async generateBusinessIntelligence(userId: string): Promise<{
    kpiInsights: Array<{
      metric: string;
      current: number;
      trend: 'up' | 'down' | 'stable';
      insight: string;
    }>;
    predictions: string[];
    opportunities: string[];
  }> {
    try {
      const fiscalContext = await FiscalContextService.getUserFiscalProfile(userId);
      
      if (!fiscalContext.notion.fiscalData?.businessMetrics) {
        return { kpiInsights: [], predictions: [], opportunities: [] };
      }

      const metrics = fiscalContext.notion.fiscalData.businessMetrics;
      const kpiInsights = [];

      // Analyze each metric
      for (const metric of metrics) {
        const insight = await this.generateMetricInsight(metric, fiscalContext);
        kpiInsights.push({
          metric: metric.metric,
          current: metric.value,
          trend: 'stable' as const, // Would need historical data for trend analysis
          insight
        });
      }

      // Generate predictions and opportunities
      const predictions = await this.generatePredictions(metrics, fiscalContext);
      const opportunities = await this.identifyOpportunities(metrics, fiscalContext);

      return { kpiInsights, predictions, opportunities };

    } catch (error) {
      console.error('Business intelligence generation failed:', error);
      return { kpiInsights: [], predictions: [], opportunities: [] };
    }
  }

  // --- Private Helper Methods ---

  /**
   * Perform cross-platform analysis between Splitfact and Notion
   */
  private performCrossPlatformAnalysis(
    fiscalContext: any,
    notionData: NotionFiscalData,
    enhancedInsights?: NotionEnhancedInsights
  ) {
    const splitfactRevenue = fiscalContext.revenue.totalPaid;
    const notionRevenue = notionData.revenues.reduce((sum, rev) => sum + rev.amount, 0);
    const revenueDiscrepancies = Math.abs(splitfactRevenue - notionRevenue);

    // Client insights
    const clientInsights = [];
    const notionClients = new Set(notionData.clients.map(c => c.name.toLowerCase()));
    
    if (enhancedInsights?.enhancedClientAnalysis?.clientsWithNotionProjects && enhancedInsights.enhancedClientAnalysis.clientsWithNotionProjects > 0) {
      clientInsights.push(`${enhancedInsights.enhancedClientAnalysis.clientsWithNotionProjects} clients avec projets actifs`);
    }

    // Project opportunities
    const projectOpportunities = [];
    const totalProjectValue = enhancedInsights?.enhancedClientAnalysis.averageProjectValue || 0;
    
    if (totalProjectValue > 0) {
      projectOpportunities.push(`Pipeline projet: ${totalProjectValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} moyen par client`);
    }

    return {
      revenueDiscrepancies,
      clientInsights,
      projectOpportunities
    };
  }

  /**
   * Generate AI-powered insights from Notion data
   */
  private async generateAIInsights(
    query: NotionQuery,
    fiscalContext: any,
    notionData: NotionFiscalData,
    crossPlatformAnalysis: any
  ): Promise<string> {
    const contextualData = this.buildContextualData(
      fiscalContext,
      notionData,
      crossPlatformAnalysis
    );

    const systemPrompt = this.getNotionAnalysisPrompt(query.analysisType);
    const analysisQuery = `${query.query}\n\n--- DONNÉES NOTION ET CONTEXTE ---\n${contextualData}`;

    return await this.aiService.chat(systemPrompt, analysisQuery, { temperature: 0.4 });
  }

  /**
   * Build contextual data summary
   */
  private buildContextualData(
    fiscalContext: any,
    notionData: NotionFiscalData,
    crossPlatformAnalysis: any
  ): string {
    let context = '';

    // Revenue comparison
    context += `COMPARAISON REVENUS:\n`;
    context += `• Splitfact: ${fiscalContext.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• Notion: ${notionData.revenues.reduce((sum, r) => sum + r.amount, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• Écart: ${crossPlatformAnalysis.revenueDiscrepancies.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n\n`;

    // Clients and projects
    if (notionData.clients.length > 0) {
      context += `CLIENTS NOTION (${notionData.clients.length}):\n`;
      notionData.clients.slice(0, 5).forEach(client => {
        context += `• ${client.name}: ${client.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`;
        if (client.projects.length > 0) {
          context += ` (${client.projects.length} projets)`;
        }
        context += '\n';
      });
      context += '\n';
    }

    // Fiscal notes
    if (notionData.fiscalNotes.length > 0) {
      const urgentNotes = notionData.fiscalNotes.filter(n => n.priority === 'urgent');
      context += `NOTES FISCALES:\n`;
      context += `• Total: ${notionData.fiscalNotes.length} notes\n`;
      context += `• Urgentes: ${urgentNotes.length}\n`;
      if (urgentNotes.length > 0) {
        context += `• Dernières urgentes: ${urgentNotes.slice(0, 3).map(n => n.title).join(', ')}\n`;
      }
      context += '\n';
    }

    // Business metrics
    if (notionData.businessMetrics.length > 0) {
      context += `MÉTRIQUES BUSINESS:\n`;
      notionData.businessMetrics.slice(0, 5).forEach(metric => {
        context += `• ${metric.metric}: ${metric.value} ${metric.unit}\n`;
      });
    }

    return context.trim();
  }

  /**
   * Extract structured insights from AI response
   */
  private extractStructuredInsights(
    aiResponse: string,
    notionData: NotionFiscalData
  ): NotionInsight[] {
    // This would use NLP or structured parsing to extract insights
    // For now, return basic insights based on data analysis
    const insights: NotionInsight[] = [];

    // Revenue insights
    if (notionData.revenues.length > 0) {
      const totalNotionRevenue = notionData.revenues.reduce((sum, r) => sum + r.amount, 0);
      if (totalNotionRevenue > 0) {
        insights.push({
          title: 'Revenus Notion',
          description: `${totalNotionRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} de revenus tracés dans Notion`,
          impact: totalNotionRevenue > 10000 ? 'high' : 'medium',
          category: 'revenue',
          actionable: true,
          recommendations: ['Vérifier la cohérence avec Splitfact', 'S\'assurer de la déclaration complète']
        });
      }
    }

    // Client insights
    const clientsWithProjects = notionData.clients.filter(c => c.projects.length > 0);
    if (clientsWithProjects.length > 0) {
      insights.push({
        title: 'Pipeline Projets',
        description: `${clientsWithProjects.length} clients avec projets actifs`,
        impact: 'high',
        category: 'strategy',
        actionable: true,
        recommendations: ['Analyser le potentiel de revenus', 'Planifier la charge de travail']
      });
    }

    // Compliance insights
    const urgentNotes = notionData.fiscalNotes.filter(n => n.priority === 'urgent');
    if (urgentNotes.length > 0) {
      insights.push({
        title: 'Actions Urgentes',
        description: `${urgentNotes.length} rappels fiscaux urgents`,
        impact: 'high',
        category: 'compliance',
        actionable: true,
        recommendations: urgentNotes.map(n => n.title).slice(0, 3)
      });
    }

    return insights;
  }

  /**
   * Generate personalized recommendations
   */
  private async generatePersonalizedRecommendations(
    query: NotionQuery,
    fiscalContext: any,
    insights: NotionInsight[]
  ): Promise<string[]> {
    const recommendationContext = `
SITUATION FISCALE:
- CA Splitfact: ${fiscalContext.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Seuil BNC: ${fiscalContext.compliance.bncThresholdProgress.toFixed(1)}%
- Clients: ${fiscalContext.clients.total}

INSIGHTS NOTION:
${insights.map(i => `• ${i.title}: ${i.description}`).join('\n')}

Génère 3-5 recommandations personnalisées et actionnables.`;

    const recommendationsText = await this.aiService.chat(
      'Tu es un conseiller fiscal. Donne des recommandations spécifiques basées sur les données Notion et Splitfact.',
      recommendationContext,
      { temperature: 0.3 }
    );

    return recommendationsText
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[•\d.]+\s*/, '').trim())
      .filter(rec => rec.length > 10)
      .slice(0, 5);
  }

  /**
   * Calculate analysis confidence
   */
  private calculateAnalysisConfidence(fiscalContext: any, notionData: NotionFiscalData): number {
    let confidence = 0.7; // Base confidence

    // Factor in data completeness
    if (notionData.revenues.length > 0) confidence += 0.1;
    if (notionData.clients.length > 0) confidence += 0.1;
    if (notionData.fiscalNotes.length > 0) confidence += 0.05;

    // Factor in sync freshness
    if (fiscalContext.notion.lastSyncAt) {
      const daysSinceSync = (Date.now() - new Date(fiscalContext.notion.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceSync < 7) confidence += 0.05;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Determine analysis depth
   */
  private determineAnalysisDepth(notionData: NotionFiscalData): 'shallow' | 'deep' | 'comprehensive' {
    const dataPoints = notionData.revenues.length + notionData.clients.length + 
                      notionData.fiscalNotes.length + notionData.businessMetrics.length;
    
    if (dataPoints > 50) return 'comprehensive';
    if (dataPoints > 20) return 'deep';
    return 'shallow';
  }

  /**
   * Assess workspace health
   */
  private assessWorkspaceHealth(notionData: NotionFiscalData): number {
    let health = 0.5;
    
    // Data completeness
    if (notionData.revenues.length > 0) health += 0.2;
    if (notionData.clients.length > 0) health += 0.15;
    if (notionData.fiscalNotes.length > 0) health += 0.1;
    if (notionData.businessMetrics.length > 0) health += 0.05;

    return Math.min(1.0, health);
  }

  // --- Response Generators ---

  private getNotConnectedResponse(query: NotionQuery): NotionAnalysisResult {
    return {
      answer: "Votre workspace Notion n'est pas connecté. Pour bénéficier de l'analyse personnalisée, veuillez connecter votre compte Notion dans les paramètres.",
      confidence: 0,
      insights: [],
      crossPlatformAnalysis: {
        revenueDiscrepancies: 0,
        clientInsights: [],
        projectOpportunities: []
      },
      recommendations: ["Connecter votre workspace Notion", "Configurer les bases de données fiscales"],
      metadata: {
        dataSource: 'splitfact',
        lastSync: null,
        analysisDepth: 'shallow',
        workspaceHealth: 0
      }
    };
  }

  private getErrorResponse(query: NotionQuery, error: any): NotionAnalysisResult {
    return {
      answer: "Une erreur s'est produite lors de l'analyse de votre workspace Notion. Veuillez réessayer ou vérifier votre connexion.",
      confidence: 0,
      insights: [],
      crossPlatformAnalysis: {
        revenueDiscrepancies: 0,
        clientInsights: [],
        projectOpportunities: []
      },
      recommendations: ["Vérifier la connexion Notion", "Contacter le support si le problème persiste"],
      metadata: {
        dataSource: 'splitfact',
        lastSync: null,
        analysisDepth: 'shallow',
        workspaceHealth: 0
      }
    };
  }

  // --- Helper Methods ---

  private estimateProjectRevenue(client: any, project: string): number {
    // Simple estimation based on client's total revenue and project count
    return client.totalRevenue / Math.max(client.projects.length, 1);
  }

  private assessProjectRisk(client: any, project: string): 'low' | 'medium' | 'high' {
    // Simple risk assessment - would be more sophisticated in practice
    if (client.totalRevenue > 5000) return 'low';
    if (client.totalRevenue > 1000) return 'medium';
    return 'high';
  }

  private assessFiscalImpact(revenue: number, fiscalContext: any): string {
    const currentProgress = fiscalContext.compliance.bncThresholdProgress;
    const newProgress = ((fiscalContext.revenue.totalPaid + revenue) / 39100) * 100;
    
    if (newProgress > 100) {
      return 'ATTENTION: Dépassement seuil BNC possible';
    } else if (newProgress > 85) {
      return 'VIGILANCE: Proche du seuil BNC';
    }
    
    return 'Impact fiscal standard';
  }

  private async generateOverallProjectImpact(
    totalRevenue: number,
    fiscalContext: any,
    projects: any[]
  ): Promise<string> {
    const context = `Pipeline projet total: ${totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
CA actuel: ${fiscalContext.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
Seuil BNC actuel: ${fiscalContext.compliance.bncThresholdProgress.toFixed(1)}%
Nombre de projets: ${projects.length}`;

    return await this.aiService.chat(
      'Analyse l\'impact fiscal global de ce pipeline de projets en 2-3 phrases.',
      context,
      { temperature: 0.3 }
    );
  }

  private buildNotesContext(notes: any[], fiscalContext: any): string {
    return `NOTES FISCALES NOTION:
Total: ${notes.length} notes
Urgentes: ${notes.filter(n => n.priority === 'urgent').length}
Stratégiques: ${notes.filter(n => n.category === 'strategy').length}
Conformité: ${notes.filter(n => n.category === 'regulation').length}

CONTEXTE FISCAL:
CA: ${fiscalContext.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
Seuil BNC: ${fiscalContext.compliance.bncThresholdProgress.toFixed(1)}%

Analyse ces notes pour identifier les actions urgentes, recommandations stratégiques et alertes de conformité.`;
  }

  private parseNotesAnalysis(aiResponse: string): {
    urgent?: string[];
    strategic?: string[];
    compliance?: string[];
    summary?: string;
  } {
    // Simple parsing - would be more sophisticated in practice
    const lines = aiResponse.split('\n');
    const result: any = {};
    
    let currentCategory = '';
    for (const line of lines) {
      if (line.toLowerCase().includes('urgent')) currentCategory = 'urgent';
      else if (line.toLowerCase().includes('stratég')) currentCategory = 'strategic';
      else if (line.toLowerCase().includes('conformité')) currentCategory = 'compliance';
      else if (line.toLowerCase().includes('résumé')) currentCategory = 'summary';
      
      if (line.trim().startsWith('•') && currentCategory) {
        if (!result[currentCategory]) result[currentCategory] = [];
        result[currentCategory].push(line.trim().substring(1).trim());
      }
    }
    
    return result;
  }

  private async generateMetricInsight(metric: any, fiscalContext: any): Promise<string> {
    const context = `Métrique: ${metric.metric} = ${metric.value} ${metric.unit}
CA actuel: ${fiscalContext.revenue.totalPaid}€
Analyse cette métrique dans le contexte fiscal.`;

    return await this.aiService.chat(
      'Génère un insight d\'une phrase sur cette métrique business.',
      context,
      { temperature: 0.3 }
    );
  }

  private async generatePredictions(metrics: any[], fiscalContext: any): Promise<string[]> {
    if (metrics.length === 0) return [];
    
    const context = `Métriques: ${metrics.map(m => `${m.metric}=${m.value}`).join(', ')}
CA: ${fiscalContext.revenue.totalPaid}€
Génère 2-3 prédictions basées sur ces métriques.`;

    const predictions = await this.aiService.chat(
      'Génère des prédictions business courtes.',
      context,
      { temperature: 0.4 }
    );

    return predictions.split('\n').filter(line => line.trim().length > 10).slice(0, 3);
  }

  private async identifyOpportunities(metrics: any[], fiscalContext: any): Promise<string[]> {
    if (metrics.length === 0) return [];

    const context = `Métriques: ${metrics.map(m => `${m.metric}=${m.value}`).join(', ')}
CA: ${fiscalContext.revenue.totalPaid}€
Identifie 2-3 opportunités d'amélioration.`;

    const opportunities = await this.aiService.chat(
      'Identifie des opportunités d\'amélioration business.',
      context,
      { temperature: 0.4 }
    );

    return opportunities.split('\n').filter(line => line.trim().length > 10).slice(0, 3);
  }

  // --- System Prompts ---

  private getNotionAnalysisPrompt(analysisType?: string): string {
    return `Tu es un AGENT NOTION spécialisé dans l'analyse de workspace pour micro-entrepreneurs.

🔍 **Tes capacités:**
- Analyse croisée des données Notion et Splitfact
- Identification d'opportunités et de risques
- Recommandations personnalisées basées sur les projets
- Détection d'incohérences entre plateformes

📊 **Type d'analyse:** ${analysisType || 'descriptive'}

🎯 **Instructions:**
- Compare les données Notion avec Splitfact
- Identifie les opportunités dans les projets
- Signale les incohérences importantes
- Propose des actions concrètes
- Utilise les données personnelles de l'utilisateur

💡 **Focus:** Intègre toujours le contexte fiscal français et les seuils micro-entrepreneur.`;
  }

  private getNotesAnalysisPrompt(): string {
    return `Analyse les notes fiscales Notion et catégorise-les:

ACTIONS URGENTES:
• [Liste des actions à traiter immédiatement]

RECOMMANDATIONS STRATÉGIQUES:
• [Liste des conseils stratégiques]

ALERTES DE CONFORMITÉ:
• [Liste des points de vigilance réglementaire]

RÉSUMÉ:
• [Synthèse en une phrase]

Reste factuel et orienté action.`;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): {
    features: string[];
    supportedAnalysis: string[];
    limitations: string[];
  } {
    return {
      features: [
        'Cross-platform data analysis (Notion + Splitfact)',
        'Project pipeline analysis',
        'Fiscal notes intelligence',
        'Business metrics interpretation',
        'Personalized recommendations'
      ],
      supportedAnalysis: [
        'Revenue discrepancy detection',
        'Project opportunity assessment',
        'Client relationship insights',
        'Compliance alerts from notes',
        'Business performance metrics'
      ],
      limitations: [
        'Requires active Notion connection',
        'Analysis quality depends on workspace data completeness',
        'Cannot modify Notion data directly',
        'Predictions limited without historical data'
      ]
    };
  }
}

// Singleton instance
let notionAgentInstance: NotionAgent | null = null;

export const getNotionAgent = (): NotionAgent => {
  if (!notionAgentInstance) {
    notionAgentInstance = new NotionAgent();
  }
  return notionAgentInstance;
};

export default NotionAgent;