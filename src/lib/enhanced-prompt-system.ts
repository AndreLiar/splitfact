// Enhanced Prompt System - Dynamic prompt generation with real-time fiscal data
// Creates contextually aware prompts for AI agents with current user data and regulations

import FiscalContextService, { UserFiscalProfile } from './fiscal-context';
import { SearchResult } from './web-search-service';
import { ExtractedContent } from './web-content-extractor';
import { NotionFiscalData } from './notion-service';

export interface PromptContext {
  userProfile: UserFiscalProfile;
  webSources?: SearchResult[];
  extractedContent?: ExtractedContent[];
  queryType: 'general' | 'compliance' | 'strategy' | 'calculation' | 'urgent' | 'research' | 'notion';
  specificContext?: {
    timeframe?: string;
    clientId?: string;
    projectName?: string;
    thresholdConcern?: boolean;
    complianceDeadline?: Date;
  };
}

export interface EnhancedPrompt {
  systemPrompt: string;
  contextualizedQuery: string;
  metadata: {
    dataFreshness: Date;
    includesWebData: boolean;
    includesNotionData: boolean;
    confidenceFactors: string[];
    riskAlerts: string[];
  };
}

export class EnhancedPromptSystem {
  
  /**
   * Generate contextually enhanced prompts for any query type
   */
  async generateEnhancedPrompt(
    originalQuery: string,
    context: PromptContext
  ): Promise<EnhancedPrompt> {
    // Build comprehensive system prompt
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Create contextualized query with real-time data
    const contextualizedQuery = await this.buildContextualizedQuery(
      originalQuery,
      context
    );
    
    // Generate metadata for transparency and debugging
    const metadata = this.generatePromptMetadata(context);

    return {
      systemPrompt,
      contextualizedQuery,
      metadata
    };
  }

  /**
   * Build comprehensive system prompt based on context
   */
  private buildSystemPrompt(context: PromptContext): string {
    let systemPrompt = this.getBaseSystemPrompt(context.queryType);
    
    // Add user context awareness
    systemPrompt += this.addUserContextAwareness(context.userProfile);
    
    // Add web search capabilities if available
    if (context.webSources && context.webSources.length > 0) {
      systemPrompt += this.addWebSearchCapabilities();
    }
    
    // Add Notion integration awareness if available
    if (context.userProfile.notion.isConnected) {
      systemPrompt += this.addNotionIntegrationAwareness(context.userProfile.notion);
    }
    
    // Add specific instructions based on query type
    systemPrompt += this.addQueryTypeInstructions(context.queryType);
    
    // Add risk and compliance alerts
    systemPrompt += this.addRiskAndComplianceAlerts(context.userProfile);

    return systemPrompt;
  }

  /**
   * Build contextualized query with real-time fiscal data
   */
  private async buildContextualizedQuery(
    originalQuery: string,
    context: PromptContext
  ): Promise<string> {
    let enhancedQuery = originalQuery;
    
    // Add fiscal profile context
    enhancedQuery += '\n\n--- CONTEXTE FISCAL PERSONNEL ---\n';
    enhancedQuery += this.buildFiscalContextSection(context.userProfile);
    
    // Add web research data if available
    if (context.webSources && context.webSources.length > 0) {
      enhancedQuery += '\n\n--- INFORMATIONS WEB RÉCENTES ---\n';
      enhancedQuery += this.buildWebContextSection(context.webSources, context.extractedContent);
    }
    
    // Add Notion workspace data if available
    if (context.userProfile.notion.isConnected && context.userProfile.notion.fiscalData) {
      enhancedQuery += '\n\n--- DONNÉES NOTION WORKSPACE ---\n';
      enhancedQuery += this.buildNotionContextSection(context.userProfile.notion.fiscalData);
    }
    
    // Add specific context if provided
    if (context.specificContext) {
      enhancedQuery += '\n\n--- CONTEXTE SPÉCIFIQUE ---\n';
      enhancedQuery += this.buildSpecificContextSection(context.specificContext);
    }
    
    // Add current date and regulatory context
    enhancedQuery += `\n\n--- CONTEXTE TEMPOREL ---\n`;
    enhancedQuery += `Date actuelle: ${new Date().toLocaleDateString('fr-FR')}\n`;
    enhancedQuery += `Année fiscale: ${new Date().getFullYear()}\n`;
    enhancedQuery += `Trimestre: Q${Math.ceil((new Date().getMonth() + 1) / 3)}\n`;

    return enhancedQuery;
  }

