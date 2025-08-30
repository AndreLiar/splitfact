// Automatic Fiscal Regulation Monitor
// Continuously monitors French tax regulations and alerts users to changes

import { getWebSearchService } from './web-search-service';
import { getWebContentExtractor } from './web-content-extractor';
import { getUniversalAI } from './ai-service';
import { prisma } from './prisma';

export interface FiscalRegulation {
  id: string;
  title: string;
  description: string;
  category: 'TVA' | 'URSSAF' | 'SEUILS' | 'COTISATIONS' | 'DEADLINES' | 'GENERAL';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  effectiveDate: Date;
  sourceUrl: string;
  content: string;
  impactedUsers: string[];
  createdAt: Date;
  isActive: boolean;
}

export interface RegulationAlert {
  id: string;
  userId: string;
  regulationId: string;
  alertType: 'NEW_REGULATION' | 'THRESHOLD_CHANGE' | 'DEADLINE_UPDATE' | 'RATE_CHANGE';
  title: string;
  message: string;
  actionRequired: boolean;
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: Date;
  isRead: boolean;
  createdAt: Date;
}

export interface MonitoringConfig {
  enabled: boolean;
  checkIntervalHours: number;
  sources: {
    urssaf: boolean;
    dgfip: boolean;
    servicepublic: boolean;
    legifrance: boolean;
  };
  alertCategories: {
    thresholdChanges: boolean;
    rateChanges: boolean;
    newObligations: boolean;
    deadlines: boolean;
  };
}

export class FiscalRegulationMonitor {
  private webSearchService = getWebSearchService();
  private contentExtractor = getWebContentExtractor();
  private aiService = getUniversalAI();
  
  private readonly MONITORING_SOURCES = [
    'site:urssaf.fr',
    'site:impots.gouv.fr',
    'site:service-public.fr',
    'site:legifrance.gouv.fr'
  ];

  private readonly FISCAL_KEYWORDS = [
    'micro-entrepreneur 2025',
    'seuil TVA 2025',
    'cotisations sociales 2025',
    'franchise TVA',
    'abattement forfaitaire',
    'taux cotisations URSSAF',
    'déclaration trimestrielle',
    'régime micro-fiscal'
  ];

  /**
   * Main monitoring loop - checks for regulation updates
   */
  async runMonitoringCycle(): Promise<void> {
    console.log('[FiscalMonitor] Starting monitoring cycle');
    
    try {
      // Step 1: Search for recent regulation changes
      const recentChanges = await this.searchForRecentChanges();
      
      // Step 2: Analyze and categorize changes
      const processedRegulations = await this.processRegulationChanges(recentChanges);
      
      // Step 3: Generate alerts for affected users
      const alerts = await this.generateUserAlerts(processedRegulations);
      
      // Step 4: Store regulations and alerts
      await this.storeRegulationsAndAlerts(processedRegulations, alerts);
      
      console.log(`[FiscalMonitor] Monitoring cycle complete: ${processedRegulations.length} regulations, ${alerts.length} alerts`);
      
    } catch (error) {
      console.error('[FiscalMonitor] Monitoring cycle failed:', error);
    }
  }

