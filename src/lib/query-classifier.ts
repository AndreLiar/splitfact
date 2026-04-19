// Enhanced Query Classification System
// AI-powered intent classification for optimal routing and cost management

import { getUniversalAI } from "./ai-service";

export interface QueryIntent {
  category: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'URGENT' | 'WEB_RESEARCH' | 'MULTI_AGENT';
  domain: 'FISCAL' | 'COMPLIANCE' | 'STRATEGY' | 'CALCULATION' | 'GENERAL';
  confidence: number; // 0-1
  requiredAgents: string[];
  estimatedCost: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  needsContext: boolean;
  needsMemory: boolean;
}

export interface QueryClassification {
  intent: QueryIntent;
  reasoning: string;
  alternativeRoute?: string;
}

export class EnhancedQueryClassifier {
  private aiService = getUniversalAI();

  // Cost estimates per query type (in EUR)
  private readonly COST_ESTIMATES = {
    SIMPLE: 0.001,      // Single AI call
    MODERATE: 0.005,    // AI + Context
    COMPLEX: 0.025,     // Multi-agent workflow
    URGENT: 0.015,      // Priority single agent
    WEB_RESEARCH: 0.035 // AI + Web search + Content extraction
  };

  /**
   * Classify query using AI-powered intent recognition
   */
  async classifyQuery(query: string, userContext?: any): Promise<QueryClassification> {
    try {
      // First, try fast rule-based classification for obvious cases
      const quickClassification = this.quickClassify(query);
      if (quickClassification.confidence > 0.8) {
        return {
          intent: quickClassification,
          reasoning: "High-confidence rule-based classification"
        };
      }

      // Use AI for complex classification
      return await this.aiClassifyQuery(query, userContext);
    } catch (error) {
      console.error("Query classification error:", error);
      // Fallback to safe moderate classification
      return this.getFallbackClassification(query);
    }
  }

  /**
   * Fast rule-based classification for obvious patterns
   */
  private quickClassify(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    const queryLength = query.length;

    // URGENT patterns - compliance deadlines, alerts
    const urgentPatterns = [
      /urgent/i, /alerte?/i, /immédiat/i, /deadline/i, /échéance/i,
      /redressement/i, /contrôle fiscal/i, /mise en demeure/i,
      /pénalité/i, /sanction/i, /retard déclaration/i
    ];

    if (urgentPatterns.some(pattern => pattern.test(query))) {
      return {
        category: 'URGENT',
        domain: 'COMPLIANCE',
        confidence: 0.9,
        requiredAgents: ['compliance'],
        estimatedCost: this.COST_ESTIMATES.URGENT,
        priority: 'CRITICAL',
        needsContext: true,
        needsMemory: true
      };
    }

    // SIMPLE patterns - definitions, basic facts
    const simplePatterns = [
      /^(qu['']est-ce que|what is|définition|definition)/i,
      /^(comment ça marche|how does.*work)/i,
      /^(quand|when|où|where)/i,
      /^(combien coûte|how much)/i,
      /(oui ou non|yes or no)/i
    ];

    const simpleKeywords = [
      'définition', 'definition', 'signifie', 'means', 'expliquer', 'explain',
      'différence', 'difference', 'liste', 'list'
    ];

    if (simplePatterns.some(pattern => pattern.test(query)) || 
        (queryLength < 30 && simpleKeywords.some(kw => lowerQuery.includes(kw)))) {
      return {
        category: 'SIMPLE',
        domain: this.detectDomain(query),
        confidence: 0.85,
        requiredAgents: [],
        estimatedCost: this.COST_ESTIMATES.SIMPLE,
        priority: 'LOW',
        needsContext: false,
        needsMemory: false
      };
    }

    // COMPLEX patterns - strategy, optimization, multi-factor analysis
    const complexPatterns = [
      /optimi[sz]/i, /stratégie/i, /strategy/i, /analyse? complète/i,
      /recommandations?/i, /plan d['']action/i, /action plan/i,
      /compar(er|aison)/i, /évaluation/i, /projection/i, /forecast/i,
      /(plusieurs|multiple|différent.*options)/i
    ];

    if (complexPatterns.some(pattern => pattern.test(query)) || queryLength > 150) {
      return {
        category: 'COMPLEX',
        domain: this.detectDomain(query),
        confidence: 0.8,
        requiredAgents: ['analyst', 'expert'],
        estimatedCost: this.COST_ESTIMATES.COMPLEX,
        priority: 'HIGH',
        needsContext: true,
        needsMemory: true
      };
    }

    // Default to MODERATE
    return {
      category: 'MODERATE',
      domain: this.detectDomain(query),
      confidence: 0.6,
      requiredAgents: ['basic'],
      estimatedCost: this.COST_ESTIMATES.MODERATE,
      priority: 'MEDIUM',
      needsContext: true,
      needsMemory: false
    };
  }