  /**
   * Get base system prompt for query type
   */
  private getBaseSystemPrompt(queryType: string): string {
    const basePrompts = {
      general: `Tu es un CONSEILLER FISCAL EXPERT spécialisé en micro-entrepreneurs français. Tu disposes d'un accès complet aux données de l'utilisateur et aux informations fiscales les plus récentes.`,
      
      compliance: `Tu es un EXPERT EN CONFORMITÉ FISCALE spécialisé dans les obligations des micro-entrepreneurs. Tu as accès aux dernières réglementations URSSAF et aux données personnelles de l'utilisateur.`,
      
      strategy: `Tu es un CONSULTANT STRATÉGIQUE EN FISCALITÉ pour entrepreneurs français. Tu combines l'analyse des données personnelles avec les opportunités fiscales actuelles.`,
      
      calculation: `Tu es un EXPERT-COMPTABLE spécialisé en calculs fiscaux et sociaux pour micro-entrepreneurs. Tu as accès aux données financières précises de l'utilisateur.`,
      
      urgent: `Tu es un CONSEILLER FISCAL D'URGENCE. Cette demande nécessite une attention immédiate avec analyse des risques et actions correctives prioritaires.`,
      
      research: `Tu es un AGENT DE RECHERCHE FISCAL avec accès aux informations web les plus récentes. Tu combines recherche réglementaire et contexte personnel de l'utilisateur.`,
      
      notion: `Tu es un ANALYSTE DE WORKSPACE NOTION spécialisé dans l'analyse croisée des données fiscales. Tu combines les données Notion avec le contexte Splitfact de l'utilisateur.`
    };

    return basePrompts[queryType as keyof typeof basePrompts] || basePrompts.general;
  }

  /**
   * Add user context awareness to system prompt
   */
  private addUserContextAwareness(userProfile: UserFiscalProfile): string {
    const currentYear = new Date().getFullYear();
    const thresholdProgress = userProfile.compliance.bncThresholdProgress;
    const revenue = userProfile.revenue.totalPaid;
    
    let context = `\n\n🔍 **PROFIL UTILISATEUR ACTUEL:**\n`;
    context += `• CA ${currentYear}: ${revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• Progression seuil BNC: ${thresholdProgress.toFixed(1)}% (${(thresholdProgress * 391).toFixed(0)}€ / 39 100€)\n`;
    context += `• Clients actifs: ${userProfile.clients.total}\n`;
    
    if (userProfile.clients.averagePaymentDelay > 45) {
      context += `• ⚠️ ALERTE: Délai paiement moyen élevé (${userProfile.clients.averagePaymentDelay.toFixed(0)} jours)\n`;
    }
    
    if (thresholdProgress > 85) {
      context += `• 🚨 CRITIQUE: Proche du seuil BNC (${thresholdProgress.toFixed(1)}%)\n`;
    } else if (thresholdProgress > 70) {
      context += `• ⚠️ VIGILANCE: Surveillance seuil BNC nécessaire\n`;
    }

    return context;
  }

  /**
   * Add web search capabilities to system prompt
   */
  private addWebSearchCapabilities(): string {
    return `\n\n🌐 **CAPACITÉS WEB RENFORCÉES:**\n` +
           `• Accès aux dernières réglementations URSSAF et fiscales\n` +
           `• Informations en temps réel des sources officielles\n` +
           `• Veille réglementaire active (service-public.fr, urssaf.fr, impots.gouv.fr)\n` +
           `• Validation croisée des informations avec sources multiples\n`;
  }

