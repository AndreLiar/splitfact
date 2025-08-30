// Smart Alerts from Notion Data
// Analyzes user's Notion workspace to generate intelligent fiscal and business alerts

import { getNotionService, NotionFiscalData } from './notion-service';
import { getUniversalAI } from './ai-service';
import FiscalContextService from './fiscal-context';
import { prisma } from './prisma';

export interface NotionAlert {
  id: string;
  userId: string;
  type: 'CASH_FLOW' | 'PROJECT_DEADLINE' | 'CLIENT_RISK' | 'OPPORTUNITY' | 'COMPLIANCE' | 'PRODUCTIVITY';
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'URGENT';
  actionItems: string[];
  sourceData: {
    notionPageId?: string;
    notionDatabaseId?: string;
    dataType: 'project' | 'client' | 'financial' | 'task' | 'metric';
    lastUpdated: Date;
  };
  estimatedImpact: {
    financial?: number; // Estimated financial impact in EUR
    deadline?: Date; // Related deadline
    probability: number; // 0-1 confidence score
  };
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface NotionDataPattern {
  pattern: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'URGENT';
  conditions: {
    dataType: string;
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'date_before' | 'date_after';
    value: any;
    timeframe?: number; // days
  }[];
}

export class SmartNotionAlerts {
  private aiService = getUniversalAI();

  // Predefined patterns for alert generation
  private readonly ALERT_PATTERNS: NotionDataPattern[] = [
    {
      pattern: 'upcoming_project_deadline',
      description: 'Projet avec deadline approchante',
      severity: 'WARNING',
      conditions: [
        { dataType: 'project', field: 'due_date', operator: 'date_before', value: 7 }, // 7 days
        { dataType: 'project', field: 'status', operator: 'equals', value: 'In Progress' }
      ]
    },
    {
      pattern: 'stalled_project',
      description: 'Projet sans activité récente',
      severity: 'WARNING',
      conditions: [
        { dataType: 'project', field: 'last_edited', operator: 'date_before', value: 14 }, // 14 days
        { dataType: 'project', field: 'status', operator: 'equals', value: 'In Progress' }
      ]
    },
    {
      pattern: 'overdue_invoice',
      description: 'Facture en retard de paiement',
      severity: 'URGENT',
      conditions: [
        { dataType: 'financial', field: 'due_date', operator: 'date_before', value: 0 },
        { dataType: 'financial', field: 'status', operator: 'equals', value: 'Unpaid' }
      ]
    },
    {
      pattern: 'high_value_opportunity',
      description: 'Opportunité commerciale élevée',
      severity: 'INFO',
      conditions: [
        { dataType: 'client', field: 'deal_value', operator: 'greater_than', value: 5000 },
        { dataType: 'client', field: 'status', operator: 'equals', value: 'Negotiating' }
      ]
    },
    {
      pattern: 'client_satisfaction_risk',
      description: 'Risque de satisfaction client',
      severity: 'WARNING',
      conditions: [
        { dataType: 'project', field: 'client_rating', operator: 'less_than', value: 3 },
        { dataType: 'project', field: 'status', operator: 'equals', value: 'Active' }
      ]
    },
    {
      pattern: 'monthly_goal_tracking',
      description: 'Suivi des objectifs mensuels',
      severity: 'INFO',
      conditions: [
        { dataType: 'metric', field: 'period', operator: 'equals', value: 'monthly' },
        { dataType: 'metric', field: 'progress', operator: 'less_than', value: 0.7, timeframe: 25 }
      ]
    }
  ];

