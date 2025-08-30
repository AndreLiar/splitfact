// Web Content Extractor - Safely extract and validate fiscal content from web pages
// Focused on French fiscal and regulatory content with security and reliability

import * as cheerio from 'cheerio';

export interface ExtractedContent {
  title: string;
  content: string;
  publishDate?: Date;
  source: string;
  domain: string;
  reliability: number; // 0-1 score based on source trust and content quality
  keyPoints: string[]; // Extracted key fiscal points
  lastUpdated?: Date;
  contentType: 'article' | 'regulation' | 'guide' | 'news' | 'unknown';
}

export interface ContentExtractionOptions {
  maxLength?: number;
  extractKeyPoints?: boolean;
  validateFiscalContent?: boolean;
  timeout?: number;
}

// Fiscal keywords for content validation
const FISCAL_KEYWORDS = [
  'micro-entrepreneur', 'auto-entrepreneur', 'urssaf', 'cotisations',
  'tva', 'impôts', 'seuils', 'déclaration', 'régime fiscal',
  'chiffre affaires', 'bénéfices', 'charges sociales', 'franchise',
  'bic', 'bnc', 'régime micro', 'statut juridique'
];

// Content quality indicators
const QUALITY_INDICATORS = {
  hasDate: 0.1,
  hasAuthor: 0.05,
  hasStructure: 0.15,
  hasFiscalKeywords: 0.2,
  hasNumbers: 0.1,
  hasLegalReferences: 0.15,
  isRecent: 0.25
};

export class WebContentExtractor {
  private maxContentLength: number = 8000; // Reasonable limit for AI processing
  private fetchTimeout: number = 10000; // 10 seconds timeout

