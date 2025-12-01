/**
 * Simple Cache Service using Cloudflare Cache API
 */
export interface CacheOptions {
    ttlSeconds: number;
    tags?: string[];
}
export declare class CacheService {
    /**
     * Get cached response
     */
    get(keyOrRequest: string | Request): Promise<Response | undefined>;
    /**
     * Store response in cache
     */
    put(keyOrRequest: string | Request, response: Response, options: CacheOptions): Promise<void>;
    /**
     * Generate cache key from request
     */
    generateKey(request: Request, userId?: string): string;
    /**
     * Simple wrapper for caching controller responses
     */
    withCache(cacheKeyOrRequest: string | Request, operation: () => Promise<Response>, options: CacheOptions): Promise<Response>;
}
