// Smart Query Router - Intelligent routing system with cost optimization
// Routes queries to the most appropriate AI service based on complexity and cost

import { getQueryClassifier, QueryIntent, QueryClassification } from "./query-classifier";
import { getUniversalAI } from "./ai-service";
import { getFiscalOrchestrator } from "./fiscal-agents";
import FiscalContextService, { UserFiscalProfile } from "./fiscal-context";
import { getMemoryService } from "./ai-memory";

export interface QueryResponse {
  answer: string;
  metadata: {
    route: string;
    agents: string[];
    cost: number;
    processingTime: number;
    confidence: number;
    usedContext: boolean;
    usedMemory: boolean;
    escalated?: boolean;
  };
}

export interface QueryRoutingOptions {
  userId: string;
  maxCost?: number;
  forceRoute?: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'URGENT';
  skipMemory?: boolean;
  skipContext?: boolean;
}

export class SmartQueryRouter {
  private classifier = getQueryClassifier();
  private aiService = getUniversalAI();
  private orchestrator = getFiscalOrchestrator();
  private memoryService = getMemoryService();

  // Cost tracking per user
  private userCosts: Map<string, { daily: number; monthly: number }> = new Map();

  /**
   * Main routing method - intelligently routes queries for optimal cost/quality
   */
  async routeQuery(
    query: string, 
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    const startTime = Date.now();

    try {
      // 1. Classify the query
      let classification: QueryClassification;
      
      if (options.forceRoute) {
        // Force specific route for testing/debugging
        classification = await this.getClassificationForRoute(options.forceRoute, query);
      } else {
        // Get user context for better classification
        const userContext = options.skipContext ? null : 
          await this.getUserContext(options.userId);
        
        classification = await this.classifier.classifyQuery(query, userContext);
      }

      // 2. Check cost limits
      const canAffordRoute = await this.checkCostLimits(
        options.userId, 
        classification.intent.estimatedCost, 
        options.maxCost
      );

      if (!canAffordRoute) {
        // Downgrade to cheaper route
        classification = await this.downgradeRoute(classification, query);
      }

      // 3. Route to appropriate handler
      const response = await this.executeRoute(query, classification, options);

      // 4. Track costs
      await this.trackCost(options.userId, response.metadata.cost);

      // 5. Store in memory if needed
      if (!options.skipMemory && classification.intent.needsMemory) {
        await this.storeInMemory(options.userId, query, response.answer, classification);
      }

      response.metadata.processingTime = Date.now() - startTime;
      return response;

    } catch (error) {
      console.error("Smart routing failed:", error);
      
      // Fallback to safe simple response
      return await this.fallbackResponse(query, startTime);
    }
  }

  /**
   * Execute the determined route
   */
  private async executeRoute(
    query: string,
    classification: QueryClassification,
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    const { intent } = classification;

    switch (intent.category) {
      case 'SIMPLE':
        return await this.handleSimpleQuery(query, intent);

      case 'MODERATE':
        return await this.handleModerateQuery(query, intent, options);

      case 'COMPLEX':
        return await this.handleComplexQuery(query, intent, options);

      case 'URGENT':
        return await this.handleUrgentQuery(query, intent, options);

      default:
        throw new Error(`Unknown query category: ${intent.category}`);
    }
  }

  /**
   * Handle SIMPLE queries - Direct AI with minimal context
   */
  private async handleSimpleQuery(query: string, intent: QueryIntent): Promise<QueryResponse> {
    const systemPrompt = this.getSystemPromptForDomain(intent.domain, 'SIMPLE');
    
    const answer = await this.aiService.chat(systemPrompt, query, { temperature: 0.3 });

    return {
      answer,
      metadata: {
        route: 'SIMPLE',
        agents: ['basic-ai'],
        cost: intent.estimatedCost,
        processingTime: 0, // Will be set by router
        confidence: intent.confidence,
        usedContext: false,
        usedMemory: false
      }
    };
  }