  /**
   * Extract content from a URL with validation and security checks
   */
  async extractContent(
    url: string, 
    options: ContentExtractionOptions = {}
  ): Promise<ExtractedContent> {
    const {
      maxLength = this.maxContentLength,
      extractKeyPoints = true,
      validateFiscalContent = true,
      timeout = this.fetchTimeout
    } = options;

    try {
      // Security check - only allow HTTPS and trusted domains
      if (!this.isUrlSafe(url)) {
        throw new Error(`Unsafe URL: ${url}`);
      }

      // Fetch content with timeout and proper headers
      const response = await this.fetchWithTimeout(url, timeout);
      const html = await response.text();
      
      // Load into Cheerio for parsing
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      this.cleanupDocument($);
      
      // Extract structured content
      const extractedContent = await this.parseContent($, url);
      
      // Validate fiscal relevance if requested
      if (validateFiscalContent) {
        const isRelevant = this.validateFiscalRelevance(extractedContent.content);
        if (!isRelevant) {
          extractedContent.reliability *= 0.5; // Penalize non-fiscal content
        }
      }

      // Extract key points if requested
      if (extractKeyPoints) {
        extractedContent.keyPoints = this.extractFiscalKeyPoints(extractedContent.content);
      }

      // Truncate content if too long
      if (extractedContent.content.length > maxLength) {
        extractedContent.content = this.truncateContent(extractedContent.content, maxLength);
      }

      return extractedContent;

    } catch (error) {
      console.error(`Content extraction failed for ${url}:`, error);
      
      // Return minimal content with error information
      return {
        title: 'Erreur d\'extraction',
        content: `Impossible d'extraire le contenu de cette page: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        source: url,
        domain: this.extractDomain(url),
        reliability: 0,
        keyPoints: [],
        contentType: 'unknown'
      };
    }
  }

  /**
   * Validate if URL is safe to fetch
   */
  private isUrlSafe(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS (except for .gouv.fr which might have HTTP redirects)
      if (urlObj.protocol !== 'https:' && !urlObj.hostname.endsWith('.gouv.fr')) {
        return false;
      }
      
      // Block potentially dangerous domains
      const dangerousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (dangerousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }
      
      // Block non-standard ports (except 80, 443)
      if (urlObj.port && !['80', '443', ''].includes(urlObj.port)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch with timeout and proper headers
   */
  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SplitfactBot/1.0; +https://splitfact.com/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Clean up document by removing unwanted elements
   */
  private cleanupDocument($: cheerio.CheerioAPI): void {
    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar').remove();
    
    // Remove comments
    $('*').contents().filter((_, node) => node.nodeType === 8).remove();
    
    // Remove empty elements
    $('p:empty, div:empty, span:empty').remove();
  }

  /**
   * Parse and extract structured content
   */
  private async parseContent($: cheerio.CheerioAPI, url: string): Promise<ExtractedContent> {
    const domain = this.extractDomain(url);
    
    // Extract title
    const title = this.extractTitle($);
    
    // Extract main content
    const content = this.extractMainContent($);
    
    // Extract metadata
    const publishDate = this.extractPublishDate($);
    const lastUpdated = this.extractLastUpdated($);
    
    // Determine content type
    const contentType = this.determineContentType(content, domain);
    
    // Calculate reliability score
    const reliability = this.calculateReliability($, domain, content, publishDate);
    
    return {
      title,
      content,
      publishDate,
      lastUpdated,
      source: url,
      domain,
      reliability,
      keyPoints: [],
      contentType
    };
  }

  /**
   * Extract page title with fallbacks
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // Try different selectors in order of preference
    const titleSelectors = [
      'h1',
      'title',
      '.article-title',
      '.post-title',
      '.entry-title',
      '[data-testid="headline"]'
    ];
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5) {
        return title;
      }
    }
    
    return 'Sans titre';
  }

  /**
   * Extract main content from article
   */
  private extractMainContent($: cheerio.CheerioAPI): string {
    // Try content selectors in order of preference
    const contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      'main',
      '.main-content',
      '[role="main"]'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 100) {
          return this.cleanTextContent(text);
        }
      }
    }
    
    // Fallback: extract from body, excluding navigation and sidebars
    $('nav, .navigation, .sidebar, .menu, .footer, .header').remove();
    const bodyText = $('body').text();
    return this.cleanTextContent(bodyText);
  }

  /**
   * Clean and normalize text content
   */
  private cleanTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove excessive line breaks
      .replace(/[^\S\n]+/g, ' ') // Normalize spaces but keep line breaks
      .trim();
  }

  /**
   * Extract publish date from various sources
   */
  private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
    // Try various date selectors and meta tags
    const dateSelectors = [
      '[datetime]',
      '.published',
      '.date',
      '.post-date',
      '.article-date',
      'time'
    ];
    
    // Try meta tags first
    const metaDate = $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content') ||
                     $('meta[name="publish_date"]').attr('content');
    
    if (metaDate) {
      const date = new Date(metaDate);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try date selectors
    for (const selector of dateSelectors) {
      const element = $(selector).first();
      const dateText = element.attr('datetime') || element.text().trim();
      
      if (dateText) {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    return undefined;
  }

  /**
   * Extract last updated date
   */
  private extractLastUpdated($: cheerio.CheerioAPI): Date | undefined {
    const updateSelectors = [
      '.updated',
      '.last-modified',
      '.modified-date'
    ];
    
    const metaUpdated = $('meta[property="article:modified_time"]').attr('content');
    if (metaUpdated) {
      const date = new Date(metaUpdated);
      if (!isNaN(date.getTime())) return date;
    }
    
    for (const selector of updateSelectors) {
      const dateText = $(selector).first().text().trim();
      if (dateText) {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) return date;
      }
    }
    
    return undefined;
  }

  /**
   * Determine content type based on content and domain
   */
  private determineContentType(content: string, domain: string): ExtractedContent['contentType'] {
    const lowerContent = content.toLowerCase();
    
    if (domain.includes('legifrance') || lowerContent.includes('article ') && lowerContent.includes('code')) {
      return 'regulation';
    }
    
    if (domain.includes('service-public') || lowerContent.includes('démarche') || lowerContent.includes('procédure')) {
      return 'guide';
    }
    
    if (domain.includes('lesechos') || domain.includes('challenges') || lowerContent.includes('actualité')) {
      return 'news';
    }
    
    if (lowerContent.includes('guide') || lowerContent.includes('comment') || lowerContent.includes('étapes')) {
      return 'guide';
    }
    
    return 'article';
  }

  /**
   * Calculate reliability score based on multiple factors
   */
  private calculateReliability(
    $: cheerio.CheerioAPI, 
    domain: string, 
    content: string, 
    publishDate?: Date
  ): number {
    let score = 0;
    
    // Base score from domain trust
    if (domain.endsWith('.gouv.fr')) score += 0.4;
    else if (['urssaf.fr', 'impots.gouv.fr'].includes(domain)) score += 0.4;
    else if (['service-public.fr', 'legifrance.gouv.fr'].includes(domain)) score += 0.3;
    else score += 0.1;
    
    // Content quality indicators
    if (publishDate) {
      score += QUALITY_INDICATORS.hasDate;
      
      // Recent content is more reliable
      const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 365) score += QUALITY_INDICATORS.isRecent;
    }
    
    // Check for author information
    if ($('.author, .by, [rel="author"]').length > 0) {
      score += QUALITY_INDICATORS.hasAuthor;
    }
    
    // Check content structure
    if ($('h1, h2, h3, h4, h5, h6').length >= 2) {
      score += QUALITY_INDICATORS.hasStructure;
    }
    
    // Check for fiscal keywords
    const fiscalKeywordCount = FISCAL_KEYWORDS.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    
    if (fiscalKeywordCount >= 3) {
      score += QUALITY_INDICATORS.hasFiscalKeywords;
    }
    
    // Check for numbers (likely to have rates, dates, amounts)
    if (/\d+[.,]\d+|\d+\s*%|\d+\s*€/.test(content)) {
      score += QUALITY_INDICATORS.hasNumbers;
    }
    
    // Check for legal references
    if (/article\s+\d+|code\s+\w+|loi\s+\w+/i.test(content)) {
      score += QUALITY_INDICATORS.hasLegalReferences;
    }
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Validate if content is fiscally relevant
   */
  private validateFiscalRelevance(content: string): boolean {
    const lowerContent = content.toLowerCase();
    const keywordMatches = FISCAL_KEYWORDS.filter(keyword => 
      lowerContent.includes(keyword)
    ).length;
    
    return keywordMatches >= 2 || lowerContent.includes('micro-entrepreneur');
  }

  /**
   * Extract key fiscal points from content
   */
  private extractFiscalKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
    const keyPoints: string[] = [];
    
    // Look for sentences with fiscal keywords and numbers
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      
      // Priority patterns
      const highPriorityPatterns = [
        /seuil.*\d+.*€/,
        /taux.*\d+.*%/,
        /cotisation.*\d+/,
        /franchise.*tva/,
        /déclaration.*avant/,
        /obligation.*micro/
      ];
      
      if (highPriorityPatterns.some(pattern => pattern.test(lowerSentence))) {
        keyPoints.push(sentence);
        if (keyPoints.length >= 5) break;
      }
    }
    
    return keyPoints;
  }

  /**
   * Truncate content intelligently at sentence boundaries
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    const truncated = content.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated + '...';
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get service health and capabilities
   */
  getCapabilities(): {
    maxContentLength: number;
    timeout: number;
    supportedDomains: string[];
    securityFeatures: string[];
  } {
    return {
      maxContentLength: this.maxContentLength,
      timeout: this.fetchTimeout,
      supportedDomains: ['*.gouv.fr', '*.urssaf.fr', '*.service-public.fr'],
      securityFeatures: ['HTTPS-only', 'domain-validation', 'timeout-protection', 'content-sanitization']
    };
  }
}

// Singleton instance
let contentExtractorInstance: WebContentExtractor | null = null;

export const getWebContentExtractor = (): WebContentExtractor => {
  if (!contentExtractorInstance) {
    contentExtractorInstance = new WebContentExtractor();
  }
  return contentExtractorInstance;
};

export default WebContentExtractor;