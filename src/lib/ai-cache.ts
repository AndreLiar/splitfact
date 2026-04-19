// AI Response Caching System
// Reduces repeated AI calls and improves performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  userId: string;
}

interface CacheConfig {
  insights: number;
  health: number;
  suggestions: number;
  fiscalAdvice: number;
}

// Cache TTL configuration (in milliseconds)
const CACHE_CONFIG: CacheConfig = {
  insights: 15 * 60 * 1000,    // 15 minutes
  health: 30 * 60 * 1000,     // 30 minutes  
  suggestions: 10 * 60 * 1000, // 10 minutes
  fiscalAdvice: 5 * 60 * 1000, // 5 minutes
};

class AICache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  /**
   * Generate cache key from parameters
   */
  private generateKey(type: keyof CacheConfig, userId: string, context?: string): string {
    return `${type}:${userId}${context ? `:${context}` : ''}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Enforce cache size limit
   */
  private enforceSize(): void {
    if (this.cache.size <= this.maxSize) return;

    // Remove oldest entries
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toRemove = entries.slice(0, this.cache.size - this.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Get cached data if available and valid
   */
  get<T>(type: keyof CacheConfig, userId: string, context?: string): T | null {
    this.cleanup();
    
    const key = this.generateKey(type, userId, context);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) {
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  set<T>(type: keyof CacheConfig, userId: string, data: T, context?: string): void {
    const key = this.generateKey(type, userId, context);
    const ttl = CACHE_CONFIG[type];

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      userId
    });

    this.enforceSize();
  }

  /**
   * Invalidate cache entries for a user
   */
  invalidateUser(userId: string): void {
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate specific cache type for a user
   */
  invalidateType(type: keyof CacheConfig, userId: string): void {
    const prefix = `${type}:${userId}`;
    const toDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
      entries
    };
  }

  /**
   * Warmup cache with common requests
   */
  async warmup(userId: string): Promise<void> {
    // Could pre-fetch common data like health score
    // This is a placeholder for future implementation
    console.log(`Cache warmup for user ${userId} - not implemented yet`);
  }
}

// Singleton instance
let aiCacheInstance: AICache | null = null;

export const getAICache = (): AICache => {
  if (!aiCacheInstance) {
    aiCacheInstance = new AICache();
  }
  return aiCacheInstance;
};

// Utility functions for common cache operations
export const cacheUtils = {
  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T>(
    type: keyof CacheConfig,
    userId: string,
    fetchFn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    const cache = getAICache();
    
    // Try to get from cache first
    const cached = cache.get<T>(type, userId, context);
    if (cached) {
      return cached;
    }

    // Fetch new data
    const data = await fetchFn();
    
    // Cache the result
    cache.set(type, userId, data, context);
    
    return data;
  },

  /**
   * Invalidate cache after data changes
   */
  invalidateAfterUpdate(userId: string, types?: Array<keyof CacheConfig>): void {
    const cache = getAICache();
    
    if (types) {
      types.forEach(type => cache.invalidateType(type, userId));
    } else {
      cache.invalidateUser(userId);
    }
  },

  /**
   * Check if data is cached
   */
  isCached(type: keyof CacheConfig, userId: string, context?: string): boolean {
    const cache = getAICache();
    return cache.get(type, userId, context) !== null;
  }
};

export default AICache;