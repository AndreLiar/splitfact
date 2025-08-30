// Web Search Service - Internet browsing capability for fiscal information
// Provides real-time access to fiscal regulations, URSSAF updates, and tax information

import { getJson } from "google-search-results-nodejs";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
  source: 'serpapi' | 'duckduckgo' | 'direct';
  publishDate?: Date;
  domain: string;
  trustScore: number; // 0-1 based on domain reliability
}

export interface SearchOptions {
  maxResults?: number;
  language?: string;
  country?: string;
  dateRange?: 'day' | 'week' | 'month' | 'year';
  fiscalSpecific?: boolean;
  trustedSources?: boolean;
}

// Trusted fiscal information sources in France
const TRUSTED_FISCAL_DOMAINS = [
  'urssaf.fr',
  'service-public.fr',
  'impots.gouv.fr',
  'bofip.impots.gouv.fr',
  'legifrance.gouv.fr',
  'economie.gouv.fr',
  'entreprises.gouv.fr',
  'autoentrepreneur.urssaf.fr'
];

// Reliable business/fiscal news sources
const RELIABLE_NEWS_SOURCES = [
  'lesechos.fr',
  'challenges.fr',
  'bfmtv.com',
  'lefigaro.fr',
  'journaldunet.com'
];

export class WebSearchService {
  private apiKey: string | null;
  private maxCostPerSearch: number = 0.01; // Cost tracking
  
  constructor() {
    this.apiKey = process.env.SERPAPI_KEY || null;
  }

  /**
   * Search for fiscal-specific information with trusted sources priority
   */
  async searchFiscalInfo(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      maxResults = 8,
      language = 'fr',
      country = 'fr',
      fiscalSpecific = true,
      trustedSources = true
    } = options;

