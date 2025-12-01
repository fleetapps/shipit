/**
 * Cache wrapper for controller methods without decorators
 */
import { CacheService } from './CacheService';
/**
 * Wraps a controller method with caching functionality
 * Works without experimental decorators - pure higher-order function
 */
export function withCache(method, options) {
    const cacheService = new CacheService();
    return async function (request, env, ctx, context) {
        // Try to get user for cache key differentiation
        let userId = context?.user?.id;
        // For public endpoints, try to get optional user if not already available
        if (!userId && 'getOptionalUser' in this && typeof this.getOptionalUser === 'function') {
            try {
                const user = await this.getOptionalUser(request, env);
                userId = user?.id;
            }
            catch {
                // Ignore auth errors for public endpoints
            }
        }
        // Use request directly as cache key (Cloudflare Workers way)
        const cacheKeyOrRequest = request;
        // Use cache wrapper
        return cacheService.withCache(cacheKeyOrRequest, () => method.call(this, request, env, ctx, context), { ttlSeconds: options.ttlSeconds, tags: options.tags });
    };
}