  /**
   * Add Notion integration awareness
   */
  private addNotionIntegrationAwareness(notionContext: any): string {
    let context = `\n\n📝 **INTÉGRATION NOTION ACTIVE:**\n`;
    context += `• Workspace: ${notionContext.workspaceName || 'Connecté'}\n`;
    
    if (notionContext.lastSyncAt) {
      const daysSinceSync = Math.floor((Date.now() - new Date(notionContext.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24));
      context += `• Dernière sync: il y a ${daysSinceSync} jour${daysSinceSync > 1 ? 's' : ''}\n`;
    }
    
    context += `• Données disponibles: revenus, clients, projets, notes fiscales, métriques\n`;
    context += `• Analyse croisée Splitfact ↔ Notion activée\n`;

    return context;
  }

  /**
   * Add query type specific instructions
   */
  private addQueryTypeInstructions(queryType: string): string {
    const instructions = {
      general: `\n\n📋 **INSTRUCTIONS SPÉCIFIQUES:**\n• Adapte ta réponse au profil exact de l'utilisateur\n• Cite les montants et seuils personnalisés\n• Propose des actions concrètes\n`,
      
      compliance: `\n\n⚖️ **FOCUS CONFORMITÉ:**\n• Vérifie les obligations actuelles selon le CA\n• Identifie les risques de non-conformité\n• Propose un plan d'action avec échéances\n`,
      
      strategy: `\n\n💡 **ANALYSE STRATÉGIQUE:**\n• Évalue les opportunités fiscales personnalisées\n• Analyse l'impact des projets Notion sur la fiscalité\n• Propose des optimisations selon la progression des seuils\n`,
      
      calculation: `\n\n🧮 **CALCULS PRÉCIS:**\n• Utilise les montants exacts du profil utilisateur\n• Calcule les impacts réels sur les seuils\n• Fournis des projections chiffrées\n`,
      
      urgent: `\n\n🚨 **MODE URGENCE:**\n• Identifie les risques immédiats\n• Propose des actions correctives prioritaires\n• Mentionne les échéances critiques\n`,
      
      research: `\n\n🔍 **RECHERCHE AVANCÉE:**\n• Combine informations web et contexte personnel\n• Cite tes sources officielles\n• Signale les nouveautés réglementaires\n`,
      
      notion: `\n\n📊 **ANALYSE NOTION:**\n• Compare les données Splitfact et Notion\n• Identifie les opportunités dans les projets\n• Signale les incohérences importantes\n`
    };

    return instructions[queryType as keyof typeof instructions] || instructions.general;
  }

  /**
   * Add risk and compliance alerts
   */
  private addRiskAndComplianceAlerts(userProfile: UserFiscalProfile): string {
    const alerts: string[] = [];
    const thresholdProgress = userProfile.compliance.bncThresholdProgress;
    const paymentDelay = userProfile.clients.averagePaymentDelay;
    
    if (thresholdProgress > 90) {
      alerts.push('🚨 URGENCE: Risque de dépassement seuil BNC imminent');
    } else if (thresholdProgress > 75) {
      alerts.push('⚠️ VIGILANCE: Surveillance seuil BNC requise');
    }
    
    if (paymentDelay > 60) {
      alerts.push('💰 ATTENTION: Retards de paiement importants détectés');
    }
    
    if (userProfile.compliance.estimatedQuarterlyPayments > userProfile.revenue.totalPaid * 0.25) {
      alerts.push('📊 INFO: Charges sociales élevées ce trimestre');
    }

    if (alerts.length > 0) {
      return `\n\n🎯 **ALERTES CONTEXTUELLES:**\n${alerts.map(alert => `• ${alert}`).join('\n')}\n`;
    }

    return '';
  }

  /**
   * Build fiscal context section
   */
  private buildFiscalContextSection(userProfile: UserFiscalProfile): string {
    const currentYear = new Date().getFullYear();
    let context = '';
    
    // Revenue analysis
    context += `💰 REVENUS ${currentYear}:\n`;
    context += `• Encaissé: ${userProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• En attente: ${userProfile.revenue.totalPending.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• En retard: ${userProfile.revenue.totalOverdue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    
    if (userProfile.revenue.yearOverYear !== 0) {
      const trend = userProfile.revenue.yearOverYear > 0 ? '📈' : '📉';
      context += `• Évolution vs N-1: ${trend} ${userProfile.revenue.yearOverYear > 0 ? '+' : ''}${userProfile.revenue.yearOverYear.toFixed(1)}%\n`;
    }
    
    // Compliance status
    context += `\n⚖️ CONFORMITÉ:\n`;
    context += `• Seuil BNC: ${userProfile.compliance.bncThresholdProgress.toFixed(1)}% (${(userProfile.compliance.bncThresholdProgress * 391).toFixed(0)}€ / 39 100€)\n`;
    context += `• Seuil BIC: ${userProfile.compliance.bicThresholdProgress.toFixed(1)}% (${(userProfile.compliance.bicThresholdProgress * 919).toFixed(0)}€ / 91 900€)\n`;
    
    // Client analysis
    context += `\n👥 CLIENTS:\n`;
    context += `• Total actifs: ${userProfile.clients.total}\n`;
    context += `• Délai paiement moyen: ${userProfile.clients.averagePaymentDelay.toFixed(0)} jours\n`;
    
    if (userProfile.clients.topClients.length > 0) {
      const topClient = userProfile.clients.topClients[0];
      context += `• Principal client: ${topClient.name} (${topClient.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})\n`;
    }

    return context;
  }

  /**
   * Build web context section from search results
   */
  private buildWebContextSection(
    sources: SearchResult[],
    extractedContent?: ExtractedContent[]
  ): string {
    let context = '';
    
    // Sources overview
    context += `🔍 SOURCES CONSULTÉES (${sources.length}):\n`;
    sources.forEach((source, index) => {
      const trustIndicator = source.trustScore > 0.8 ? '🟢' : source.trustScore > 0.6 ? '🟡' : '🔴';
      context += `${index + 1}. ${trustIndicator} ${source.title} (${source.domain})\n`;
    });
    
    // Key findings from extracted content
    if (extractedContent && extractedContent.length > 0) {
      context += `\n📋 POINTS CLÉS EXTRAITS:\n`;
      extractedContent.forEach((content, index) => {
        if (content.keyPoints.length > 0) {
          content.keyPoints.slice(0, 3).forEach(point => {
            context += `• ${point}\n`;
          });
        }
      });
    }

    return context;
  }

  /**
   * Build Notion context section
   */
  private buildNotionContextSection(notionData: NotionFiscalData): string {
    let context = '';
    
    // Revenue comparison
    const notionRevenue = notionData.revenues.reduce((sum, r) => sum + r.amount, 0);
    context += `💼 DONNÉES NOTION:\n`;
    context += `• Revenus tracés: ${notionRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
    context += `• Clients avec projets: ${notionData.clients.filter(c => c.projects.length > 0).length}\n`;
    context += `• Notes fiscales: ${notionData.fiscalNotes.length} (${notionData.fiscalNotes.filter(n => n.priority === 'urgent').length} urgentes)\n`;
    context += `• Métriques business: ${notionData.businessMetrics.length}\n`;
    
    // Project pipeline
    const totalProjects = notionData.clients.reduce((sum, c) => sum + c.projects.length, 0);
    if (totalProjects > 0) {
      context += `• Pipeline: ${totalProjects} projets actifs\n`;
    }
    
    // Recent urgent notes
    const urgentNotes = notionData.fiscalNotes.filter(n => n.priority === 'urgent');
    if (urgentNotes.length > 0) {
      context += `\n🚨 NOTES URGENTES:\n`;
      urgentNotes.slice(0, 3).forEach(note => {
        context += `• ${note.title}\n`;
      });
    }

    return context;
  }

  /**
   * Build specific context section
   */
  private buildSpecificContextSection(specificContext: any): string {
    let context = '';
    
    if (specificContext.timeframe) {
      context += `• Période d'analyse: ${specificContext.timeframe}\n`;
    }
    
    if (specificContext.clientId) {
      context += `• Focus client: ${specificContext.clientId}\n`;
    }
    
    if (specificContext.projectName) {
      context += `• Projet concerné: ${specificContext.projectName}\n`;
    }
    
    if (specificContext.thresholdConcern) {
      context += `• ⚠️ Préoccupation seuils fiscaux mentionnée\n`;
    }
    
    if (specificContext.complianceDeadline) {
      const deadline = new Date(specificContext.complianceDeadline);
      const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      context += `• 📅 Échéance: ${deadline.toLocaleDateString('fr-FR')} (dans ${daysUntil} jours)\n`;
    }

    return context;
  }

  /**
   * Generate prompt metadata
   */
  private generatePromptMetadata(context: PromptContext): EnhancedPrompt['metadata'] {
    const confidenceFactors: string[] = [];
    const riskAlerts: string[] = [];
    
    // Data freshness
    confidenceFactors.push(`Données utilisateur: ${new Date().toLocaleDateString('fr-FR')}`);
    
    // Web data availability
    if (context.webSources && context.webSources.length > 0) {
      confidenceFactors.push(`${context.webSources.length} sources web consultées`);
      const officialSources = context.webSources.filter(s => s.trustScore > 0.8).length;
      if (officialSources > 0) {
        confidenceFactors.push(`${officialSources} sources officielles validées`);
      }
    }
    
    // Notion data integration
    if (context.userProfile.notion.isConnected) {
      confidenceFactors.push('Données Notion intégrées');
      if (context.userProfile.notion.lastSyncAt) {
        const daysSinceSync = Math.floor((Date.now() - new Date(context.userProfile.notion.lastSyncAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceSync > 7) {
          riskAlerts.push(`Sync Notion ancienne (${daysSinceSync} jours)`);
        }
      }
    }
    
    // Risk detection
    if (context.userProfile.compliance.bncThresholdProgress > 85) {
      riskAlerts.push('Risque dépassement seuil BNC');
    }
    
    if (context.userProfile.clients.averagePaymentDelay > 60) {
      riskAlerts.push('Retards de paiement importants');
    }

    return {
      dataFreshness: new Date(),
      includesWebData: !!(context.webSources && context.webSources.length > 0),
      includesNotionData: context.userProfile.notion.isConnected,
      confidenceFactors,
      riskAlerts
    };
  }

  /**
   * Create specialized prompts for different agent types
   */
  async createAgentSpecificPrompt(
    query: string,
    agentType: 'research' | 'notion' | 'general',
    userId: string,
    additionalContext?: any
  ): Promise<EnhancedPrompt> {
    // Get user fiscal profile
    const userProfile = await FiscalContextService.getUserFiscalProfile(userId);
    
    // Build context based on agent type
    const context: PromptContext = {
      userProfile,
      queryType: agentType,
      specificContext: additionalContext,
      ...(additionalContext?.webSources && { webSources: additionalContext.webSources }),
      ...(additionalContext?.extractedContent && { extractedContent: additionalContext.extractedContent })
    };
    
    return await this.generateEnhancedPrompt(query, context);
  }

  /**
   * Get prompt templates for common scenarios
   */
  getPromptTemplates(): Record<string, string> {
    return {
      thresholdAnalysis: "Analyse ma progression vers les seuils fiscaux et les impacts potentiels",
      clientAnalysis: "Analyse mes clients et identifie les risques et opportunités",
      complianceCheck: "Vérifie ma conformité fiscale et identifie les actions nécessaires",
      strategyOptimization: "Propose des optimisations fiscales adaptées à ma situation",
      projectImpact: "Analyse l'impact fiscal de mes projets Notion sur ma situation",
      urgentAlert: "Identifie les actions fiscales urgentes à prendre immédiatement"
    };
  }
}

// Singleton instance
let promptSystemInstance: EnhancedPromptSystem | null = null;

export const getEnhancedPromptSystem = (): EnhancedPromptSystem => {
  if (!promptSystemInstance) {
    promptSystemInstance = new EnhancedPromptSystem();
  }
  return promptSystemInstance;
};

export default EnhancedPromptSystem;