    try {
      // Enhance query for fiscal context
      const enhancedQuery = fiscalSpecific 
        ? `${query} micro-entrepreneur autoentrepreneur france fiscal 2025`
        : query;

      let results: SearchResult[] = [];

      // Primary search with trusted sources
      if (trustedSources) {
        results = await this.searchTrustedSources(enhancedQuery, maxResults / 2);
      }

      // Complement with general search if needed
      if (results.length < maxResults) {
        const additionalResults = await this.performGeneralSearch(
          enhancedQuery, 
          maxResults - results.length,
          { language, country }
        );
        results = [...results, ...additionalResults];
      }

      // Sort by relevance and trust score
      return results
        .sort((a, b) => (b.relevanceScore + b.trustScore) - (a.relevanceScore + a.trustScore))
        .slice(0, maxResults);

    } catch (error) {
      console.error("Fiscal search failed:", error);
      return [];
    }
  }

  /**
   * Get latest URSSAF and fiscal regulation updates
   */
  async getLatestFiscalRegulations(options: SearchOptions = {}): Promise<SearchResult[]> {
    const queries = [
      "URSSAF nouvelles dispositions micro-entrepreneur 2025",
      "seuils TVA autoentrepreneur modification 2025",
      "cotisations sociales micro-entrepreneur mise à jour",
      "régime micro-entrepreneur nouveautés fiscales"
    ];

    const allResults: SearchResult[] = [];

    for (const query of queries.slice(0, 2)) { // Limit to prevent too many API calls
      try {
        const results = await this.searchFiscalInfo(query, {
          ...options,
          maxResults: 3,
          dateRange: 'month',
          trustedSources: true
        });
        allResults.push(...results);
      } catch (error) {
        console.warn(`Failed to search for: ${query}`, error);
      }
    }

    // Deduplicate and return top results
    const uniqueResults = this.deduplicateResults(allResults);
    return uniqueResults.slice(0, options.maxResults || 6);
  }

  /**
   * Search within trusted fiscal sources only
   */
  private async searchTrustedSources(
    query: string, 
    maxResults: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Build site-specific queries
    const siteQueries = TRUSTED_FISCAL_DOMAINS
      .slice(0, 3) // Limit to prevent API overuse
      .map(domain => `site:${domain} ${query}`);

    for (const siteQuery of siteQueries) {
      try {
        const siteResults = await this.performSerpAPISearch(siteQuery, 2);
        results.push(...siteResults.map(r => ({ ...r, trustScore: 1.0 })));
      } catch (error) {
        console.warn(`Site search failed for: ${siteQuery}`, error);
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * Perform general web search
   */
  private async performGeneralSearch(
    query: string,
    maxResults: number,
    options: { language: string; country: string }
  ): Promise<SearchResult[]> {
    try {
      if (this.apiKey) {
        return await this.performSerpAPISearch(query, maxResults);
      } else {
        // Fallback to simulated search with predefined results
        return this.getFallbackResults(query, maxResults);
      }
    } catch (error) {
      console.error("General search failed:", error);
      return this.getFallbackResults(query, maxResults);
    }
  }

  /**
   * SerpAPI search implementation
   */
  private async performSerpAPISearch(
    query: string, 
    maxResults: number
  ): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error("SerpAPI key not configured");
    }

    return new Promise((resolve, reject) => {
      getJson({
        engine: "google",
        q: query,
        api_key: this.apiKey!,
        hl: "fr",
        gl: "fr",
        num: maxResults
      }, (result) => {
        if (result.error) {
          reject(new Error(result.error));
          return;
        }

        const searchResults: SearchResult[] = (result.organic_results || [])
          .slice(0, maxResults)
          .map((item: any, index: number) => ({
            title: item.title || '',
            url: item.link || '',
            snippet: item.snippet || '',
            relevanceScore: Math.max(0.1, 1 - (index * 0.1)), // Decrease with position
            source: 'serpapi' as const,
            domain: this.extractDomain(item.link || ''),
            trustScore: this.calculateTrustScore(item.link || ''),
            publishDate: item.date ? new Date(item.date) : undefined
          }));

        resolve(searchResults);
      });
    });
  }

  /**
   * Calculate trust score based on domain
   */
  private calculateTrustScore(url: string): number {
    const domain = this.extractDomain(url);
    
    if (TRUSTED_FISCAL_DOMAINS.includes(domain)) return 1.0;
    if (RELIABLE_NEWS_SOURCES.includes(domain)) return 0.8;
    if (domain.endsWith('.gouv.fr')) return 0.9;
    if (domain.endsWith('.fr')) return 0.6;
    return 0.4;
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  /**
   * Deduplicate results by URL similarity
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const domain = this.extractDomain(result.url);
      if (seen.has(domain)) return false;
      seen.add(domain);
      return true;
    });
  }

  /**
   * Fallback results when API is unavailable (for development/testing)
   */
  private getFallbackResults(query: string, maxResults: number): SearchResult[] {
    const fallbackData: SearchResult[] = [
      {
        title: "URSSAF Auto-entrepreneur - Cotisations et déclarations",
        url: "https://www.autoentrepreneur.urssaf.fr/portail/accueil.html",
        snippet: "Toutes les informations sur le régime micro-entrepreneur : cotisations, déclarations, seuils de chiffre d'affaires...",
        relevanceScore: 0.95,
        source: 'direct',
        domain: 'autoentrepreneur.urssaf.fr',
        trustScore: 1.0
      },
      {
        title: "Seuils de chiffre d'affaires du régime micro-entrepreneur",
        url: "https://entreprendre.service-public.fr/vosdroits/F23264",
        snippet: "Les seuils de chiffre d'affaires pour bénéficier du régime micro-entrepreneur en 2025...",
        relevanceScore: 0.9,
        source: 'direct',
        domain: 'service-public.fr',
        trustScore: 1.0
      },
      {
        title: "Micro-entrepreneur : franchise de TVA",
        url: "https://www.impots.gouv.fr/particulier/questions/micro-entrepreneur-suis-je-redevable-de-la-tva",
        snippet: "Conditions pour bénéficier de la franchise de TVA en tant que micro-entrepreneur...",
        relevanceScore: 0.85,
        source: 'direct',
        domain: 'impots.gouv.fr',
        trustScore: 1.0
      }
    ];

    // Filter based on query relevance
    const relevantResults = fallbackData.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase().split(' ')[0]) ||
      result.snippet.toLowerCase().includes(query.toLowerCase().split(' ')[0])
    );

    return relevantResults.slice(0, maxResults);
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    apiKey: boolean;
    lastSearch: Date | null;
    searchCount: number;
  }> {
    return {
      available: true,
      apiKey: !!this.apiKey,
      lastSearch: null, // TODO: implement tracking
      searchCount: 0 // TODO: implement tracking
    };
  }

  /**
   * Estimate search cost
   */
  getEstimatedCost(maxResults: number = 8): number {
    // Rough estimate: SerpAPI costs ~$5/1000 searches
    return Math.max(0.005, maxResults * 0.001);
  }
}

// Singleton instance
let webSearchInstance: WebSearchService | null = null;

export const getWebSearchService = (): WebSearchService => {
  if (!webSearchInstance) {
    webSearchInstance = new WebSearchService();
  }
  return webSearchInstance;
};

export default WebSearchService;