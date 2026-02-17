import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache for API responses
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const cache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 500; // Prevent unbounded memory growth

// Cleanup old cache entries every 5 minutes
const cacheCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
    }
  }
  // Evict oldest entries if still over limit
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);
cacheCleanupTimer.unref(); // Don't prevent process exit

/**
 * Cache middleware for GET requests
 * @param ttl Time to live in seconds (default: 60)
 */
export const cacheMiddleware = (ttl: number = 60) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache in development unless explicitly enabled
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_CACHE !== 'true') {
      return next();
    }

    // Validate TTL
    const safeTtl = Math.max(1, Math.min(ttl, 3600)); // Between 1s and 1 hour

    // Create cache key from full URL path and query params
    // Use originalUrl to get the complete path including the router mount point
    const cacheKey = `${req.originalUrl || req.url}:${JSON.stringify(req.query)}`;
    
    // Check if we have a valid cached response
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry) {
      const age = Date.now() - cachedEntry.timestamp;
      if (age < cachedEntry.ttl) {
        // Add cache headers
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Age', Math.floor(age / 1000).toString());
        return res.json(cachedEntry.data);
      } else {
        // Cache expired, remove it
        cache.delete(cacheKey);
      }
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses and respect max size
      if (res.statusCode >= 200 && res.statusCode < 300 && cache.size < MAX_CACHE_SIZE) {
        try {
          cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: safeTtl * 1000
          });
          res.setHeader('X-Cache', 'MISS');
        } catch (error) {
          console.error('[CACHE] Failed to cache response:', error);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache entries matching a pattern
 * Useful for invalidating cache after updates
 */
export const clearCachePattern = (pattern: string) => {
  try {
    let deletedCount = 0;
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      console.log(`[CACHE] Cleared ${deletedCount} entries matching pattern: ${pattern}`);
    }
    return deletedCount;
  } catch (error) {
    console.error('[CACHE] Error clearing cache pattern:', error);
    return 0;
  }
};

/**
 * Clear all cache
 */
export const clearAllCache = () => {
  const size = cache.size;
  cache.clear();
  console.log(`[CACHE] Cleared all ${size} cache entries`);
  return size;
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((Date.now() - entry.timestamp) / 1000),
      ttl: Math.floor(entry.ttl / 1000)
    }))
  };
};
