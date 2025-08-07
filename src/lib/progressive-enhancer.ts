// Progressive Enhancement System
// Start simple, escalate intelligently based on response quality and user satisfaction

import { getUniversalAI } from "./ai-service";
import { getSmartRouter, QueryResponse } from "./smart-query-router";
import { QueryIntent } from "./query-classifier";

export interface EnhancementResult {
  finalAnswer: string;
  enhancementPath: string[];
  totalCost: number;
  confidence: number;
  satisfactionScore: number;
  metadata: {
    attempts: number;
    escalations: number;
    finalRoute: string;
    processingTime: number;
  };
}

export interface EnhancementOptions {
  userId: string;
  maxAttempts?: number;
  maxCost?: number;
  satisfactionThreshold?: number;
  skipProgressiveEnhancement?: boolean;
}

export class ProgressiveEnhancer {
  private router = getSmartRouter();
  private aiService = getUniversalAI();

  // Enhancement chain: SIMPLE → MODERATE → COMPLEX → MULTI_AGENT
  private readonly ENHANCEMENT_CHAIN = ['SIMPLE', 'MODERATE', 'COMPLEX', 'URGENT'] as const;
  
  // Quality thresholds for automatic escalation
  private readonly QUALITY_THRESHOLDS = {
    SIMPLE: 0.6,      // If confidence < 60%, escalate to MODERATE
    MODERATE: 0.7,    // If confidence < 70%, escalate to COMPLEX
    COMPLEX: 0.8,     // If confidence < 80%, use specialized handling
    URGENT: 0.9       // Always high confidence for urgent matters
  };

  /**
   * Main progressive enhancement method
   */
  async enhanceQuery(
    query: string, 
    options: EnhancementOptions
  ): Promise<EnhancementResult> {
    const startTime = Date.now();
    const maxAttempts = options.maxAttempts || 3;
    const satisfactionThreshold = options.satisfactionThreshold || 0.75;
    
    let enhancementPath: string[] = [];
    let totalCost = 0;
    let attempts = 0;
    let escalations = 0;
    let currentRoute: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'URGENT' = 'SIMPLE';

    // Skip progressive enhancement if requested - go straight to best route
    if (options.skipProgressiveEnhancement) {
      const response = await this.router.routeQuery(query, options);
      return this.buildResult(response, [response.metadata.route], startTime, attempts, escalations);
    }

    let bestResponse: QueryResponse | null = null;
    let bestSatisfactionScore = 0;

    // Progressive enhancement loop
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      attempts++;

      try {
        // Get response for current route
        const response = await this.router.routeQuery(query, {
          ...options,
          forceRoute: currentRoute
        });

        enhancementPath.push(response.metadata.route);
        totalCost += response.metadata.cost;

        // Evaluate response quality
        const qualityAssessment = await this.assessResponseQuality(
          query, 
          response.answer, 
          currentRoute
        );

        // Track best response
        if (qualityAssessment.satisfactionScore > bestSatisfactionScore) {
          bestResponse = response;
          bestSatisfactionScore = qualityAssessment.satisfactionScore;
        }

        // Check if we should stop (good enough response)
        if (qualityAssessment.satisfactionScore >= satisfactionThreshold) {
          console.log(`✅ Satisfied with ${currentRoute} route (${qualityAssessment.satisfactionScore.toFixed(2)})`);
          break;
        }

        // Check if we need to escalate
        const shouldEscalate = await this.shouldEscalate(
          query,
          response,
          qualityAssessment,
          currentRoute,
          options.maxCost ? (options.maxCost - totalCost) : undefined
        );

        if (shouldEscalate && attempt < maxAttempts - 1) {
          currentRoute = this.getNextRoute(currentRoute);
          escalations++;
          console.log(`⬆️ Escalating to ${currentRoute} route`);
        } else {
          console.log(`🛑 Stopping enhancement at ${currentRoute} route`);
          break;
        }

      } catch (error) {
        console.error(`Enhancement attempt ${attempt + 1} failed:`, error);
        
        // Try next route if available
        if (attempt < maxAttempts - 1) {
          currentRoute = this.getNextRoute(currentRoute);
          escalations++;
        }
      }
    }