  /**
   * Main alert generation process
   */
  async generateSmartAlerts(userId: string): Promise<NotionAlert[]> {
    console.log(`[SmartNotionAlerts] Generating alerts for user ${userId}`);
    
    try {
      // Step 1: Get user's Notion data
      const notionData = await getNotionService(userId).syncFiscalData();
      if (!notionData) {
        console.log(`[SmartNotionAlerts] No Notion data available for user ${userId}`);
        return [];
      }

      // Step 2: Get Splitfact context for comparison
      const fiscalProfile = await FiscalContextService.getUserFiscalProfile(userId);

      // Step 3: Analyze patterns in Notion data
      const patternAlerts = await this.analyzeDataPatterns(userId, notionData);

      // Step 4: Generate AI-enhanced insights
      const aiEnhancedAlerts = await this.generateAIEnhancedAlerts(userId, notionData, fiscalProfile);

      // Step 5: Combine and prioritize alerts
      const allAlerts = [...patternAlerts, ...aiEnhancedAlerts];
      const prioritizedAlerts = this.prioritizeAlerts(allAlerts);

      console.log(`[SmartNotionAlerts] Generated ${prioritizedAlerts.length} smart alerts for user ${userId}`);
      return prioritizedAlerts;

    } catch (error) {
      console.error(`[SmartNotionAlerts] Alert generation failed for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Analyze Notion data for predefined patterns
   */
  private async analyzeDataPatterns(userId: string, notionData: NotionFiscalData): Promise<NotionAlert[]> {
    const alerts: NotionAlert[] = [];

    for (const pattern of this.ALERT_PATTERNS) {
      try {
        const matchingData = this.findPatternMatches(notionData, pattern);
        
        if (matchingData.length > 0) {
          for (const match of matchingData) {
            const alert = await this.createPatternAlert(userId, pattern, match);
            if (alert) alerts.push(alert);
          }
        }
      } catch (error) {
        console.warn(`[SmartNotionAlerts] Pattern analysis failed for ${pattern.pattern}:`, error);
      }
    }

    return alerts;
  }

  /**
   * Generate AI-enhanced alerts using LLM analysis
   */
  private async generateAIEnhancedAlerts(
    userId: string, 
    notionData: NotionFiscalData, 
    fiscalProfile: any
  ): Promise<NotionAlert[]> {
    
    try {
      // Build comprehensive analysis context
      const analysisContext = this.buildAnalysisContext(notionData, fiscalProfile);
      
      const analysisPrompt = `Analyse ces données cross-platform pour générer des alertes intelligentes:

DONNÉES NOTION:
${JSON.stringify({
  clients: notionData.clients.slice(0, 5), // Limit for prompt size
  revenues: notionData.revenues.slice(0, 3),
  metrics: notionData.businessMetrics
}, null, 2)}

PROFIL FISCAL SPLITFACT:
- CA: ${fiscalProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Progression seuils: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%
- Clients: ${fiscalProfile.clients.total}

INSTRUCTIONS:
Identifie 3-5 alertes prioritaires en croisant ces données. Focus sur:
1. Opportunités d'optimisation fiscale
2. Risques clients/projets 
3. Écarts entre données Notion et Splitfact
4. Tendances préoccupantes
5. Actions correctives suggérées

Réponds en JSON array:
[{
  "type": "CASH_FLOW|PROJECT_DEADLINE|CLIENT_RISK|OPPORTUNITY|COMPLIANCE|PRODUCTIVITY",
  "title": "Titre court",
  "description": "Description détaillée",
  "severity": "INFO|WARNING|URGENT",
  "actionItems": ["Action 1", "Action 2"],
  "estimatedImpact": {
    "financial": 1000,
    "probability": 0.8
  }
}]`;

      const aiResponse = await this.aiService.chat(
        'Tu es un analyste business qui identifie les opportunités et risques dans les données cross-platform.',
        analysisPrompt,
        { temperature: 0.4 }
      );

      const aiAlerts = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, '').trim());
      
      return aiAlerts.map((alert: any) => this.createAIAlert(userId, alert, notionData));

    } catch (error) {
      console.warn(`[SmartNotionAlerts] AI analysis failed:`, error);
      return [];
    }
  }

  /**
   * Find matches for a specific pattern in Notion data
   */
  private findPatternMatches(notionData: NotionFiscalData, pattern: NotionDataPattern): any[] {
    const matches: any[] = [];

    // This is a simplified pattern matching - in production you'd want more sophisticated logic
    try {
      switch (pattern.pattern) {
        case 'upcoming_project_deadline':
          const urgentClients = notionData.clients.filter((client: any) => {
            return client.projects.length > 0 && client.totalRevenue > 1000;
          });
          matches.push(...urgentClients);
          break;

        case 'stalled_project':
          const stalledClients = notionData.clients.filter((client: any) => {
            return client.projects.length === 0 && client.totalRevenue === 0;
          });
          matches.push(...stalledClients);
          break;

        case 'high_value_opportunity':
          const highValueClients = notionData.clients.filter((client: any) => {
            return client.totalRevenue > 5000;
          });
          matches.push(...highValueClients);
          break;

        // Add more pattern matching logic as needed
      }
    } catch (error) {
      console.warn(`Pattern matching failed for ${pattern.pattern}:`, error);
    }

    return matches;
  }

  /**
   * Create alert from pattern match
   */
  private async createPatternAlert(userId: string, pattern: NotionDataPattern, matchData: any): Promise<NotionAlert | null> {
    try {
      const alert: NotionAlert = {
        id: `notion_${pattern.pattern}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: this.mapPatternToAlertType(pattern.pattern),
        title: this.generateAlertTitle(pattern, matchData),
        description: this.generateAlertDescription(pattern, matchData),
        severity: pattern.severity,
        actionItems: await this.generateActionItems(pattern, matchData),
        sourceData: {
          notionPageId: matchData.id || matchData.pageId,
          dataType: this.inferDataType(matchData),
          lastUpdated: new Date(matchData.lastEdited || matchData.updatedAt || Date.now())
        },
        estimatedImpact: {
          financial: this.estimateFinancialImpact(pattern, matchData),
          deadline: matchData.dueDate ? new Date(matchData.dueDate) : undefined,
          probability: 0.8 // Default confidence
        },
        isRead: false,
        createdAt: new Date(),
        expiresAt: this.calculateExpirationDate(pattern)
      };

      return alert;
    } catch (error) {
      console.warn(`Failed to create pattern alert:`, error);
      return null;
    }
  }

  /**
   * Create alert from AI analysis
   */
  private createAIAlert(userId: string, aiAlert: any, notionData: NotionFiscalData): NotionAlert {
    return {
      id: `ai_notion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: aiAlert.type,
      title: aiAlert.title,
      description: aiAlert.description,
      severity: aiAlert.severity,
      actionItems: aiAlert.actionItems || [],
      sourceData: {
        dataType: 'metric',
        lastUpdated: new Date()
      },
      estimatedImpact: {
        financial: aiAlert.estimatedImpact?.financial,
        probability: aiAlert.estimatedImpact?.probability || 0.7
      },
      isRead: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Prioritize alerts by impact and urgency
   */
  private prioritizeAlerts(alerts: NotionAlert[]): NotionAlert[] {
    return alerts.sort((a, b) => {
      // Priority score: severity + financial impact + probability
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      return scoreB - scoreA;
    }).slice(0, 10); // Limit to top 10 alerts
  }

  private calculatePriorityScore(alert: NotionAlert): number {
    let score = 0;
    
    // Severity weight
    switch (alert.severity) {
      case 'URGENT': score += 10; break;
      case 'WARNING': score += 5; break;
      case 'INFO': score += 1; break;
    }
    
    // Financial impact weight
    if (alert.estimatedImpact.financial) {
      score += Math.min(alert.estimatedImpact.financial / 1000, 5); // Max 5 points
    }
    
    // Probability weight
    score *= alert.estimatedImpact.probability;
    
    return score;
  }

  /**
   * Store alerts as notifications
   */
  async storeNotionAlerts(alerts: NotionAlert[]): Promise<void> {
    for (const alert of alerts) {
      try {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'FISCAL_INSIGHT',
            title: alert.title,
            message: `${alert.description}\n\nActions suggérées:\n${alert.actionItems.map(item => `• ${item}`).join('\n')}`,
            actionUrl: `/dashboard/insights/notion/${alert.id}`,
            metadata: {
              notionAlertId: alert.id,
              alertType: alert.type,
              severity: alert.severity,
              estimatedImpact: alert.estimatedImpact,
              sourceData: alert.sourceData
            }
          }
        });
      } catch (error) {
        console.warn(`Failed to store Notion alert ${alert.id}:`, error);
      }
    }
  }

  /**
   * Helper methods
   */
  private buildAnalysisContext(notionData: NotionFiscalData, fiscalProfile: any): string {
    return `
    Clients actifs: ${notionData.clients.length}
    Revenus: ${notionData.revenues.length} entrées
    CA Splitfact: ${fiscalProfile.revenue.totalPaid}€
    Seuils: ${fiscalProfile.compliance.bncThresholdProgress}%
    `;
  }

  private mapPatternToAlertType(pattern: string): NotionAlert['type'] {
    const mapping: Record<string, NotionAlert['type']> = {
      'upcoming_project_deadline': 'PROJECT_DEADLINE',
      'stalled_project': 'PRODUCTIVITY',
      'overdue_invoice': 'CASH_FLOW',
      'high_value_opportunity': 'OPPORTUNITY',
      'client_satisfaction_risk': 'CLIENT_RISK',
      'monthly_goal_tracking': 'PRODUCTIVITY'
    };
    return mapping[pattern] || 'PRODUCTIVITY';
  }

  private generateAlertTitle(pattern: NotionDataPattern, matchData: any): string {
    switch (pattern.pattern) {
      case 'upcoming_project_deadline':
        return `Deadline approchante: ${matchData.title || matchData.name}`;
      case 'stalled_project':
        return `Projet au ralenti: ${matchData.title || matchData.name}`;
      case 'high_value_opportunity':
        return `Opportunité élevée: ${matchData.name || 'Client'}`;
      default:
        return pattern.description;
    }
  }

  private generateAlertDescription(pattern: NotionDataPattern, matchData: any): string {
    switch (pattern.pattern) {
      case 'upcoming_project_deadline':
        const daysLeft = Math.ceil((new Date(matchData.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Le projet "${matchData.title}" arrive à échéance dans ${daysLeft} jour(s). Vérifiez l'avancement et anticipez la livraison.`;
      
      case 'stalled_project':
        const daysStalled = Math.floor((Date.now() - new Date(matchData.lastEdited).getTime()) / (1000 * 60 * 60 * 24));
        return `Le projet "${matchData.title}" n'a pas été mis à jour depuis ${daysStalled} jours. Il pourrait nécessiter une attention particulière.`;
      
      default:
        return `${pattern.description} détectée dans vos données Notion.`;
    }
  }

  private async generateActionItems(pattern: NotionDataPattern, matchData: any): Promise<string[]> {
    const actions: Record<string, string[]> = {
      'upcoming_project_deadline': [
        'Vérifier l\'avancement du projet',
        'Communiquer avec le client sur les attentes',
        'Planifier les dernières étapes'
      ],
      'stalled_project': [
        'Revoir les blocages du projet',
        'Contacter les parties prenantes',
        'Réévaluer les priorités'
      ],
      'high_value_opportunity': [
        'Préparer une proposition détaillée',
        'Planifier un suivi commercial',
        'Anticiper les besoins de trésorerie'
      ]
    };

    return actions[pattern.pattern] || ['Analyser la situation', 'Prendre les actions appropriées'];
  }

  private estimateFinancialImpact(pattern: NotionDataPattern, matchData: any): number {
    if (matchData.dealValue) return matchData.dealValue;
    if (matchData.budget) return matchData.budget;
    
    // Default estimates based on pattern type
    const estimates: Record<string, number> = {
      'upcoming_project_deadline': 2000,
      'stalled_project': -1000,
      'high_value_opportunity': 5000,
      'client_satisfaction_risk': -3000
    };
    
    return estimates[pattern.pattern] || 0;
  }

  private inferDataType(matchData: any): 'project' | 'client' | 'financial' | 'task' | 'metric' {
    if (matchData.dueDate && matchData.status) return 'project';
    if (matchData.dealValue || matchData.clientType) return 'client';
    if (matchData.amount || matchData.invoice) return 'financial';
    return 'metric';
  }

  private calculateExpirationDate(pattern: NotionDataPattern): Date {
    const expirationDays: Record<string, number> = {
      'upcoming_project_deadline': 1, // Expires after deadline
      'stalled_project': 7,
      'high_value_opportunity': 14,
      'client_satisfaction_risk': 3
    };
    
    const days = expirationDays[pattern.pattern] || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
}

// Singleton instance
let smartNotionAlertsInstance: SmartNotionAlerts | null = null;

export const getSmartNotionAlerts = (): SmartNotionAlerts => {
  if (!smartNotionAlertsInstance) {
    smartNotionAlertsInstance = new SmartNotionAlerts();
  }
  return smartNotionAlertsInstance;
};

export default SmartNotionAlerts;