/**
 * Request caching service for GitHub API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  /**
   * Get cached data if it exists and is not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;

    for (const [, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      } else {
        validCount++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries: validCount,
      expiredEntries: expiredCount,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  /**
   * Get or set pattern - fetch data if not cached
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
}

/**
 * Cache key generators for different API endpoints
 */
export const CacheKeys = {
  repositories: (token: string) => `repos:${token}`,
  pullRequests: (repo: string) => `prs:${repo}`,
  pullRequestDiff: (repo: string, prNumber: number) => `diff:${repo}:${prNumber}`,
  user: (token: string) => `user:${token}`,
} as const;

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  repositories: 10 * 60 * 1000, // 10 minutes
  pullRequests: 2 * 60 * 1000,  // 2 minutes
  pullRequestDiff: 30 * 60 * 1000, // 30 minutes (diffs don't change often)
  user: 60 * 60 * 1000, // 1 hour
} as const;

// Create singleton cache instance
export const apiCache = new RequestCache({
  ttl: 5 * 60 * 1000, // 5 minutes default
  maxSize: 200,
});

/**
 * Decorator for caching method results
 */
export function cached(
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator.apply(this, args);
      
      return apiCache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

/**
 * Cache invalidation utilities
 */
export const CacheInvalidation = {
  /**
   * Invalidate all repository-related caches
   */
  invalidateRepositories(token: string): void {
    apiCache.delete(CacheKeys.repositories(token));
  },

  /**
   * Invalidate pull request caches for a repository
   */
  invalidatePullRequests(repo: string): void {
    apiCache.delete(CacheKeys.pullRequests(repo));
  },

  /**
   * Invalidate specific PR diff cache
   */
  invalidatePullRequestDiff(repo: string, prNumber: number): void {
    apiCache.delete(CacheKeys.pullRequestDiff(repo, prNumber));
  },

  /**
   * Invalidate user cache
   */
  invalidateUser(token: string): void {
    apiCache.delete(CacheKeys.user(token));
  },

  /**
   * Invalidate all caches (useful for logout)
   */
  invalidateAll(): void {
    apiCache.clear();
  },
} as const;