  /**
   * Handle MODERATE queries - AI with fiscal context
   */
  private async handleModerateQuery(
    query: string, 
    intent: QueryIntent, 
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    const systemPrompt = this.getSystemPromptForDomain(intent.domain, 'MODERATE');
    
    let contextualQuery = query;
    let usedContext = false;

    // Add fiscal context if needed and available
    if (intent.needsContext && !options.skipContext) {
      try {
        const fiscalProfile = await FiscalContextService.getUserFiscalProfile(options.userId);
        const contextInfo = this.buildContextSummary(fiscalProfile);
        contextualQuery = `${query}\n\nCONTEXTE UTILISATEUR:\n${contextInfo}`;
        usedContext = true;
      } catch (contextError) {
        console.warn("Failed to load fiscal context:", contextError);
      }
    }

    const answer = await this.aiService.chat(systemPrompt, contextualQuery, { temperature: 0.5 });

    // Check if we need to escalate to complex route
    const needsEscalation = await this.shouldEscalate(answer, query);
    
    if (needsEscalation) {
      return await this.escalateToComplex(query, intent, options);
    }

    return {
      answer,
      metadata: {
        route: 'MODERATE',
        agents: ['contextual-ai'],
        cost: intent.estimatedCost,
        processingTime: 0,
        confidence: intent.confidence,
        usedContext,
        usedMemory: false
      }
    };
  }

  /**
   * Handle COMPLEX queries - Full multi-agent orchestration
   */
  private async handleComplexQuery(
    query: string, 
    intent: QueryIntent, 
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    // Get full fiscal profile for complex analysis
    const fiscalProfile = await FiscalContextService.getUserFiscalProfile(options.userId);
    
    // Get memory context for continuity
    let memoryContext = '';
    let usedMemory = false;
    
    if (intent.needsMemory && !options.skipMemory) {
      try {
        memoryContext = await this.memoryService.generateMemoryContext(options.userId, query);
        usedMemory = true;
      } catch (memoryError) {
        console.warn("Failed to load memory context:", memoryError);
      }
    }

    // Process with multi-agent orchestrator
    const answer = await this.orchestrator.processQuery(query, fiscalProfile, memoryContext);

    return {
      answer,
      metadata: {
        route: 'COMPLEX',
        agents: ['analyst', 'risk-assessor', 'expert'],
        cost: intent.estimatedCost,
        processingTime: 0,
        confidence: intent.confidence,
        usedContext: true,
        usedMemory
      }
    };
  }

  /**
   * Handle URGENT queries - Priority single agent with compliance focus
   */
  private async handleUrgentQuery(
    query: string, 
    intent: QueryIntent, 
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    const systemPrompt = `Tu es un CONSEILLER FISCAL D'URGENCE spécialisé en conformité micro-entrepreneur.

🚨 PRIORITÉ MAXIMALE - Cette requête nécessite une attention immédiate !

Tu dois:
- Identifier tous les risques immédiats
- Proposer des actions correctives URGENTES
- Mentionner les échéances critiques
- Donner des conseils clairs et actionnables
- Utiliser des émojis pour la visibilité

Sois direct, précis et rassurant. Format ta réponse avec des sections claires.`;

    // Get fiscal context for urgent matters
    let contextualQuery = query;
    
    try {
      const fiscalProfile = await FiscalContextService.getUserFiscalProfile(options.userId);
      const urgentContext = this.buildUrgentContext(fiscalProfile);
      contextualQuery = `${query}\n\nCONTEXTE URGENT:\n${urgentContext}`;
    } catch (contextError) {
      console.warn("Failed to load urgent context:", contextError);
    }

    const answer = await this.aiService.chat(systemPrompt, contextualQuery, { temperature: 0.2 });

    return {
      answer,
      metadata: {
        route: 'URGENT',
        agents: ['urgent-advisor'],
        cost: intent.estimatedCost,
        processingTime: 0,
        confidence: intent.confidence,
        usedContext: true,
        usedMemory: false
      }
    };
  }

