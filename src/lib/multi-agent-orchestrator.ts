// Multi-Agent Orchestrator - Intelligent coordination system for specialized AI agents
// Routes queries between Research Agent, Notion Agent, and fiscal agents based on complexity and data sources

import { getResearchAgent, ResearchQuery, ResearchResult } from './agents/research-agent';
import { getNotionAgent, NotionQuery, NotionAnalysisResult } from './agents/notion-agent';
import { getEnhancedPromptSystem, PromptContext } from './enhanced-prompt-system';
import FiscalContextService, { UserFiscalProfile } from './fiscal-context';
import { getUniversalAI } from './ai-service';

export interface OrchestrationQuery {
  originalQuery: string;
  userId?: string;
  context?: {
    userRevenue?: number;
    userThresholdProgress?: number;
    businessType?: string;
    urgency?: 'low' | 'medium' | 'high';
    requiresRealTimeData?: boolean;
    requiresNotionData?: boolean;
  };
}

export interface OrchestrationResult {
  answer: string;
  confidence: number;
  sources: Array<{
    type: 'web' | 'notion' | 'splitfact' | 'ai';
    title: string;
    url?: string;
    reliability: number;
  }>;
  agentsUsed: string[];
  executionTime: number;
  recommendations: string[];
  metadata: {
    queryComplexity: 'simple' | 'medium' | 'complex';
    dataSourcesUsed: string[];
    fallbackUsed: boolean;
  };
}

export interface QueryIntent {
  category: 'fiscal_regulation' | 'business_analysis' | 'compliance' | 'planning' | 'general';
  complexity: 'simple' | 'medium' | 'complex';
  requiresWebSearch: boolean;
  requiresNotionData: boolean;
  requiresCrossReference: boolean;
}

export class MultiAgentOrchestrator {
  private researchAgent = getResearchAgent();
  private notionAgent = getNotionAgent();
  private promptSystem = getEnhancedPromptSystem();
  private aiService = getUniversalAI();

  /**
   * Main orchestration method - intelligently routes queries to appropriate agents
   */
  async processQuery(query: OrchestrationQuery): Promise<OrchestrationResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Analyze query intent and complexity
      const intent = await this.analyzeQueryIntent(query);
      
      // Step 2: Determine execution strategy
      const strategy = this.determineExecutionStrategy(intent, query);
      
      // Step 3: Execute multi-agent workflow
      const results = await this.executeWorkflow(query, intent, strategy);
      
      // Step 4: Synthesize final response
      const finalAnswer = await this.synthesizeResponse(query, results, intent);

