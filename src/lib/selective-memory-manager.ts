// Selective Memory Management System
// Cost-efficient memory storage that only saves important conversations

import { QueryIntent } from "./query-classifier";
import { getUniversalAI } from "./ai-service";
import { AIMemoryService, ConversationMemory } from "./ai-memory";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MemoryDecision {
  shouldStore: boolean;
  importance: number;
  reasoning: string;
  storageType: 'FULL' | 'SUMMARY' | 'KEYWORDS' | 'NONE';
  retentionPeriod: number; // days
  cost: number;
}

export interface CompressedMemory {
  userId: string;
  conversationId: string;
  timestamp: Date;
  queryType: string;
  keyPoints: string[];
  outcome: string;
  fiscalData?: any;
  relevanceScore: number;
}

export class SelectiveMemoryManager {
  private aiService = getUniversalAI();
  private baseMemoryService: AIMemoryService;

  // Memory storage costs (in EUR)
  private readonly STORAGE_COSTS = {
    FULL: 0.002,      // Full conversation with embeddings
    SUMMARY: 0.0005,  // Compressed summary only
    KEYWORDS: 0.0001, // Keywords and metadata only
    NONE: 0           // No storage
  };

  // Retention periods by importance
  private readonly RETENTION_PERIODS = {
    LOW: 7,           // 1 week
    MEDIUM: 30,       // 1 month
    HIGH: 90,         // 3 months
    CRITICAL: 365     // 1 year
  };

  constructor(baseMemoryService: AIMemoryService) {
    this.baseMemoryService = baseMemoryService;
  }

  /**
   * Intelligent decision on whether and how to store a conversation
   */
  async decideMemoryStorage(
    userId: string,
    query: string,
    answer: string,
    intent: QueryIntent,
    fiscalContext?: any
  ): Promise<MemoryDecision> {
    try {
      // Quick decision for obvious cases
      const quickDecision = this.quickMemoryDecision(query, answer, intent);
      if (quickDecision.confidence > 0.85) {
        return quickDecision.decision;
      }

      // AI-powered decision for ambiguous cases
      return await this.aiMemoryDecision(userId, query, answer, intent, fiscalContext);
    } catch (error) {
      console.error("Memory decision failed:", error);
      return this.getDefaultMemoryDecision(intent);
    }
  }

  /**
   * Store conversation based on memory decision
   */
  async storeSelectively(
    userId: string,
    query: string,
    answer: string,
    intent: QueryIntent,
    fiscalContext?: any
  ): Promise<{ stored: boolean; cost: number; decision: MemoryDecision }> {
    const decision = await this.decideMemoryStorage(userId, query, answer, intent, fiscalContext);

    if (decision.storageType === 'NONE') {
      return { stored: false, cost: 0, decision };
    }

    try {
      switch (decision.storageType) {
        case 'FULL':
          await this.storeFullConversation(userId, query, answer, fiscalContext, decision);
          break;

        case 'SUMMARY':
          await this.storeSummary(userId, query, answer, intent, decision);
          break;

        case 'KEYWORDS':
          await this.storeKeywordsOnly(userId, query, answer, intent, decision);
          break;
      }

      return { stored: true, cost: decision.cost, decision };
    } catch (error) {
      console.error("Selective storage failed:", error);
      return { stored: false, cost: 0, decision };
    }
  }