  /**
   * Check if user can afford the estimated cost
   */
  private async checkCostLimits(
    userId: string, 
    estimatedCost: number, 
    maxCost?: number
  ): Promise<boolean> {
    if (!maxCost) return true;

    const userCost = this.userCosts.get(userId) || { daily: 0, monthly: 0 };
    
    // Check if this query would exceed limits
    return (userCost.daily + estimatedCost <= maxCost);
  }

  /**
   * Downgrade to cheaper route when cost limits are reached
   */
  private async downgradeRoute(
    classification: QueryClassification, 
    query: string
  ): Promise<QueryClassification> {
    const { intent } = classification;

    // Downgrade one level
    const downgradedCategory = intent.category === 'COMPLEX' ? 'MODERATE' :
                              intent.category === 'MODERATE' ? 'SIMPLE' :
                              'SIMPLE';

    return await this.getClassificationForRoute(downgradedCategory, query);
  }

  /**
   * Get classification for a forced route
   */
  private async getClassificationForRoute(
    route: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'URGENT', 
    query: string
  ): Promise<QueryClassification> {
    const costEstimates = {
      SIMPLE: 0.001,
      MODERATE: 0.005,
      COMPLEX: 0.025,
      URGENT: 0.015
    };

    return {
      intent: {
        category: route,
        domain: 'GENERAL',
        confidence: 0.7,
        requiredAgents: route === 'COMPLEX' ? ['analyst', 'expert'] : ['basic'],
        estimatedCost: costEstimates[route],
        priority: route === 'URGENT' ? 'CRITICAL' : 'MEDIUM',
        needsContext: route !== 'SIMPLE',
        needsMemory: route === 'COMPLEX'
      },
      reasoning: `Forced route: ${route}`
    };
  }

  /**
   * Build context summary for moderate queries
   */
  private buildContextSummary(fiscalProfile: UserFiscalProfile): string {
    return `
- CA Encaissé 2025: ${fiscalProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
- Progression seuil BNC: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%
- Nombre de clients: ${fiscalProfile.clients.total}
- Délai paiement moyen: ${fiscalProfile.clients.averagePaymentDelay.toFixed(0)} jours
`.trim();
  }

  /**
   * Build urgent context for critical queries
   */
  private buildUrgentContext(fiscalProfile: UserFiscalProfile): string {
    const urgentItems = [];
    
    if (fiscalProfile.compliance.bncThresholdProgress > 85) {
      urgentItems.push(`⚠️ SEUIL BNC: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}% (CRITIQUE)`);
    }
    
    if (fiscalProfile.clients.averagePaymentDelay > 60) {
      urgentItems.push(`💰 RETARDS PAIEMENT: ${fiscalProfile.clients.averagePaymentDelay.toFixed(0)} jours moyenne`);
    }

    return urgentItems.join('\n') || 'Aucun élément critique détecté dans le profil.';
  }

  /**
   * Check if a moderate response needs escalation to complex
   */
  private async shouldEscalate(answer: string, originalQuery: string): Promise<boolean> {
    // Simple heuristics for escalation detection
    const escalationIndicators = [
      'je ne peux pas', 'impossible de', 'trop complexe', 'nécessite une analyse',
      'consultez un expert', 'situation compliquée'
    ];

    const lowerAnswer = answer.toLowerCase();
    return escalationIndicators.some(indicator => lowerAnswer.includes(indicator));
  }

  /**
   * Escalate moderate query to complex processing
   */
  private async escalateToComplex(
    query: string, 
    originalIntent: QueryIntent, 
    options: QueryRoutingOptions
  ): Promise<QueryResponse> {
    const complexClassification: QueryClassification = {
      intent: {
        ...originalIntent,
        category: 'COMPLEX',
        estimatedCost: 0.025,
        requiredAgents: ['analyst', 'expert'],
        needsContext: true,
        needsMemory: true
      },
      reasoning: "Escalated from MODERATE due to complexity"
    };

    const response = await this.handleComplexQuery(query, complexClassification.intent, options);
    response.metadata.escalated = true;
    
    return response;
  }