      return {
        answer: finalAnswer.answer,
        confidence: finalAnswer.confidence,
        sources: results.allSources,
        agentsUsed: strategy.agentsToUse,
        executionTime: Date.now() - startTime,
        recommendations: finalAnswer.recommendations,
        metadata: {
          queryComplexity: intent.complexity,
          dataSourcesUsed: results.dataSourcesUsed,
          fallbackUsed: results.fallbackUsed
        }
      };

    } catch (error) {
      console.error('Multi-agent orchestration failed:', error);
      
      // Fallback to basic AI response
      return await this.handleFallback(query, Date.now() - startTime);
    }
  }

  /**
   * Analyze query intent using AI classification
   */
  private async analyzeQueryIntent(query: OrchestrationQuery): Promise<QueryIntent> {
    const analysisPrompt = `Analyse cette requête fiscale française et détermine son intention:

REQUÊTE: "${query.originalQuery}"

CONTEXTE:
- CA utilisateur: ${query.context?.userRevenue ? query.context.userRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) : 'Non spécifié'}
- Type d'activité: ${query.context?.businessType || 'Non spécifié'}
- Urgence: ${query.context?.urgency || 'medium'}

Réponds UNIQUEMENT au format JSON:
{
  "category": "fiscal_regulation|business_analysis|compliance|planning|general",
  "complexity": "simple|medium|complex",
  "requiresWebSearch": boolean,
  "requiresNotionData": boolean,
  "requiresCrossReference": boolean
}

CRITÈRES:
- fiscal_regulation: Questions sur seuils, TVA, URSSAF, réglementations
- business_analysis: Analyse de performance, projections, comparaisons
- compliance: Obligations déclaratives, délais, conformité
- planning: Stratégies, optimisation, prévisions
- general: Questions générales sur le statut

- simple: Réponse directe disponible
- medium: Nécessite calculs ou comparaisons
- complex: Nécessite recherche multi-sources et analyse croisée

- requiresWebSearch: true si réglementations récentes ou actualités fiscales
- requiresNotionData: true si analyse de données business ou projets
- requiresCrossReference: true si synthèse multi-sources nécessaire`;

    try {
      const intentResponse = await this.aiService.chat(
        'Tu es un classificateur d\'intentions de requêtes fiscales. Réponds uniquement en JSON valide.',
        analysisPrompt,
        { temperature: 0.1 }
      );

      return JSON.parse(intentResponse.replace(/```json\n?|\n?```/g, '').trim());
    } catch (error) {
      console.warn('Intent analysis failed, using defaults:', error);
      
      // Default classification based on keywords
      return this.getDefaultIntent(query.originalQuery);
    }
  }

  /**
   * Determine execution strategy based on intent and available resources
   */
  private determineExecutionStrategy(intent: QueryIntent, query: OrchestrationQuery): {
    agentsToUse: string[];
    executionMode: 'sequential' | 'parallel' | 'hybrid';
    priority: 'speed' | 'accuracy' | 'comprehensive';
  } {
    const agentsToUse: string[] = ['base_ai'];
    let executionMode: 'sequential' | 'parallel' | 'hybrid' = 'sequential';
    let priority: 'speed' | 'accuracy' | 'comprehensive' = 'accuracy';

    // Determine which agents to use
    if (intent.requiresWebSearch || intent.category === 'fiscal_regulation') {
      agentsToUse.push('research_agent');
    }

    if (intent.requiresNotionData || intent.category === 'business_analysis') {
      agentsToUse.push('notion_agent');
    }

    // Adjust execution mode based on complexity
    if (intent.complexity === 'complex' || intent.requiresCrossReference) {
      executionMode = 'hybrid'; // Sequential for dependencies, parallel where possible
      priority = 'comprehensive';
    } else if (query.context?.urgency === 'high') {
      executionMode = 'parallel';
      priority = 'speed';
    }

    return { agentsToUse, executionMode, priority };
  }

  /**
   * Execute the multi-agent workflow
   */
  private async executeWorkflow(
    query: OrchestrationQuery, 
    intent: QueryIntent, 
    strategy: ReturnType<typeof this.determineExecutionStrategy>
  ): Promise<{
    researchResults?: ResearchResult;
    notionResults?: NotionAnalysisResult;
    allSources: Array<{ type: 'web' | 'notion' | 'splitfact' | 'ai'; title: string; url?: string; reliability: number; }>;
    dataSourcesUsed: string[];
    fallbackUsed: boolean;
  }> {
    const results: any = {};
    const allSources: any[] = [];
    const dataSourcesUsed: string[] = [];
    let fallbackUsed = false;

    try {
      if (strategy.executionMode === 'parallel' && strategy.agentsToUse.length > 2) {
        // Execute agents in parallel for speed
        const promises: Promise<any>[] = [];

        if (strategy.agentsToUse.includes('research_agent')) {
          promises.push(this.executeResearchAgent(query, intent));
        }

        if (strategy.agentsToUse.includes('notion_agent') && query.userId) {
          promises.push(this.executeNotionAgent(query, intent));
        }

        const parallelResults = await Promise.allSettled(promises);
        
        parallelResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const agentType = strategy.agentsToUse[index + 1]; // Skip 'base_ai'
            results[agentType] = result.value;
          } else {
            console.warn(`Agent ${strategy.agentsToUse[index + 1]} failed:`, result.reason);
            fallbackUsed = true;
          }
        });

      } else {
        // Execute agents sequentially for accuracy
        if (strategy.agentsToUse.includes('research_agent')) {
          try {
            results.research_agent = await this.executeResearchAgent(query, intent);
            dataSourcesUsed.push('web_search');
          } catch (error) {
            console.warn('Research agent failed:', error);
            fallbackUsed = true;
          }
        }

        if (strategy.agentsToUse.includes('notion_agent') && query.userId) {
          try {
            results.notion_agent = await this.executeNotionAgent(query, intent);
            dataSourcesUsed.push('notion');
          } catch (error) {
            console.warn('Notion agent failed:', error);
            fallbackUsed = true;
          }
        }
      }

      // Collect all sources
      if (results.research_agent) {
        results.research_agent.sources.forEach((source: any) => {
          allSources.push({
            type: 'web',
            title: source.title,
            url: source.url,
            reliability: source.trustScore
          });
        });
      }

      if (results.notion_agent) {
        results.notion_agent.sources.forEach((source: any) => {
          allSources.push({
            type: 'notion',
            title: source.title,
            url: source.url,
            reliability: source.reliability
          });
        });
      }

      return {
        researchResults: results.research_agent,
        notionResults: results.notion_agent,
        allSources,
        dataSourcesUsed,
        fallbackUsed
      };

    } catch (error) {
      console.error('Workflow execution failed:', error);
      return {
        allSources: [],
        dataSourcesUsed: [],
        fallbackUsed: true
      };
    }
  }

  /**
   * Execute research agent with proper query formatting
   */
  private async executeResearchAgent(query: OrchestrationQuery, intent: QueryIntent): Promise<ResearchResult> {
    const researchQuery: ResearchQuery = {
      query: query.originalQuery,
      context: {
        userRevenue: query.context?.userRevenue,
        userThresholdProgress: query.context?.userThresholdProgress,
        businessType: query.context?.businessType
      },
      searchOptions: {
        maxResults: intent.complexity === 'complex' ? 8 : 5,
        trustedSourcesOnly: intent.category === 'fiscal_regulation',
        includeRegulations: intent.category === 'fiscal_regulation' || intent.category === 'compliance',
        includeNews: intent.complexity === 'complex'
      }
    };

    return await this.researchAgent.conductResearch(researchQuery);
  }

  /**
   * Execute notion agent with proper query formatting
   */
  private async executeNotionAgent(query: OrchestrationQuery, intent: QueryIntent): Promise<NotionAnalysisResult> {
    const notionQuery: NotionQuery = {
      query: query.originalQuery,
      context: {
        userId: query.userId!,
        includeProjects: intent.category === 'business_analysis',
        includeNotes: true,
        includeMetrics: true
      },
      analysisType: intent.category === 'business_analysis' ? 'predictive' : 'descriptive'
    };

    return await this.notionAgent.analyzeWorkspace(notionQuery);
  }

  /**
   * Synthesize final response from all agent results
   */
  private async synthesizeResponse(
    query: OrchestrationQuery,
    results: any,
    intent: QueryIntent
  ): Promise<{
    answer: string;
    confidence: number;
    recommendations: string[];
  }> {
    // Build comprehensive context for synthesis
    let synthesisContext = `REQUÊTE ORIGINALE: ${query.originalQuery}\n\n`;

    // Add research results
    if (results.researchResults) {
      synthesisContext += `=== RECHERCHE WEB ===\n${results.researchResults.answer}\n\n`;
      synthesisContext += `Points clés:\n${results.researchResults.keyFindings.map((f: string) => `• ${f}`).join('\n')}\n\n`;
    }

    // Add notion results
    if (results.notionResults) {
      synthesisContext += `=== ANALYSE NOTION ===\n${results.notionResults.summary}\n\n`;
      synthesisContext += `Insights:\n${results.notionResults.insights.map((i: string) => `• ${i}`).join('\n')}\n\n`;
    }

    // Get user fiscal profile if available
    if (query.userId) {
      try {
        const fiscalProfile = await FiscalContextService.getUserFiscalProfile(query.userId);
        synthesisContext += `=== PROFIL FISCAL SPLITFACT ===\n`;
        synthesisContext += `CA: ${fiscalProfile.revenue.totalPaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
        synthesisContext += `Progression seuils: ${fiscalProfile.compliance.bncThresholdProgress.toFixed(1)}%\n`;
        synthesisContext += `Régime: Micro-entrepreneur\n\n`;
      } catch (error) {
        console.warn('Could not fetch fiscal profile:', error);
      }
    }

    // Create enhanced prompt
    const userProfile = query.userId ? await FiscalContextService.getUserFiscalProfile(query.userId).catch(() => undefined) : undefined;
    
    const promptContext: PromptContext = {
      queryType: this.mapCategoryToPromptType(intent.category),
      userProfile: userProfile!,
      webSources: results.researchResults?.sources || [],
      extractedContent: results.researchResults?.extractedContent || []
    };

    const enhancedPrompt = await this.promptSystem.generateEnhancedPrompt(
      query.originalQuery,
      promptContext
    );

    // Generate final synthesis
    const synthesisPrompt = `${enhancedPrompt.systemPrompt}\n\n=== CONTEXTE DE SYNTHÈSE ===\n${synthesisContext}`;

    const finalAnswer = await this.aiService.chat(
      synthesisPrompt,
      `Synthétise toutes ces informations pour répondre à: "${query.originalQuery}"`,
      { temperature: 0.3 }
    );

    // Calculate overall confidence
    let confidence = 0.7; // Base confidence
    if (results.researchResults) confidence += results.researchResults.confidence * 0.2;
    if (results.notionResults) confidence += results.notionResults.confidence * 0.1;

    // Gather all recommendations
    const recommendations: string[] = [];
    if (results.researchResults?.recommendations) {
      recommendations.push(...results.researchResults.recommendations);
    }
    if (results.notionResults?.recommendations) {
      recommendations.push(...results.notionResults.recommendations);
    }

    return {
      answer: finalAnswer,
      confidence: Math.min(1.0, confidence),
      recommendations: recommendations.slice(0, 5) // Limit to top 5
    };
  }

  /**
   * Map orchestration category to prompt type
   */
  private mapCategoryToPromptType(category: string): 'strategy' | 'notion' | 'compliance' | 'general' | 'calculation' | 'urgent' | 'research' {
    switch (category) {
      case 'fiscal_regulation':
      case 'compliance':
        return 'compliance';
      case 'business_analysis':
      case 'planning':
        return 'strategy';
      default:
        return 'general';
    }
  }

  /**
   * Handle fallback when orchestration fails
   */
  private async handleFallback(query: OrchestrationQuery, executionTime: number): Promise<OrchestrationResult> {
    const fallbackAnswer = await this.aiService.chat(
      'Tu es un expert fiscal français spécialisé dans les micro-entrepreneurs. Donne des conseils précis et actionables.',
      query.originalQuery,
      { temperature: 0.4 }
    );

    return {
      answer: fallbackAnswer,
      confidence: 0.6,
      sources: [{
        type: 'ai',
        title: 'Réponse AI de base',
        reliability: 0.6
      }],
      agentsUsed: ['fallback_ai'],
      executionTime,
      recommendations: [],
      metadata: {
        queryComplexity: 'simple',
        dataSourcesUsed: ['ai_base'],
        fallbackUsed: true
      }
    };
  }

  /**
   * Get default intent when AI classification fails
   */
  private getDefaultIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    // Keyword-based classification
    const keywords = {
      fiscal_regulation: ['seuil', 'tva', 'urssaf', 'cotisation', 'impôt', 'déclaration'],
      business_analysis: ['chiffre', 'analyse', 'performance', 'évolution', 'croissance'],
      compliance: ['obligation', 'délai', 'déclaratif', 'conformité'],
      planning: ['optimisation', 'stratégie', 'prévision', 'conseil']
    };

    let category: QueryIntent['category'] = 'general';
    for (const [cat, kws] of Object.entries(keywords)) {
      if (kws.some(kw => lowerQuery.includes(kw))) {
        category = cat as QueryIntent['category'];
        break;
      }
    }

    return {
      category,
      complexity: lowerQuery.length > 100 ? 'complex' : 'medium',
      requiresWebSearch: lowerQuery.includes('nouveau') || lowerQuery.includes('2025') || lowerQuery.includes('récent'),
      requiresNotionData: lowerQuery.includes('projet') || lowerQuery.includes('analyse'),
      requiresCrossReference: category !== 'general'
    };
  }

  /**
   * Get orchestrator capabilities
   */
  getCapabilities(): {
    features: string[];
    supportedWorkflows: string[];
    agentTypes: string[];
  } {
    return {
      features: [
        'Intelligent query routing',
        'Multi-agent coordination',
        'Cross-platform data synthesis',
        'Execution strategy optimization',
        'Fallback handling'
      ],
      supportedWorkflows: [
        'Sequential agent execution',
        'Parallel agent execution',
        'Hybrid execution modes',
        'Priority-based routing'
      ],
      agentTypes: [
        'Research Agent (web search)',
        'Notion Agent (workspace integration)',
        'Base AI (fallback)',
        'Prompt Enhancement System'
      ]
    };
  }
}

// Singleton instance
let orchestratorInstance: MultiAgentOrchestrator | null = null;

export const getMultiAgentOrchestrator = (): MultiAgentOrchestrator => {
  if (!orchestratorInstance) {
    orchestratorInstance = new MultiAgentOrchestrator();
  }
  return orchestratorInstance;
};

export default MultiAgentOrchestrator;