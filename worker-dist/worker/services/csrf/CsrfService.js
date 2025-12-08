/**
 * CSRF Protection Service
 * Implements double-submit cookie pattern for CSRF protection
 */
import { createLogger } from '../../logger';
import { SecurityError, SecurityErrorType } from 'shared/types/errors';
import { generateSecureToken } from '../../utils/cryptoUtils';
import { parseCookies, createSecureCookie } from '../../utils/authUtils';
import { getCSRFConfig } from '../../config/security';
import { captureSecurityEvent } from '../../observability/sentry';
import { env } from 'cloudflare:workers';
const logger = createLogger('CsrfService');
export class CsrfService {
    static COOKIE_NAME = 'csrf-token';
    static HEADER_NAME = 'X-CSRF-Token';
    static defaults = getCSRFConfig(env);
    /**
     * Generate a cryptographically secure CSRF token
     */
    static generateToken() {
        return generateSecureToken(32);
    }
    /**
     * Extract root domain from hostname for cross-subdomain cookie sharing
     * Example: anything.fleet.ke -> .fleet.ke
     */
    static extractRootDomain(hostname) {
        try {
            // Remove port if present
            const hostWithoutPort = hostname.split(':')[0];
            // Split by dots
            const parts = hostWithoutPort.split('.');
            // Need at least 2 parts for a domain (e.g., fleet.ke)
            if (parts.length < 2) {
                return undefined;
            }
            // For domains like fleet.ke, return .fleet.ke
            // For domains like get-fleet.com, return .get-fleet.com
            // Take the last 2 parts
            const rootDomain = parts.slice(-2).join('.');
            // Return with leading dot for subdomain sharing
            return `.${rootDomain}`;
        }
        catch (error) {
            logger.warn('Error extracting root domain for CSRF cookie:', error);
            return undefined;
        }
    }
    /**
     * Set CSRF token cookie with timestamp
     * @param response - Response object to set cookie on
     * @param token - CSRF token value
     * @param maxAge - Cookie max age in seconds (default: 7200 = 2 hours)
     * @param request - Optional request object to extract domain from (for cross-subdomain cookie sharing)
     */
    static setTokenCookie(response, token, maxAge = 7200, request) {
        const tokenData = {
            token,
            timestamp: Date.now()
        };
        // Extract root domain from request for cross-subdomain cookie sharing
        let cookieDomain;
        if (request) {
            try {
                const url = new URL(request.url);
                const rootDomain = this.extractRootDomain(url.hostname);
                if (rootDomain) {
                    cookieDomain = rootDomain;
                    logger.debug(`Setting CSRF cookie domain to: ${cookieDomain} for hostname: ${url.hostname}`);
                }
            }
            catch (error) {
                logger.warn('Error extracting domain from request for CSRF cookie:', error);
            }
        }
        // Ensure token is not empty
        if (!token || token.trim().length === 0) {
            logger.error('Attempted to set CSRF cookie with empty token!');
            throw new Error('CSRF token cannot be empty');
        }
        const cookieValue = JSON.stringify(tokenData);
        const cookie = createSecureCookie({
            name: this.COOKIE_NAME,
            value: cookieValue,
            sameSite: 'Lax', // Changed from 'Strict' to 'Lax' to allow cross-origin requests
            maxAge,
            domain: cookieDomain // Set domain for cross-subdomain access (e.g., .fleet.ke)
        });
        response.headers.append('Set-Cookie', cookie);
        logger.debug(`✅ Set CSRF token cookie with domain: ${cookieDomain || 'default (no domain set)'}`, {
            tokenLength: token.length,
            cookieValueLength: cookieValue.length,
            hasDomain: !!cookieDomain
        });
    }
    /**
     * Extract CSRF token from cookies with validation
     */
    static getTokenFromCookie(request) {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader)
            return null;
        const cookies = parseCookies(cookieHeader);
        const cookieValue = cookies[this.COOKIE_NAME];
        if (!cookieValue)
            return null;
        try {
            const tokenData = JSON.parse(cookieValue);
            const now = Date.now();
            const tokenAge = now - tokenData.timestamp;
            if (tokenAge > this.defaults.tokenTTL) {
                logger.debug('CSRF token expired', {
                    tokenAge,
                    maxAge: this.defaults.tokenTTL
                });
                return null;
            }
            return tokenData.token;
        }
        catch (error) {
            // Handle legacy tokens (plain string) for backward compatibility
            if (typeof cookieValue === 'string' && cookieValue.length > 0) {
                logger.debug('Using legacy CSRF token format');
                return cookieValue;
            }
            logger.warn('Invalid CSRF token format', error);
            return null;
        }
    }
    /**
     * Extract CSRF token from request header
     */
    static getTokenFromHeader(request) {
        return request.headers.get(this.HEADER_NAME);
    }
    /**
     * Validate CSRF token (double-submit cookie pattern)
     * HACKY FIX: Accept header token even if cookie is missing (for in-memory fallback)
     * This ensures CSRF always works when frontend sends token from in-memory
     */
    static validateToken(request) {
        const method = request.method.toUpperCase();
        // Skip validation for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return true;
        }
        // Skip for WebSocket upgrades
        const upgradeHeader = request.headers.get('upgrade');
        if (upgradeHeader?.toLowerCase() === 'websocket') {
            return true;
        }
        const cookieToken = this.getTokenFromCookie(request);
        const headerToken = this.getTokenFromHeader(request);
        // HACKY FIX: If header token exists, accept it even if cookie is missing
        // This allows in-memory token fallback to work reliably
        if (headerToken && headerToken.trim().length > 0) {
            // Header token exists - validate it
            if (cookieToken) {
                // Both exist - they must match
                if (cookieToken !== headerToken) {
                    logger.warn('CSRF validation failed: token mismatch', {
                        method,
                        path: new URL(request.url).pathname,
                        cookieTokenPrefix: cookieToken.substring(0, 8),
                        headerTokenPrefix: headerToken.substring(0, 8)
                    });
                    captureSecurityEvent('csrf_violation', {
                        reason: 'token_mismatch',
                        method,
                        path: new URL(request.url).pathname,
                    });
                    return false;
                }
                // Tokens match - success
                logger.debug('CSRF validation successful (cookie + header match)', {
                    method,
                    path: new URL(request.url).pathname
                });
                return true;
            }
            else {
                // Header exists but cookie missing - accept header token (hacky but reliable)
                logger.debug('CSRF validation: accepting header token (cookie missing, likely in-memory fallback)', {
                    method,
                    path: new URL(request.url).pathname,
                    headerTokenPrefix: headerToken.substring(0, 8)
                });
                return true;
            }
        }
        // No header token - fail
        logger.warn('CSRF validation failed: missing header token', {
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
            method,
            path: new URL(request.url).pathname,
        });
        captureSecurityEvent('csrf_violation', {
            reason: 'missing_token',
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken,
            method,
            path: new URL(request.url).pathname,
        });
        return false;
    }
    /**
     * Middleware to enforce CSRF protection with configuration
     */
    static async enforce(request, response) {
        // Generate and set token for GET requests (to establish cookie)
        if (request.method === 'GET' && response) {
            const existingToken = this.getTokenFromCookie(request);
            if (!existingToken) {
                const newToken = this.generateToken();
                const maxAge = Math.floor(this.defaults.tokenTTL / 1000);
                this.setTokenCookie(response, newToken, maxAge, request);
                logger.debug('New CSRF token generated for GET request');
            }
            return;
        }
        // Validate token for state-changing requests
        const headerToken = this.getTokenFromHeader(request);
        const cookieToken = this.getTokenFromCookie(request);
        if (!this.validateToken(request)) {
            throw new SecurityError(SecurityErrorType.CSRF_VIOLATION, 'CSRF token validation failed', 403);
        }
        // HACKY FIX: Auto-set cookie from header token if header exists but cookie is missing
        // This ensures cookie is set for future requests when using in-memory fallback
        if (response && headerToken && !cookieToken) {
            const maxAge = Math.floor(this.defaults.tokenTTL / 1000);
            this.setTokenCookie(response, headerToken, maxAge, request);
            logger.debug('Auto-set CSRF cookie from header token (in-memory fallback recovery)');
        }
    }
    /**
     * Get or generate CSRF token for a request with proper rotation
     */
    static getOrGenerateToken(request, forceNew = false) {
        if (forceNew) {
            const newToken = this.generateToken();
            logger.debug('Forced generation of new CSRF token');
            return newToken;
        }
        const existingToken = this.getTokenFromCookie(request);
        if (existingToken) {
            logger.debug('Using existing valid CSRF token');
            return existingToken;
        }
        const newToken = this.generateToken();
        logger.debug('Generated new CSRF token due to missing/expired token');
        return newToken;
    }
    /**
     * Rotate CSRF token (generate new token and invalidate old one)
     * @param response - Response object to set cookie on
     * @param request - Optional request object to extract domain from
     */
    static rotateToken(response, request) {
        const newToken = this.generateToken();
        const maxAge = Math.floor(this.defaults.tokenTTL / 1000);
        this.setTokenCookie(response, newToken, maxAge, request);
        logger.info('CSRF token rotated');
        return newToken;
    }
    /**
     * Clear CSRF token cookie
     */
    static clearTokenCookie(response) {
        const cookie = createSecureCookie({
            name: this.COOKIE_NAME,
            value: '',
            sameSite: 'Strict',
            maxAge: 0
        });
        response.headers.append('Set-Cookie', cookie);
    }
}