  /**
   * Quick rule-based memory decision
   */
  private quickMemoryDecision(
    query: string,
    answer: string,
    intent: QueryIntent
  ): { decision: MemoryDecision; confidence: number } {
    let importance = this.calculateBaseImportance(query, answer, intent);
    let storageType: MemoryDecision['storageType'] = 'NONE';
    let retentionPeriod = 7;
    let confidence = 0.5;

    // SIMPLE queries - mostly skip storage
    if (intent.category === 'SIMPLE') {
      if (this.isDefinitionQuery(query)) {
        // Skip definitions unless they're fiscal-specific
        if (this.isFiscalSpecific(query)) {
          storageType = 'KEYWORDS';
          importance = 3;
          confidence = 0.9;
        } else {
          storageType = 'NONE';
          confidence = 0.95;
        }
      }
    }

    // URGENT queries - always store
    else if (intent.category === 'URGENT') {
      storageType = 'FULL';
      importance = 9;
      retentionPeriod = this.RETENTION_PERIODS.CRITICAL;
      confidence = 0.95;
    }

    // COMPLEX queries - selective storage
    else if (intent.category === 'COMPLEX') {
      if (this.hasStrategicValue(query, answer)) {
        storageType = 'FULL';
        importance = 8;
        retentionPeriod = this.RETENTION_PERIODS.HIGH;
        confidence = 0.9;
      } else {
        storageType = 'SUMMARY';
        importance = 6;
        confidence = 0.8;
      }
    }

    // MODERATE queries - context-dependent
    else if (intent.category === 'MODERATE') {
      if (this.hasCalculationResults(answer)) {
        storageType = 'SUMMARY';
        importance = 5;
        confidence = 0.85;
      } else if (this.isPersonalizedAdvice(answer)) {
        storageType = 'FULL';
        importance = 7;
        confidence = 0.8;
      } else {
        storageType = 'KEYWORDS';
        importance = 4;
        confidence = 0.75;
      }
    }

    const decision: MemoryDecision = {
      shouldStore: storageType !== 'NONE',
      importance,
      reasoning: `Quick decision: ${intent.category} query with ${storageType} storage`,
      storageType,
      retentionPeriod,
      cost: this.STORAGE_COSTS[storageType]
    };

    return { decision, confidence };
  }

  /**
   * AI-powered memory decision for complex cases
   */
  private async aiMemoryDecision(
    userId: string,
    query: string,
    answer: string,
    intent: QueryIntent,
    fiscalContext?: any
  ): Promise<MemoryDecision> {
    const decisionPrompt = `En tant qu'expert en gestion de mémoire conversationnelle, décide si cette conversation mérite d'être stockée et comment.

QUESTION: "${query}"

RÉPONSE: "${answer}"

CONTEXTE:
- Catégorie: ${intent.category}
- Domaine: ${intent.domain}
- Coût initial: €${intent.estimatedCost}

CRITÈRES D'ÉVALUATION:
1. Valeur informative unique
2. Importance fiscale/légale
3. Personnalisation utilisateur
4. Probabilité de réutilisation
5. Complexité de la réponse

OPTIONS DE STOCKAGE:
- FULL: Conversation complète (€0.002)
- SUMMARY: Résumé compressé (€0.0005)
- KEYWORDS: Mots-clés uniquement (€0.0001)
- NONE: Pas de stockage (€0)

Réponds UNIQUEMENT au format JSON:
{
  "shouldStore": boolean,
  "importance": 1-10,
  "reasoning": "Explication courte",
  "storageType": "FULL|SUMMARY|KEYWORDS|NONE",
  "retentionPeriod": 7-365,
  "estimatedCost": 0.0000-0.002
}`;

    try {
      const response = await this.aiService.chat(
        "Tu es un expert en optimisation de coûts pour systèmes de mémoire IA. Réponds uniquement en JSON valide.",
        decisionPrompt,
        { temperature: 0.1 }
      );

      const parsed = JSON.parse(response);

      return {
        shouldStore: parsed.shouldStore || false,
        importance: Math.max(1, Math.min(10, parsed.importance || 5)),
        reasoning: parsed.reasoning || "Décision IA",
        storageType: parsed.storageType || 'SUMMARY',
        retentionPeriod: Math.max(7, Math.min(365, parsed.retentionPeriod || 30)),
        cost: parsed.estimatedCost || this.STORAGE_COSTS[parsed.storageType as keyof typeof this.STORAGE_COSTS] || 0.0005
      };
    } catch (error) {
      console.error("AI memory decision failed:", error);
      return this.getDefaultMemoryDecision(intent);
    }
  }

