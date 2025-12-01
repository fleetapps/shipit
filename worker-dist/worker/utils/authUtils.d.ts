/**
 * Centralized Authentication Utilities
 */
import type { AuthUser } from '../types/auth-types';
import type { User } from '../database/schema';
/**
 * Extract sessionId from cookie
*/
export declare function extractSessionId(request: Request): string | null;
/**
 * Token extraction priorities and methods
 */
export declare enum TokenExtractionMethod {
    AUTHORIZATION_HEADER = "authorization_header",
    COOKIE = "cookie",
    QUERY_PARAMETER = "query_parameter"
}
/**
 * Result of token extraction with metadata
 */
export interface TokenExtractionResult {
    token: string | null;
    method?: TokenExtractionMethod;
    cookieName?: string;
}
/**
 * Extract JWT token from request with multiple fallback methods
 * Prioritizes Authorization header, then cookies, then query parameters
 */
export declare function extractToken(request: Request): string | null;
/**
 * Extract JWT token from request with extraction method metadata
 * Useful for security logging and analysis
 */
export declare function extractTokenWithMetadata(request: Request): TokenExtractionResult;
/**
 * Parse cookie header into key-value pairs
 */
export declare function parseCookies(cookieHeader: string): Record<string, string>;
/**
 * Clear authentication cookie using secure cookie options
 */
export declare function clearAuthCookie(name: string): string;
/**
 * Clear all auth cookies from response using consolidated approach
 */
export declare function clearAuthCookies(response: Response): void;
/**
 * Enhanced cookie creation with security options
 */
export interface CookieOptions {
    name: string;
    value: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;
    domain?: string;
}
/**
 * Create secure cookie string with all options
 */
export declare function createSecureCookie(options: CookieOptions): string;
/**
 * Set auth cookies with proper security settings
 */
export declare function setSecureAuthCookies(response: Response, tokens: {
    accessToken: string;
    accessTokenExpiry?: number;
}): void;
/**
 * Extract request metadata for security analysis
 */
export interface RequestMetadata {
    ipAddress: string;
    userAgent: string;
    referer?: string;
    origin?: string;
    acceptLanguage?: string;
    cfConnectingIp?: string;
    cfRay?: string;
    cfCountry?: string;
    cfTimezone?: string;
}
/**
 * Extract comprehensive request metadata
 */
export declare function extractRequestMetadata(request: Request): RequestMetadata;
/**
 * Create session response
 */
export interface SessionResponse {
    user: AuthUser;
    sessionId: string;
    expiresAt: Date | null;
}
export declare function mapUserResponse(user: (Partial<User> & {
    id: string;
    email: string;
}) | AuthUser): AuthUser;
export declare function formatAuthResponse(user: AuthUser, sessionId: string, expiresAt: Date | null): SessionResponse;