  /**
   * AI-powered classification for ambiguous queries
   */
  private async aiClassifyQuery(query: string, userContext?: any): Promise<QueryClassification> {
    const classificationPrompt = `En tant qu'expert en classification de requêtes fiscales pour micro-entrepreneurs français, analysez cette requête et classifiez-la.

REQUÊTE À ANALYSER: "${query}"

${userContext ? `CONTEXTE UTILISATEUR: ${JSON.stringify(userContext, null, 2)}` : ''}

CATÉGORIES DISPONIBLES:
- SIMPLE: Questions factuelles, définitions, informations de base (coût: €0.001)
- MODERATE: Calculs simples, conseils ponctuels (coût: €0.005) 
- COMPLEX: Analyses stratégiques, optimisations, comparaisons multi-facteurs (coût: €0.025)
- URGENT: Alertes de conformité, échéances critiques (coût: €0.015)

DOMAINES:
- FISCAL: Régimes fiscaux, impôts, TVA
- COMPLIANCE: URSSAF, déclarations, échéances
- STRATEGY: Optimisation, planification, croissance
- CALCULATION: Calculs de charges, revenus nets
- GENERAL: Questions générales sur l'entrepreneuriat

Répondez UNIQUEMENT au format JSON:
{
  "category": "SIMPLE|MODERATE|COMPLEX|URGENT",
  "domain": "FISCAL|COMPLIANCE|STRATEGY|CALCULATION|GENERAL",
  "confidence": 0.0-1.0,
  "reasoning": "Explication de votre choix",
  "requiredAgents": ["agent1", "agent2"],
  "priority": "LOW|MEDIUM|HIGH|CRITICAL",
  "needsContext": boolean,
  "needsMemory": boolean
}`;

    try {
      const response = await this.aiService.chat(
        "Tu es un expert en classification de requêtes fiscales. Réponds uniquement en JSON valide.",
        classificationPrompt,
        { temperature: 0.1 }
      );

      const classification = JSON.parse(response);
      
      return {
        intent: {
          ...classification,
          estimatedCost: this.COST_ESTIMATES[classification.category as keyof typeof this.COST_ESTIMATES]
        },
        reasoning: classification.reasoning
      };
    } catch (error) {
      console.error("AI classification failed:", error);
      return this.getFallbackClassification(query);
    }
  }

  /**
   * Detect domain from query keywords
   */
  private detectDomain(query: string): QueryIntent['domain'] {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.match(/urssaf|déclaration|cotisation|échéance|compliance/)) {
      return 'COMPLIANCE';
    }
    if (lowerQuery.match(/tva|bic|bnc|impôt|fiscal|régime/)) {
      return 'FISCAL';
    }
    if (lowerQuery.match(/calcul|combien|charge|net|brut|coût/)) {
      return 'CALCULATION';
    }
    if (lowerQuery.match(/stratégie|optimi|croissance|développement|plan/)) {
      return 'STRATEGY';
    }
    
    return 'GENERAL';
  }

  /**
   * Fallback classification when AI fails
   */
  private getFallbackClassification(query: string): QueryClassification {
    return {
      intent: {
        category: 'MODERATE',
        domain: 'GENERAL',
        confidence: 0.5,
        requiredAgents: ['basic'],
        estimatedCost: this.COST_ESTIMATES.MODERATE,
        priority: 'MEDIUM',
        needsContext: true,
        needsMemory: false
      },
      reasoning: "Fallback classification due to AI failure"
    };
  }

  /**
   * Get cost estimate for a query without full classification
   */
  async getQuickCostEstimate(query: string): Promise<number> {
    const quickClass = this.quickClassify(query);
    return quickClass.estimatedCost;
  }

  /**
   * Batch classify multiple queries for analytics
   */
  async batchClassify(queries: string[]): Promise<QueryClassification[]> {
    const results = await Promise.allSettled(
      queries.map(query => this.classifyQuery(query))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to classify query ${index}:`, result.reason);
        return this.getFallbackClassification(queries[index]);
      }
    });
  }
}

// Singleton instance
let classifierInstance: EnhancedQueryClassifier | null = null;

export const getQueryClassifier = (): EnhancedQueryClassifier => {
  if (!classifierInstance) {
    classifierInstance = new EnhancedQueryClassifier();
  }
  return classifierInstance;
};

export default EnhancedQueryClassifier;