  /**
   * Get appropriate system prompt based on domain and complexity
   */
  private getSystemPromptForDomain(domain: QueryIntent['domain'], complexity: string): string {
    const basePrompts = {
      FISCAL: "Tu es un conseiller fiscal spécialisé en micro-entrepreneurs français.",
      COMPLIANCE: "Tu es un expert URSSAF et conformité pour auto-entrepreneurs.",
      STRATEGY: "Tu es un consultant en stratégie fiscale et développement d'entreprise.",
      CALCULATION: "Tu es un expert-comptable spécialisé en calculs fiscaux et sociaux.",
      GENERAL: "Tu es un conseiller général pour entrepreneurs français."
    };

    const complexityModifiers = {
      SIMPLE: " Réponds de façon concise et directe.",
      MODERATE: " Fournis des conseils pratiques avec exemples si nécessaire.",
      COMPLEX: " Propose une analyse détaillée avec recommandations stratégiques."
    };

    return basePrompts[domain] + complexityModifiers[complexity as keyof typeof complexityModifiers];
  }

  /**
   * Track cost for user
   */
  private async trackCost(userId: string, cost: number): Promise<void> {
    const currentCosts = this.userCosts.get(userId) || { daily: 0, monthly: 0 };
    
    currentCosts.daily += cost;
    currentCosts.monthly += cost;
    
    this.userCosts.set(userId, currentCosts);
  }

  /**
   * Store conversation in memory if needed
   */
  private async storeInMemory(
    userId: string,
    query: string,
    answer: string,
    classification: QueryClassification
  ): Promise<void> {
    try {
      // Only store if it's worth remembering
      if (classification.intent.category === 'COMPLEX' || classification.intent.category === 'URGENT') {
        const fiscalProfile = await FiscalContextService.getUserFiscalProfile(userId);
        await this.memoryService.storeConversation(userId, query, answer, fiscalProfile);
      }
    } catch (error) {
      console.warn("Failed to store conversation in memory:", error);
    }
  }

  /**
   * Get basic user context for classification
   */
  private async getUserContext(userId: string): Promise<any> {
    try {
      const fiscalProfile = await FiscalContextService.getUserFiscalProfile(userId);
      return {
        revenue: fiscalProfile.revenue.totalPaid,
        clientsCount: fiscalProfile.clients.total,
        thresholdProgress: fiscalProfile.compliance.bncThresholdProgress
      };
    } catch {
      return null;
    }
  }

  /**
   * Fallback response when all routing fails
   */
  private async fallbackResponse(query: string, startTime: number): Promise<QueryResponse> {
    const answer = "Je rencontre une difficulté technique. Pouvez-vous reformuler votre question plus simplement ?";
    
    return {
      answer,
      metadata: {
        route: 'FALLBACK',
        agents: ['error'],
        cost: 0,
        processingTime: Date.now() - startTime,
        confidence: 0,
        usedContext: false,
        usedMemory: false
      }
    };
  }

  /**
   * Get cost analytics for a user
   */
  async getCostAnalytics(userId: string): Promise<{ daily: number; monthly: number }> {
    return this.userCosts.get(userId) || { daily: 0, monthly: 0 };
  }

  /**
   * Reset daily costs (should be called by cron job)
   */
  resetDailyCosts(): void {
    for (const [userId, costs] of this.userCosts.entries()) {
      this.userCosts.set(userId, { ...costs, daily: 0 });
    }
  }
}

// Singleton instance
let routerInstance: SmartQueryRouter | null = null;

export const getSmartRouter = (): SmartQueryRouter => {
  if (!routerInstance) {
    routerInstance = new SmartQueryRouter();
  }
  return routerInstance;
};

export default SmartQueryRouter;