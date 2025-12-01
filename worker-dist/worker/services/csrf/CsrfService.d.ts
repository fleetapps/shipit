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
     * Set CSRF token cookie with timestamp
     */
    static setTokenCookie(response: Response, token: string, maxAge?: number): void;
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
     */
    static rotateToken(response: Response): string;
    /**
     * Clear CSRF token cookie
     */
    static clearTokenCookie(response: Response): void;
}
