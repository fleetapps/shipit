/**
 * Authentication Middleware
 * Handles JWT validation and session management
 */

import { AuthUserSession } from '../../types/auth-types';
import { createLogger } from '../../logger';
import { AuthService } from '../../database/services/AuthService';
import { extractToken } from '../../utils/authUtils';

const logger = createLogger('AuthMiddleware');
/**
 * Validate JWT token and return user
 */
export async function validateToken(
    token: string,
    env: Env
): Promise<AuthUserSession | null> {
    try {
        // Use AuthService for token validation and user retrieval
        const authService = new AuthService(env);
        return authService.validateTokenAndGetUser(token, env);
    } catch (error) {
        logger.error('Token validation error', error);
        return null;
    }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(
    request: Request,
    env: Env
): Promise<AuthUserSession | null> {
    try {
        console.log(`[AUTH_MIDDLEWARE] ========== AUTH MIDDLEWARE START ==========`);
        console.log(`[AUTH_MIDDLEWARE] Request URL: ${request.url}`);
        console.log(`[AUTH_MIDDLEWARE] Request method: ${request.method}`);
        
        // Extract token
        console.log(`[AUTH_MIDDLEWARE] Calling extractToken(request)...`);
        const token = extractToken(request);
        console.log(`[AUTH_MIDDLEWARE] Token extracted: ${!!token}, length: ${token?.length || 0}`);
        
        if (token) {
            console.log(`[AUTH_MIDDLEWARE] Token found, calling validateToken(token, env)...`);
            const userResponse = await validateToken(token, env);
            if (userResponse) {
                console.log(`[AUTH_MIDDLEWARE] ✅ User authenticated successfully. User ID: ${userResponse.user.id}, email: ${userResponse.user.email}`);
                logger.debug('User authenticated', { userId: userResponse.user.id });
                return userResponse;
            } else {
                console.log(`[AUTH_MIDDLEWARE] ❌ Token validation failed - userResponse is null`);
            }
        } else {
            console.log(`[AUTH_MIDDLEWARE] ⚠️ No token found in request`);
        }
        
        console.log(`[AUTH_MIDDLEWARE] No authentication found - returning null`);
        logger.debug('No authentication found');
        return null;
    } catch (error) {
        console.error(`[AUTH_MIDDLEWARE] ❌ ERROR in authMiddleware:`, error);
        logger.error('Auth middleware error', error);
        return null;
    }
}