  /**
   * Search for recent fiscal regulation changes
   */
  private async searchForRecentChanges(): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
    publishDate: Date;
    relevanceScore: number;
  }>> {
    const changes: any[] = [];
    
    // Search for each category of fiscal changes
    const searchQueries = [
      'nouveau seuil micro-entrepreneur 2025',
      'modification TVA franchise 2025',
      'changement cotisations URSSAF 2025',
      'nouvelle obligation déclarative micro-entrepreneur',
      'évolution taux cotisations sociales 2025'
    ];

    for (const query of searchQueries) {
      try {
        const results = await this.webSearchService.searchFiscalInfo(query, {
          maxResults: 5,
          trustedSources: true,
          fiscalSpecific: true
        });

        // Filter for recent results (last 3 months)
        const recentResults = results.filter(result => {
          if (!result.publishDate) return false;
          const publishDate = new Date(result.publishDate);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return publishDate > threeMonthsAgo;
        });

        changes.push(...recentResults);
        
      } catch (error) {
        console.warn(`[FiscalMonitor] Search failed for query: ${query}`, error);
      }
    }

    // Remove duplicates based on URL
    const uniqueChanges = Array.from(
      new Map(changes.map(item => [item.url, item])).values()
    );

    return uniqueChanges.slice(0, 10); // Limit to top 10 most relevant
  }

  /**
   * Process and categorize regulation changes using AI
   */
  private async processRegulationChanges(changes: any[]): Promise<FiscalRegulation[]> {
    const processedRegulations: FiscalRegulation[] = [];

    for (const change of changes) {
      try {
        // Extract detailed content
        const extractedContent = await this.contentExtractor.extractContent(change.url, {
          maxLength: 2000,
          validateFiscalContent: true,
          extractKeyPoints: true
        });

        if (extractedContent.reliability < 0.7) {
          continue; // Skip unreliable content
        }

        // Use AI to analyze the regulation change
        const analysisPrompt = `Analyse ce changement réglementaire fiscal français pour micro-entrepreneurs:

TITRE: ${change.title}
CONTENU: ${extractedContent.content}

Détermine:
1. Catégorie (TVA, URSSAF, SEUILS, COTISATIONS, DEADLINES, GENERAL)
2. Sévérité (INFO, WARNING, CRITICAL)
3. Date d'effet si mentionnée
4. Impact sur les micro-entrepreneurs
5. Description claire du changement

Réponds UNIQUEMENT en JSON:
{
  "category": "...",
  "severity": "...",
  "effectiveDate": "YYYY-MM-DD ou null",
  "description": "Description claire du changement",
  "impact": "Description de l'impact sur les micro-entrepreneurs",
  "keyChanges": ["changement 1", "changement 2"]
}`;

        const analysisResponse = await this.aiService.chat(
          'Tu es un expert en réglementation fiscale française. Analyse précisément les changements réglementaires.',
          analysisPrompt,
          { temperature: 0.2 }
        );

        const analysis = JSON.parse(analysisResponse.replace(/```json\n?|\n?```/g, '').trim());

        const regulation: FiscalRegulation = {
          id: this.generateRegulationId(change.url),
          title: change.title,
          description: analysis.description,
          category: analysis.category,
          severity: analysis.severity,
          effectiveDate: analysis.effectiveDate ? new Date(analysis.effectiveDate) : new Date(),
          sourceUrl: change.url,
          content: extractedContent.content,
          impactedUsers: [], // Will be populated when generating alerts
          createdAt: new Date(),
          isActive: true
        };

        processedRegulations.push(regulation);

      } catch (error) {
        console.warn(`[FiscalMonitor] Failed to process regulation: ${change.url}`, error);
      }
    }

    return processedRegulations;
  }

  /**
   * Generate personalized alerts for affected users
   */
  private async generateUserAlerts(regulations: FiscalRegulation[]): Promise<RegulationAlert[]> {
    const alerts: RegulationAlert[] = [];

    // Get all active users with fiscal context
    const users = await prisma.user.findMany({
      include: {
        invoices: {
          where: {
            invoiceDate: {
              gte: new Date(new Date().getFullYear(), 0, 1) // Current year
            }
          }
        }
      }
    });

    for (const regulation of regulations) {
      for (const user of users) {
        try {
          // Calculate user revenue for impact assessment
          const userRevenue = user.invoices
            .filter(inv => inv.paymentStatus === 'paid')
            .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

          // Determine if this regulation affects the user
          const isAffected = await this.determineUserImpact(regulation, user, userRevenue);

          if (isAffected.affected) {
            const alert: RegulationAlert = {
              id: this.generateAlertId(regulation.id, user.id),
              userId: user.id,
              regulationId: regulation.id,
              alertType: this.categorizeAlertType(regulation.category),
              title: `Nouvelle réglementation : ${regulation.title}`,
              message: await this.generatePersonalizedMessage(regulation, user, userRevenue, isAffected),
              actionRequired: regulation.severity === 'CRITICAL' || isAffected.impact === 'HIGH',
              estimatedImpact: isAffected.impact,
              dueDate: this.calculateDueDate(regulation),
              isRead: false,
              createdAt: new Date()
            };

            alerts.push(alert);
            regulation.impactedUsers.push(user.id);
          }

        } catch (error) {
          console.warn(`[FiscalMonitor] Failed to generate alert for user ${user.id}:`, error);
        }
      }
    }

    return alerts;
  }

  /**
   * Determine if a regulation affects a specific user
   */
  private async determineUserImpact(
    regulation: FiscalRegulation, 
    user: any, 
    userRevenue: number
  ): Promise<{ affected: boolean; impact: 'LOW' | 'MEDIUM' | 'HIGH'; reason: string }> {
    
    // Base impact assessment on revenue thresholds
    const bncThreshold = 39100; // BNC threshold for 2025
    const bicThreshold = 91900; // BIC threshold for 2025
    const revenueProgress = userRevenue / bncThreshold;

    // Category-specific impact rules
    switch (regulation.category) {
      case 'SEUILS':
        if (revenueProgress > 0.8) {
          return { affected: true, impact: 'HIGH', reason: 'Proche des seuils de franchise' };
        } else if (revenueProgress > 0.5) {
          return { affected: true, impact: 'MEDIUM', reason: 'Seuils à surveiller' };
        }
        return { affected: true, impact: 'LOW', reason: 'Information générale' };

      case 'TVA':
        if (revenueProgress > 0.9) {
          return { affected: true, impact: 'HIGH', reason: 'Risque de dépassement seuil TVA' };
        } else if (revenueProgress > 0.7) {
          return { affected: true, impact: 'MEDIUM', reason: 'TVA à anticiper' };
        }
        return { affected: true, impact: 'LOW', reason: 'Information TVA' };

      case 'URSSAF':
      case 'COTISATIONS':
        return { affected: true, impact: 'MEDIUM', reason: 'Cotisations sociales concernées' };

      case 'DEADLINES':
        return { affected: true, impact: 'HIGH', reason: 'Nouvelle échéance' };

      default:
        return { affected: true, impact: 'LOW', reason: 'Information générale' };
    }
  }

  /**
   * Generate personalized alert message
   */
  private async generatePersonalizedMessage(
    regulation: FiscalRegulation,
    user: any,
    userRevenue: number,
    impact: { affected: boolean; impact: string; reason: string }
  ): Promise<string> {
    
    const personalizedPrompt = `Génère un message d'alerte personnalisé pour cette réglementation:

RÉGLEMENTATION: ${regulation.description}
UTILISATEUR:
- Nom: ${user.name || 'Utilisateur'}
- CA actuel: ${userRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Impact estimé: ${impact.impact}
- Raison: ${impact.reason}

Créé un message clair et actionnable en 2-3 phrases maximum, avec:
1. L'essentiel du changement
2. L'impact spécifique pour cet utilisateur  
3. Action recommandée si nécessaire

Ton français, style professionnel mais accessible.`;

    try {
      return await this.aiService.chat(
        'Tu es un conseiller fiscal qui communique clairement les changements réglementaires.',
        personalizedPrompt,
        { temperature: 0.3 }
      );
    } catch (error) {
      // Fallback message
      return `${regulation.description}\n\nImpact pour votre activité: ${impact.reason}. Consultez les détails pour plus d'informations.`;
    }
  }

  /**
   * Store regulations and alerts in database
   */
  private async storeRegulationsAndAlerts(
    regulations: FiscalRegulation[], 
    alerts: RegulationAlert[]
  ): Promise<void> {
    
    // Store regulations (implement as needed with your database schema)
    for (const regulation of regulations) {
      // Check if regulation already exists
      const existing = await this.checkExistingRegulation(regulation.id);
      if (!existing) {
        // Store regulation data - you may need to create a table for this
        console.log(`[FiscalMonitor] New regulation detected: ${regulation.title}`);
      }
    }

    // Store alerts as notifications
    for (const alert of alerts) {
      try {
        await prisma.notification.create({
          data: {
            userId: alert.userId,
            type: 'FISCAL_INSIGHT',
            title: alert.title,
            message: alert.message,
            actionUrl: `/dashboard/regulations/${alert.regulationId}`,
            metadata: {
              regulationId: alert.regulationId,
              alertType: alert.alertType,
              estimatedImpact: alert.estimatedImpact,
              actionRequired: alert.actionRequired,
              dueDate: alert.dueDate?.toISOString()
            }
          }
        });
      } catch (error) {
        console.warn(`[FiscalMonitor] Failed to create notification for alert ${alert.id}:`, error);
      }
    }

    console.log(`[FiscalMonitor] Stored ${alerts.length} alerts as notifications`);
  }

  /**
   * Helper methods
   */
  private generateRegulationId(url: string): string {
    return `reg_${Buffer.from(url).toString('base64').slice(0, 16)}`;
  }

  private generateAlertId(regulationId: string, userId: string): string {
    return `alert_${regulationId}_${userId}`;
  }

  private categorizeAlertType(category: string): RegulationAlert['alertType'] {
    switch (category) {
      case 'SEUILS': return 'THRESHOLD_CHANGE';
      case 'DEADLINES': return 'DEADLINE_UPDATE';
      case 'TVA':
      case 'COTISATIONS': return 'RATE_CHANGE';
      default: return 'NEW_REGULATION';
    }
  }

  private calculateDueDate(regulation: FiscalRegulation): Date | undefined {
    if (regulation.category === 'DEADLINES') {
      return regulation.effectiveDate;
    }
    return undefined;
  }

  private async checkExistingRegulation(regulationId: string): Promise<boolean> {
    // Implement check against your regulation storage
    // For now, return false to process all as new
    return false;
  }

  /**
   * Get monitoring configuration for a user
   */
  async getMonitoringConfig(userId: string): Promise<MonitoringConfig> {
    // This could be stored in user preferences
    return {
      enabled: true,
      checkIntervalHours: 24,
      sources: {
        urssaf: true,
        dgfip: true,
        servicepublic: true,
        legifrance: false // Might be too technical
      },
      alertCategories: {
        thresholdChanges: true,
        rateChanges: true,
        newObligations: true,
        deadlines: true
      }
    };
  }

  /**
   * Get recent regulations for display
   */
  async getRecentRegulations(limit: number = 10): Promise<FiscalRegulation[]> {
    // This would fetch from your regulation storage
    // For now, return empty array
    return [];
  }

  /**
   * Manual trigger for monitoring (for testing/admin)
   */
  async triggerManualMonitoring(): Promise<{ success: boolean; message: string }> {
    try {
      await this.runMonitoringCycle();
      return { success: true, message: 'Monitoring cycle completed successfully' };
    } catch (error) {
      console.error('[FiscalMonitor] Manual monitoring failed:', error);
      return { success: false, message: 'Monitoring cycle failed' };
    }
  }
}

// Singleton instance
let fiscalMonitorInstance: FiscalRegulationMonitor | null = null;

export const getFiscalRegulationMonitor = (): FiscalRegulationMonitor => {
  if (!fiscalMonitorInstance) {
    fiscalMonitorInstance = new FiscalRegulationMonitor();
  }
  return fiscalMonitorInstance;
};

export default FiscalRegulationMonitor;