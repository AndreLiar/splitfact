// Research Agent - Specialized AI agent for web-enhanced fiscal research
// Leverages real-time web search to provide up-to-date regulatory and fiscal information

import { getWebSearchService, SearchResult } from '../web-search-service';
import { getWebContentExtractor, ExtractedContent } from '../web-content-extractor';
import { getUniversalAI } from '../ai-service';

export interface ResearchQuery {
  query: string;
  context: {
    userRevenue?: number;
    userThresholdProgress?: number;
    businessType?: string;
    specificNeeds?: string[];
  };
  searchOptions?: {
    maxResults?: number;
    trustedSourcesOnly?: boolean;
    includeRegulations?: boolean;
    includeNews?: boolean;
  };
}

export interface ResearchResult {
  answer: string;
  confidence: number;
  sources: SearchResult[];
  extractedContent: ExtractedContent[];
  keyFindings: string[];
  recommendations: string[];
  metadata: {
    searchTime: number;
    sourcesAnalyzed: number;
    regulatoryUpdates: boolean;
    dataFreshness: 'current' | 'recent' | 'outdated';
  };
}

export class ResearchAgent {
  private webSearchService = getWebSearchService();
  private contentExtractor = getWebContentExtractor();
  private aiService = getUniversalAI();

  /**
   * Perform comprehensive fiscal research with web enhancement
   */
  async conductResearch(researchQuery: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Enhanced web search with fiscal-specific optimization
      const searchResults = await this.performEnhancedSearch(researchQuery);
      
      // Step 2: Content extraction and analysis
      const extractedContent = await this.extractAndAnalyzeContent(searchResults);
      
      // Step 3: Synthesize research findings
      const researchFindings = await this.synthesizeFindings(
        researchQuery,
        searchResults,
        extractedContent
      );
      
      // Step 4: Generate contextual recommendations
      const recommendations = await this.generateRecommendations(
        researchQuery,
        researchFindings
      );

      return {
        answer: researchFindings.synthesizedAnswer,
        confidence: researchFindings.confidence,
        sources: searchResults,
        extractedContent,
        keyFindings: researchFindings.keyFindings,
        recommendations,
        metadata: {
          searchTime: Date.now() - startTime,
          sourcesAnalyzed: extractedContent.length,
          regulatoryUpdates: this.containsRegulatoryUpdates(extractedContent),
          dataFreshness: this.assessDataFreshness(extractedContent)
        }
      };

    } catch (error) {
      console.error('Research failed:', error);
      
      // Fallback to basic AI response
      const fallbackAnswer = await this.aiService.chat(
        this.getResearchSystemPrompt(),
        researchQuery.query,
        { temperature: 0.3 }
      );

      return {
        answer: fallbackAnswer,
        confidence: 0.6,
        sources: [],
        extractedContent: [],
        keyFindings: [],
        recommendations: [],
        metadata: {
          searchTime: Date.now() - startTime,
          sourcesAnalyzed: 0,
          regulatoryUpdates: false,
          dataFreshness: 'outdated'
        }
      };
    }
  }

  /**
   * Perform enhanced search with fiscal expertise
   */
  private async performEnhancedSearch(query: ResearchQuery): Promise<SearchResult[]> {
    const searchOptions = query.searchOptions || {};
    
    // Build comprehensive search query
    const enhancedQuery = this.buildEnhancedSearchQuery(query);
    
    // Primary search with trusted fiscal sources
    const primaryResults = await this.webSearchService.searchFiscalInfo(enhancedQuery, {
      maxResults: searchOptions.maxResults || 6,
      trustedSources: searchOptions.trustedSourcesOnly !== false,
      fiscalSpecific: true
    });

    // If we need regulatory updates, do a specific search
    if (searchOptions.includeRegulations) {
      const regulatoryResults = await this.webSearchService.getLatestFiscalRegulations({
        maxResults: 3
      });
      
      // Merge and deduplicate results
      const allResults = [...primaryResults, ...regulatoryResults];
      return this.deduplicateSearchResults(allResults);
    }

    return primaryResults;
  }

  /**
   * Build contextually enhanced search query
   */
  private buildEnhancedSearchQuery(query: ResearchQuery): string {
    let enhancedQuery = query.query;
    
    // Add fiscal context
    if (query.context.userRevenue && query.context.userRevenue > 0) {
      if (query.context.userRevenue > 30000) {
        enhancedQuery += ' seuil BNC micro-entrepreneur';
      }
      if (query.context.userRevenue > 35000) {
        enhancedQuery += ' franchise TVA';
      }
    }

    // Add specific business context
    if (query.context.businessType) {
      enhancedQuery += ` ${query.context.businessType}`;
    }

    // Add year context for current regulations
    enhancedQuery += ` 2025`;

    return enhancedQuery;
  }

  /**
   * Extract and analyze content from search results
   */
  private async extractAndAnalyzeContent(searchResults: SearchResult[]): Promise<ExtractedContent[]> {
    const extractedContent: ExtractedContent[] = [];
    
    // Extract content from top reliable sources
    const topSources = searchResults
      .filter(result => result.trustScore > 0.7)
      .slice(0, 4); // Limit to prevent excessive processing
    
    for (const source of topSources) {
      try {
        const content = await this.contentExtractor.extractContent(source.url, {
          maxLength: 3000,
          validateFiscalContent: true,
          extractKeyPoints: true
        });
        
        if (content.reliability > 0.6) {
          extractedContent.push(content);
        }
      } catch (extractError) {
        console.warn(`Failed to extract content from ${source.url}:`, extractError);
      }
    }

    return extractedContent;
  }

  /**
   * Synthesize findings from research
   */
  private async synthesizeFindings(
    query: ResearchQuery,
    sources: SearchResult[],
    content: ExtractedContent[]
  ): Promise<{
    synthesizedAnswer: string;
    confidence: number;
    keyFindings: string[];
  }> {
    // Build comprehensive research context
    const researchContext = this.buildResearchContext(query, sources, content);
    
    // Use AI to synthesize findings
    const systemPrompt = this.getResearchSynthesisPrompt();
    const synthesisQuery = `${query.query}\n\n--- RECHERCHE EFFECTUÉE ---\n${researchContext}`;
    
    const synthesizedAnswer = await this.aiService.chat(
      systemPrompt,
      synthesisQuery,
      { temperature: 0.4 }
    );

    // Extract key findings from content
    const keyFindings = this.extractKeyFindings(content);
    
    // Calculate confidence based on source quality and content reliability
    const confidence = this.calculateResearchConfidence(sources, content);

    return {
      synthesizedAnswer,
      confidence,
      keyFindings
    };
  }

  /**
   * Generate contextual recommendations
   */
  private async generateRecommendations(
    query: ResearchQuery,
    findings: { synthesizedAnswer: string; keyFindings: string[] }
  ): Promise<string[]> {
    const recommendationPrompt = `En tant qu'expert fiscal, génère 3-5 recommandations actionables basées sur cette recherche.

CONTEXTE UTILISATEUR:
- CA: ${query.context.userRevenue?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || 'Non spécifié'}
- Progression seuils: ${query.context.userThresholdProgress?.toFixed(1) || 'Non spécifié'}%

RÉSULTATS DE RECHERCHE:
${findings.keyFindings.join('\n')}

Génère des recommandations spécifiques, pratiques et actionnables. Une recommandation par ligne, commencée par "•".`;

    const recommendationsText = await this.aiService.chat(
      'Tu es un conseiller fiscal expert. Donne des recommandations claires et actionnables.',
      recommendationPrompt,
      { temperature: 0.3 }
    );

    // Parse recommendations from AI response
    return recommendationsText
      .split('\n')
      .filter(line => line.trim().startsWith('•'))
      .map(line => line.trim().substring(1).trim())
      .filter(rec => rec.length > 10)
      .slice(0, 5);
  }

  /**
   * Build comprehensive research context
   */
  private buildResearchContext(
    query: ResearchQuery,
    sources: SearchResult[],
    content: ExtractedContent[]
  ): string {
    let context = '';

    // Add source summaries
    if (sources.length > 0) {
      context += 'SOURCES CONSULTÉES:\n';
      sources.forEach((source, index) => {
        context += `${index + 1}. ${source.title} (${source.domain})\n`;
        context += `   ${source.snippet}\n\n`;
      });
    }

    // Add extracted key points
    if (content.length > 0) {
      context += 'POINTS CLÉS EXTRAITS:\n';
      content.forEach((item, index) => {
        if (item.keyPoints.length > 0) {
          context += `\nSource ${index + 1} (${item.domain}):\n`;
          item.keyPoints.forEach(point => {
            context += `• ${point}\n`;
          });
        }
      });
    }

    // Add user context if available
    if (query.context.userRevenue || query.context.userThresholdProgress) {
      context += '\nCONTEXTE UTILISATEUR:\n';
      if (query.context.userRevenue) {
        context += `• CA actuel: ${query.context.userRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}\n`;
      }
      if (query.context.userThresholdProgress) {
        context += `• Progression seuils: ${query.context.userThresholdProgress.toFixed(1)}%\n`;
      }
    }

    return context.trim();
  }

  /**
   * Extract key findings from content
   */
  private extractKeyFindings(content: ExtractedContent[]): string[] {
    const allKeyPoints: string[] = [];
    
    content.forEach(item => {
      allKeyPoints.push(...item.keyPoints);
    });

    // Deduplicate and prioritize findings
    const uniqueFindings = Array.from(new Set(allKeyPoints));
    
    // Sort by length and relevance (longer findings tend to be more detailed)
    return uniqueFindings
      .filter(finding => finding.length > 20)
      .sort((a, b) => b.length - a.length)
      .slice(0, 8);
  }

  /**
   * Calculate research confidence
   */
  private calculateResearchConfidence(
    sources: SearchResult[],
    content: ExtractedContent[]
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Factor in source trust scores
    if (sources.length > 0) {
      const avgTrustScore = sources.reduce((sum, s) => sum + s.trustScore, 0) / sources.length;
      confidence += avgTrustScore * 0.3;
    }
    
    // Factor in content reliability
    if (content.length > 0) {
      const avgReliability = content.reduce((sum, c) => sum + c.reliability, 0) / content.length;
      confidence += avgReliability * 0.2;
    }

    // Factor in number of quality sources
    const qualitySources = sources.filter(s => s.trustScore > 0.8).length;
    if (qualitySources >= 3) confidence += 0.1;
    if (qualitySources >= 2) confidence += 0.05;

    return Math.min(1.0, Math.max(0.1, confidence));
  }

  /**
   * Check if content contains regulatory updates
   */
  private containsRegulatoryUpdates(content: ExtractedContent[]): boolean {
    const updateKeywords = [
      '2025', 'nouveau', 'nouvelle', 'modification', 'changement',
      'mise à jour', 'évolution', 'réforme'
    ];

    return content.some(item =>
      updateKeywords.some(keyword =>
        item.content.toLowerCase().includes(keyword) ||
        item.title.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Assess data freshness
   */
  private assessDataFreshness(content: ExtractedContent[]): 'current' | 'recent' | 'outdated' {
    if (content.length === 0) return 'outdated';

    const now = new Date();
    const recentContent = content.filter(item => {
      if (!item.publishDate) return false;
      const publishDate = new Date(item.publishDate);
      const daysSincePublish = (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePublish <= 90; // Within 3 months
    });

    if (recentContent.length >= content.length * 0.7) return 'current';
    if (recentContent.length >= content.length * 0.3) return 'recent';
    return 'outdated';
  }

  /**
   * Deduplicate search results
   */
  private deduplicateSearchResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const domain = result.domain;
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    });
  }

  /**
   * Get research system prompt
   */
  private getResearchSystemPrompt(): string {
    return `Tu es un AGENT DE RECHERCHE FISCAL EXPERT spécialisé dans la réglementation française pour micro-entrepreneurs.

🔍 **Tes capacités:**
- Accès aux informations les plus récentes via recherche web
- Analyse de sources officielles (.gouv.fr, urssaf.fr)
- Synthèse de réglementations complexes
- Contextualisation selon la situation de l'utilisateur

📋 **Instructions:**
- Utilise TOUJOURS les informations de recherche les plus récentes
- Cite tes sources officielles
- Explique les impacts pratiques
- Donne des conseils actionnables
- Signale les changements récents
- Utilise des émojis pour structurer

⚠️ **Important:** Si les informations semblent contradictoires, privilégie les sources officielles les plus récentes.`;
  }

  /**
   * Get research synthesis prompt
   */
  private getResearchSynthesisPrompt(): string {
    return `Tu es un SYNTHÉTISEUR DE RECHERCHE FISCALE. Ton rôle est de combiner les informations trouvées lors de la recherche web pour créer une réponse complète et précise.

🎯 **Mission:**
- Synthétise les informations de recherche en une réponse cohérente
- Intègre le contexte utilisateur dans tes recommandations
- Hiérarchise les informations par importance
- Identifie les actions concrètes à prendre

📊 **Format de réponse:**
1. Réponse directe à la question
2. Informations clés avec sources
3. Impact sur la situation de l'utilisateur
4. Actions recommandées

🔗 **Citation des sources:** Mentionne quand tu utilises des informations spécifiques des sources officielles.`;
  }

  /**
   * Get service capabilities
   */
  getCapabilities(): {
    features: string[];
    supportedQueries: string[];
    limitations: string[];
  } {
    return {
      features: [
        'Real-time fiscal regulation lookup',
        'Multi-source information synthesis',
        'Contextual user recommendations',
        'Source reliability assessment',
        'Regulatory update detection'
      ],
      supportedQueries: [
        'Current tax thresholds and rates',
        'URSSAF regulation changes',
        'Compliance requirements',
        'Business structure advice',
        'Deadline and obligation queries'
      ],
      limitations: [
        'Requires active internet connection',
        'Subject to search API limitations',
        'Cannot provide legal advice',
        'Information freshness depends on source updates'
      ]
    };
  }
}

// Singleton instance
let researchAgentInstance: ResearchAgent | null = null;

export const getResearchAgent = (): ResearchAgent => {
  if (!researchAgentInstance) {
    researchAgentInstance = new ResearchAgent();
  }
  return researchAgentInstance;
};

export default ResearchAgent;