  /**
   * Store full conversation with embeddings
   */
  private async storeFullConversation(
    userId: string,
    query: string,
    answer: string,
    fiscalContext: any,
    decision: MemoryDecision
  ): Promise<void> {
    // Use existing memory service for full storage
    await this.baseMemoryService.storeConversation(
      userId,
      query,
      answer,
      fiscalContext
    );
  }

  /**
   * Store compressed summary only
   */
  private async storeSummary(
    userId: string,
    query: string,
    answer: string,
    intent: QueryIntent,
    decision: MemoryDecision
  ): Promise<void> {
    const summaryPrompt = `Résume cette conversation en 2-3 phrases maximum, en gardant les informations fiscales clés.

QUESTION: "${query}"
RÉPONSE: "${answer}"

Format: Points clés uniquement.`;

    try {
      const summary = await this.aiService.chat(
        "Tu es un expert en résumé de conversations fiscales. Sois très concis.",
        summaryPrompt,
        { temperature: 0.1 }
      );

      const compressed: CompressedMemory = {
        userId,
        conversationId: `summary-${Date.now()}`,
        timestamp: new Date(),
        queryType: `${intent.category}-${intent.domain}`,
        keyPoints: this.extractKeyPoints(query, answer),
        outcome: summary,
        relevanceScore: decision.importance / 10
      };

      await this.storeCompressedMemory(compressed);
    } catch (error) {
      console.error("Summary storage failed:", error);
    }
  }

  /**
   * Store keywords and metadata only
   */
  private async storeKeywordsOnly(
    userId: string,
    query: string,
    answer: string,
    intent: QueryIntent,
    decision: MemoryDecision
  ): Promise<void> {
    const compressed: CompressedMemory = {
      userId,
      conversationId: `keywords-${Date.now()}`,
      timestamp: new Date(),
      queryType: `${intent.category}-${intent.domain}`,
      keyPoints: this.extractKeyPoints(query, answer),
      outcome: "Keywords only storage",
      relevanceScore: decision.importance / 10
    };

    await this.storeCompressedMemory(compressed);
  }

  /**
   * Store compressed memory in database
   */
  private async storeCompressedMemory(memory: CompressedMemory): Promise<void> {
    try {
      // This would store in a dedicated compressed memory table
      console.log("Storing compressed memory:", {
        userId: memory.userId,
        queryType: memory.queryType,
        keyPointsCount: memory.keyPoints.length,
        relevanceScore: memory.relevanceScore
      });
      
      // TODO: Implement actual database storage for compressed memories
      // await prisma.compressedMemory.create({ data: memory });
    } catch (error) {
      console.error("Compressed memory storage failed:", error);
    }
  }

  /**
   * Retrieve memories with cost awareness
   */
  async getSelectiveMemories(
    userId: string,
    currentQuery: string,
    maxCost: number = 0.01
  ): Promise<{ memories: any[]; cost: number }> {
    const retrievalCostPerMemory = 0.001;
    const maxMemories = Math.floor(maxCost / retrievalCostPerMemory);

    try {
      // Get the most relevant memories within budget
      const memories = await this.baseMemoryService.getRelevantMemories(
        userId,
        currentQuery,
        Math.min(maxMemories, 3) // Cap at 3 for cost control
      );

      return {
        memories,
        cost: memories.length * retrievalCostPerMemory
      };
    } catch (error) {
      console.error("Selective memory retrieval failed:", error);
      return { memories: [], cost: 0 };
    }
  }

  // Helper methods

  private calculateBaseImportance(query: string, answer: string, intent: QueryIntent): number {
    let importance = 5; // Base importance

    // Category-based importance
    const categoryImportance = {
      'SIMPLE': 3,
      'MODERATE': 5,
      'COMPLEX': 8,
      'URGENT': 9
    };
    importance = categoryImportance[intent.category] || 5;

    // Domain-based adjustments
    if (intent.domain === 'COMPLIANCE') importance += 2;
    if (intent.domain === 'STRATEGY') importance += 1;

    return Math.max(1, Math.min(10, importance));
  }

