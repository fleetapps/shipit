/**
 * CSRF Protection Service
 * Implements double-submit cookie pattern for CSRF protection
 */
export declare class CsrfService {
    static readonly COOKIE_NAME = "csrf-token";
    static readonly HEADER_NAME = "X-CSRF-Token";
    static readonly defaults: import("../../config/security").CSRFConfig;
    /**
     * Generate a cryptographically secure CSRF token
     */
    static generateToken(): string;
    /**
     * Extract root domain from hostname for cross-subdomain cookie sharing
     * Example: anything.fleet.ke -> .fleet.ke
     */
    private static extractRootDomain;
    /**
     * Set CSRF token cookie with timestamp
     * @param response - Response object to set cookie on
     * @param token - CSRF token value
     * @param maxAge - Cookie max age in seconds (default: 7200 = 2 hours)
     * @param request - Optional request object to extract domain from (for cross-subdomain cookie sharing)
     */
    static setTokenCookie(response: Response, token: string, maxAge?: number, request?: Request): void;
    /**
     * Extract CSRF token from cookies with validation
     */
    static getTokenFromCookie(request: Request): string | null;
    /**
     * Extract CSRF token from request header
     */
    static getTokenFromHeader(request: Request): string | null;
    /**
     * Validate CSRF token (double-submit cookie pattern)
     * HACKY FIX: Accept header token even if cookie is missing (for in-memory fallback)
     * This ensures CSRF always works when frontend sends token from in-memory
     */
    static validateToken(request: Request): boolean;
    /**
     * Middleware to enforce CSRF protection with configuration
     */
    static enforce(request: Request, response?: Response): Promise<void>;
    /**
     * Get or generate CSRF token for a request with proper rotation
     */
    static getOrGenerateToken(request: Request, forceNew?: boolean): string;
    /**
     * Rotate CSRF token (generate new token and invalidate old one)
     * @param response - Response object to set cookie on
     * @param request - Optional request object to extract domain from
     */
    static rotateToken(response: Response, request?: Request): string;
    /**
     * Clear CSRF token cookie
     */
    static clearTokenCookie(response: Response): void;
}
