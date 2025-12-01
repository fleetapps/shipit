/**
 * Simple Cache Service using Cloudflare Cache API
 */
export class CacheService {
    /**
     * Get cached response
     */
    async get(keyOrRequest) {
        // Use caches.default for Cloudflare Workers
        const cache = caches.default;
        return await cache.match(keyOrRequest);
    }
    /**
     * Store response in cache
     */
    async put(keyOrRequest, response, options) {
        // Convert Headers to a plain object
        const headersObj = {};
        response.headers.forEach((value, key) => {
            headersObj[key] = value;
        });
        const responseToCache = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...headersObj,
                'Cache-Control': `public, max-age=${options.ttlSeconds}`,
                ...(options.tags
                    ? { 'Cache-Tag': options.tags.join(',') }
                    : {}),
            },
        });
        // Use caches.default for Cloudflare Workers
        const cache = caches.default;
        await cache.put(keyOrRequest, responseToCache);
    }
    /**
     * Generate cache key from request
     */
    generateKey(request, userId) {
        const url = new URL(request.url);
        const baseKey = `${url.pathname}${url.search}`;
        return userId ? `${baseKey}:user:${userId}` : baseKey;
    }
    /**
     * Simple wrapper for caching controller responses
     */
    async withCache(cacheKeyOrRequest, operation, options) {
        // Try to get from cache first
        const cached = await this.get(cacheKeyOrRequest);
        if (cached) {
            return cached;
        }
        // Execute operation and cache result
        const response = await operation();
        if (response.ok) {
            await this.put(cacheKeyOrRequest, response.clone(), options);
        }
        return response;
    }
}