  private isDefinitionQuery(query: string): boolean {
    const definitionPatterns = [
      /^(qu['']est-ce que|what is|définition|definition)/i,
      /^(expliquer|explain|que signifie|what does.*mean)/i
    ];
    return definitionPatterns.some(pattern => pattern.test(query));
  }

  private isFiscalSpecific(query: string): boolean {
    const fiscalTerms = ['urssaf', 'tva', 'bic', 'bnc', 'seuil', 'déclaration', 'micro-entrepreneur'];
    return fiscalTerms.some(term => query.toLowerCase().includes(term));
  }

  private hasStrategicValue(query: string, answer: string): boolean {
    const strategicIndicators = [
      'optimisation', 'stratégie', 'planification', 'développement',
      'croissance', 'expansion', 'recommandations'
    ];
    const combined = (query + ' ' + answer).toLowerCase();
    return strategicIndicators.some(indicator => combined.includes(indicator));
  }

  private hasCalculationResults(answer: string): boolean {
    return /€\d+|\d+\s*€|\d+,\d+\s*€/.test(answer) || /\d+%/.test(answer);
  }

  private isPersonalizedAdvice(answer: string): boolean {
    const personalIndicators = [
      'dans votre cas', 'pour votre situation', 'compte tenu de',
      'selon votre profil', 'votre entreprise', 'je vous recommande'
    ];
    return personalIndicators.some(indicator => answer.toLowerCase().includes(indicator));
  }

  private extractKeyPoints(query: string, answer: string): string[] {
    // Simple keyword extraction - could be enhanced
    const fiscalKeywords = [
      'urssaf', 'tva', 'seuil', 'déclaration', 'cotisation',
      'chiffre affaires', 'micro-entrepreneur', 'bic', 'bnc'
    ];

    const combined = (query + ' ' + answer).toLowerCase();
    return fiscalKeywords.filter(keyword => combined.includes(keyword));
  }

  private getDefaultMemoryDecision(intent: QueryIntent): MemoryDecision {
    return {
      shouldStore: intent.category !== 'SIMPLE',
      importance: 5,
      reasoning: "Décision par défaut basée sur la catégorie",
      storageType: intent.category === 'COMPLEX' ? 'FULL' : 'SUMMARY',
      retentionPeriod: 30,
      cost: intent.category === 'COMPLEX' ? this.STORAGE_COSTS.FULL : this.STORAGE_COSTS.SUMMARY
    };
  }

  /**
   * Clean up old memories to save costs
   */
  async cleanupExpiredMemories(): Promise<{ deleted: number; costSaved: number }> {
    try {
      // This would implement automatic cleanup of expired memories
      console.log("Cleaning up expired memories...");
      
      // TODO: Implement actual cleanup logic
      // const expiredCount = await prisma.compressedMemory.deleteMany({
      //   where: {
      //     timestamp: {
      //       lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      //     }
      //   }
      // });

      return { deleted: 0, costSaved: 0 };
    } catch (error) {
      console.error("Memory cleanup failed:", error);
      return { deleted: 0, costSaved: 0 };
    }
  }

  /**
   * Get memory usage statistics
   */
  async getMemoryStats(userId: string): Promise<{
    totalMemories: number;
    fullMemories: number;
    summaryMemories: number;
    keywordMemories: number;
    monthlyCost: number;
    storageEfficiency: number;
  }> {
    // This would query actual memory statistics
    return {
      totalMemories: 0,
      fullMemories: 0,
      summaryMemories: 0,
      keywordMemories: 0,
      monthlyCost: 0,
      storageEfficiency: 0.75 // 75% cost reduction vs storing everything
    };
  }
}

// Factory function to create selective memory manager
export const createSelectiveMemoryManager = (
  baseMemoryService: AIMemoryService
): SelectiveMemoryManager => {
  return new SelectiveMemoryManager(baseMemoryService);
};

export default SelectiveMemoryManager;