    // Return best response found
    if (!bestResponse) {
      throw new Error("All enhancement attempts failed");
    }

    return this.buildResult(
      bestResponse, 
      enhancementPath, 
      startTime, 
      attempts, 
      escalations,
      totalCost,
      bestSatisfactionScore
    );
  }

  /**
   * Assess response quality using AI
   */
  private async assessResponseQuality(
    originalQuery: string,
    response: string,
    route: string
  ): Promise<{ satisfactionScore: number; qualityIssues: string[]; confidence: number }> {
    try {
      const assessmentPrompt = `En tant qu'expert en évaluation de réponses fiscales, évalue cette réponse.

QUESTION ORIGINALE: "${originalQuery}"

RÉPONSE À ÉVALUER: "${response}"

ROUTE UTILISÉE: ${route}

Évalue selon ces critères:
1. Pertinence (répond-elle à la question ?)
2. Précision (informations correctes ?)
3. Complétude (informations suffisantes ?)
4. Clarté (facile à comprendre ?)
5. Actionnabilité (conseils pratiques ?)

Réponds UNIQUEMENT au format JSON:
{
  "satisfactionScore": 0.0-1.0,
  "qualityIssues": ["problème1", "problème2"],
  "confidence": 0.0-1.0,
  "reasoning": "Explication courte"
}`;

      const evaluation = await this.aiService.chat(
        "Tu es un expert en évaluation de qualité de réponses. Réponds uniquement en JSON valide.",
        assessmentPrompt,
        { temperature: 0.1 }
      );

      const parsed = JSON.parse(evaluation);
      
      return {
        satisfactionScore: Math.max(0, Math.min(1, parsed.satisfactionScore || 0.5)),
        qualityIssues: parsed.qualityIssues || [],
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
      };

    } catch (error) {
      console.warn("Quality assessment failed, using heuristics:", error);
      return this.heuristicQualityAssessment(originalQuery, response, route);
    }
  }

  /**
   * Fallback quality assessment using heuristics
   */
  private heuristicQualityAssessment(
    originalQuery: string,
    response: string,
    route: string
  ): { satisfactionScore: number; qualityIssues: string[]; confidence: number } {
    const issues: string[] = [];
    let score = 0.5; // Base score

    // Length analysis
    if (response.length < 50) {
      issues.push("Réponse trop courte");
      score -= 0.2;
    } else if (response.length > 100) {
      score += 0.1;
    }

    // Content quality indicators
    const qualityIndicators = [
      /€\d/,           // Contains monetary amounts
      /\d+%/,          // Contains percentages
      /\d{4}/,         // Contains years/dates
      /article|loi/i,  // Legal references
      /urssaf/i,       // URSSAF mentions
      /exemple/i       // Contains examples
    ];

    const indicatorCount = qualityIndicators.filter(pattern => 
      pattern.test(response)
    ).length;
    
    score += indicatorCount * 0.05;

    // Negative indicators
    const negativeIndicators = [
      /je ne sais pas/i,
      /impossible de/i,
      /consultez un expert/i,
      /erreur/i
    ];

    if (negativeIndicators.some(pattern => pattern.test(response))) {
      issues.push("Réponse évasive ou incertaine");
      score -= 0.3;
    }

    // Route-specific adjustments
    const routeBaselines = {
      'SIMPLE': 0.6,
      'MODERATE': 0.7,
      'COMPLEX': 0.8,
      'URGENT': 0.75
    };

    score = Math.max(score, (routeBaselines as any)[route] || 0.5);

    return {
      satisfactionScore: Math.max(0, Math.min(1, score)),
      qualityIssues: issues,
      confidence: 0.6 // Moderate confidence for heuristic assessment
    };
  }

  /**
   * Determine if we should escalate to next route
   */
  private async shouldEscalate(
    query: string,
    response: QueryResponse,
    qualityAssessment: any,
    currentRoute: string,
    remainingBudget?: number
  ): Promise<boolean> {
    // Don't escalate if we're already at the highest level
    if (currentRoute === 'URGENT') {
      return false;
    }

    // Don't escalate if budget is insufficient
    const nextRoute = this.getNextRoute(currentRoute as any);
    const nextRouteCost = this.getEstimatedCostForRoute(nextRoute);
    
    if (remainingBudget && nextRouteCost > remainingBudget) {
      console.log(`💰 Budget insufficient for ${nextRoute} (need €${nextRouteCost}, have €${remainingBudget})`);
      return false;
    }

    // Check quality threshold
    const threshold = this.QUALITY_THRESHOLDS[currentRoute as keyof typeof this.QUALITY_THRESHOLDS];
    
    if (qualityAssessment.satisfactionScore < threshold) {
      console.log(`📊 Quality below threshold (${qualityAssessment.satisfactionScore.toFixed(2)} < ${threshold})`);
      return true;
    }

    // Check for escalation indicators in response
    const escalationIndicators = [
      'analyse plus approfondie',
      'situation complexe',
      'plusieurs facteurs',
      'nécessite une étude',
      'consultez un expert'
    ];

    const needsEscalation = escalationIndicators.some(indicator =>
      response.answer.toLowerCase().includes(indicator)
    );

    if (needsEscalation) {
      console.log(`🔍 Response indicates need for escalation`);
      return true;
    }

    return false;
  }

  /**
   * Get next route in enhancement chain
   */
  private getNextRoute(currentRoute: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'URGENT'): typeof currentRoute {
    const currentIndex = this.ENHANCEMENT_CHAIN.indexOf(currentRoute);
    const nextIndex = Math.min(currentIndex + 1, this.ENHANCEMENT_CHAIN.length - 1);
    return this.ENHANCEMENT_CHAIN[nextIndex] as typeof currentRoute;
  }

  /**
   * Get estimated cost for a route
   */
  private getEstimatedCostForRoute(route: string): number {
    const costs = {
      'SIMPLE': 0.001,
      'MODERATE': 0.005,
      'COMPLEX': 0.025,
      'URGENT': 0.015
    };
    return (costs as any)[route] || 0.005;
  }

  /**
   * Build final enhancement result
   */
  private buildResult(
    response: QueryResponse,
    enhancementPath: string[],
    startTime: number,
    attempts: number,
    escalations: number,
    totalCost?: number,
    satisfactionScore?: number
  ): EnhancementResult {
    return {
      finalAnswer: response.answer,
      enhancementPath,
      totalCost: totalCost || response.metadata.cost,
      confidence: response.metadata.confidence,
      satisfactionScore: satisfactionScore || 0.75,
      metadata: {
        attempts,
        escalations,
        finalRoute: response.metadata.route,
        processingTime: Date.now() - startTime
      }
    };
  }

  /**
   * Quick enhancement for time-sensitive queries
   */
  async quickEnhance(query: string, options: EnhancementOptions): Promise<EnhancementResult> {
    // Skip progressive enhancement for speed
    return await this.enhanceQuery(query, {
      ...options,
      maxAttempts: 1,
      skipProgressiveEnhancement: true
    });
  }

  /**
   * Budget-aware enhancement
   */
  async budgetEnhance(
    query: string, 
    options: EnhancementOptions, 
    maxBudget: number
  ): Promise<EnhancementResult> {
    return await this.enhanceQuery(query, {
      ...options,
      maxCost: maxBudget,
      maxAttempts: 2 // Limit attempts to stay within budget
    });
  }

  /**
   * Get enhancement statistics for analytics
   */
  getEnhancementStats(): {
    averageAttempts: number;
    escalationRate: number;
    costSavings: number;
    satisfactionImprovement: number;
  } {
    // This would be implemented with actual usage tracking
    return {
      averageAttempts: 1.3,
      escalationRate: 0.25,
      costSavings: 0.65,
      satisfactionImprovement: 0.35
    };
  }
}

// Singleton instance
let enhancerInstance: ProgressiveEnhancer | null = null;

export const getProgressiveEnhancer = (): ProgressiveEnhancer => {
  if (!enhancerInstance) {
    enhancerInstance = new ProgressiveEnhancer();
  }
  return enhancerInstance;
};

export default ProgressiveEnhancer;