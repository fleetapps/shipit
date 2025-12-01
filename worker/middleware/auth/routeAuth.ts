/**
 * Route Authentication Middleware
 */

import { createMiddleware } from 'hono/factory';
import { AuthUser } from '../../types/auth-types';
import { createLogger } from '../../logger';
import { AppService } from '../../database';
import { authMiddleware } from './auth';
import { RateLimitService } from '../../services/rate-limit/rateLimits';
import { errorResponse } from '../../api/responses';
import { Context } from 'hono';
import { AppEnv } from '../../types/appenv';
import { RateLimitExceededError } from 'shared/types/errors';
import * as Sentry from '@sentry/cloudflare';
import { getUserConfigurableSettings } from 'worker/config';

const logger = createLogger('RouteAuth');

/**
 * Authentication levels for route protection
 */
export type AuthLevel = 'public' | 'authenticated' | 'owner-only';

/**
 * Authentication requirement configuration
 */
export interface AuthRequirement {
    required: boolean;
    level: 'public' | 'authenticated' | 'owner-only';
    resourceOwnershipCheck?: (user: AuthUser, params: Record<string, string>, env: Env) => Promise<boolean>;
}

/**
 * Common auth requirement configurations
 */
export const AuthConfig = {
    // Public route - no authentication required
    public: { 
        required: false,
        level: 'public' as const
    },
    
    // Require full authentication (no anonymous users)
    authenticated: { 
        required: true, 
        level: 'authenticated' as const 
    },
    
    // Require resource ownership (for app editing)
    ownerOnly: { 
        required: true, 
        level: 'owner-only' as const,
        resourceOwnershipCheck: checkAppOwnership
    },
    
    // Public read access, but owner required for modifications
    publicReadOwnerWrite: { 
        required: false 
    }
} as const;

/**
 * Route authentication logic that enforces authentication requirements
 */
export async function routeAuthChecks(
    user: AuthUser | null,
    env: Env,
    requirement: AuthRequirement,
    params?: Record<string, string>
): Promise<{ success: boolean; response?: Response }> {
    try {
        console.log(`[ROUTE_AUTH_CHECKS] ========== ROUTE AUTH CHECKS START ==========`);
        console.log(`[ROUTE_AUTH_CHECKS] User present: ${!!user}, user ID: ${user?.id || 'N/A'}`);
        console.log(`[ROUTE_AUTH_CHECKS] Requirement:`, requirement);
        console.log(`[ROUTE_AUTH_CHECKS] Params:`, params);
        
        // Public routes always pass
        if (requirement.level === 'public') {
            console.log(`[ROUTE_AUTH_CHECKS] ✅ Public route - authentication not required`);
            return { success: true };
        }

        // For authenticated routes
        if (requirement.level === 'authenticated') {
            console.log(`[ROUTE_AUTH_CHECKS] Checking authenticated route requirement...`);
            if (!user) {
                console.log(`[ROUTE_AUTH_CHECKS] ❌ No user - authentication required`);
                return {
                    success: false,
                    response: createAuthRequiredResponse()
                };
            }

            console.log(`[ROUTE_AUTH_CHECKS] ✅ User authenticated`);
            return { success: true };
        }

        // For owner-only routes
        if (requirement.level === 'owner-only') {
            console.log(`[ROUTE_AUTH_CHECKS] Checking owner-only route requirement...`);
            if (!user) {
                console.log(`[ROUTE_AUTH_CHECKS] ❌ No user - account required`);
                return {
                    success: false,
                    response: createAuthRequiredResponse('Account required')
                };
            }

            // Check resource ownership if function provided
            if (requirement.resourceOwnershipCheck) {
                console.log(`[ROUTE_AUTH_CHECKS] Resource ownership check function provided`);
                if (params) {
                    console.log(`[ROUTE_AUTH_CHECKS] Calling resourceOwnershipCheck with params:`, params);
                    const isOwner = await requirement.resourceOwnershipCheck(user, params, env);
                    console.log(`[ROUTE_AUTH_CHECKS] Resource ownership check result: ${isOwner}`);
                    return {
                        success: isOwner,
                        response: isOwner ? undefined : createForbiddenResponse('You can only access your own resources')
                    }
                }
                console.log(`[ROUTE_AUTH_CHECKS] ❌ No params provided for resource ownership check`);
                return {
                    success: false,
                    response: createForbiddenResponse('Invalid resource ownership')
                };
            }

            console.log(`[ROUTE_AUTH_CHECKS] ✅ Owner-only route - user present, no ownership check required`);
            return { success: true };
        }

        // Default fallback
        console.log(`[ROUTE_AUTH_CHECKS] ✅ Default fallback - allowing access`);
        return { success: true };
    } catch (error) {
        console.error(`[ROUTE_AUTH_CHECKS] ❌ ERROR in route auth checks:`, error);
        logger.error('Error in route auth middleware', error);
        return {
            success: false,
            response: new Response(JSON.stringify({
                success: false,
                error: 'Authentication check failed'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        };
    }
}

/*
 * Enforce authentication requirement
 */
export async function enforceAuthRequirement(c: Context<AppEnv>) : Promise<Response | undefined> {
    console.log(`[ROUTE_AUTH] ========== ENFORCE AUTH REQUIREMENT START ==========`);
    console.log(`[ROUTE_AUTH] Request URL: ${c.req.url}`);
    console.log(`[ROUTE_AUTH] Request method: ${c.req.method}`);
    
    let user: AuthUser | null = c.get('user') || null;
    console.log(`[ROUTE_AUTH] User from context: ${!!user}, user ID: ${user?.id || 'N/A'}`);

    const requirement = c.get('authLevel');
    if (!requirement) {
        console.error(`[ROUTE_AUTH] ❌ No authentication level found in context`);
        logger.error('No authentication level found');
        return errorResponse('No authentication level found', 500);
    }
    
    console.log(`[ROUTE_AUTH] Auth requirement:`, {
        required: requirement.required,
        level: requirement.level,
        hasResourceOwnershipCheck: !!requirement.resourceOwnershipCheck
    });
    
    // Only perform auth if we need it or don't have user yet
    if (!user && (requirement.level === 'authenticated' || requirement.level === 'owner-only')) {
        console.log(`[ROUTE_AUTH] No user in context and auth required. Calling authMiddleware...`);
        const userSession = await authMiddleware(c.req.raw, c.env);
        console.log(`[ROUTE_AUTH] authMiddleware returned: ${!!userSession}, user ID: ${userSession?.user?.id || 'N/A'}`);
        if (!userSession) {
            console.log(`[ROUTE_AUTH] ❌ authMiddleware returned null - authentication failed`);
            return errorResponse('Authentication required', 401);
        }
        console.log(`[ROUTE_AUTH] ✅ User authenticated. Setting user in context...`);
        user = userSession.user;
        c.set('user', user);
		c.set('sessionId', userSession.sessionId);
		Sentry.setUser({ id: user.id, email: user.email });

        const config = await getUserConfigurableSettings(c.env, user.id);
        c.set('config', config);

        try {
            await RateLimitService.enforceAuthRateLimit(c.env, config.security.rateLimit, user, c.req.raw);
        } catch (error) {
            if (error instanceof RateLimitExceededError) {
                return errorResponse(error, 429);
            }
            logger.error('Error enforcing auth rate limit', error);
            return errorResponse('Internal server error', 500);
        }
    }
    
    const params = c.req.param();
    const env = c.env;
    console.log(`[ROUTE_AUTH] Calling routeAuthChecks with user: ${!!user}, requirement: ${requirement.level}, params:`, params);
    const result = await routeAuthChecks(user, env, requirement, params);
    if (!result.success) {
        logger.warn('Authentication check failed', result.response, requirement, user);
        return result.response;
    }
}

export function setAuthLevel(requirement: AuthRequirement) {
    return createMiddleware(async (c, next) => {
        c.set('authLevel', requirement);
        return await next();
    })
}

/**
 * Create standardized authentication required response
 */
function createAuthRequiredResponse(message?: string): Response {
    return new Response(JSON.stringify({
        success: false,
        error: {
            type: 'AUTHENTICATION_REQUIRED',
            message: message || 'Authentication required',
            action: 'login'
        }
    }), {
        status: 401,
        headers: {
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="API"'
        }
    });
}

/**
 * Create standardized forbidden response
 */
function createForbiddenResponse(message: string): Response {
    return new Response(JSON.stringify({
        success: false,
        error: {
            type: 'FORBIDDEN',
            message,
            action: 'insufficient_permissions'
        }
    }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
    });
}

/**
 * Check if user owns an app by agent/app ID
 */
export async function checkAppOwnership(user: AuthUser, params: Record<string, string>, env: Env): Promise<boolean> {
    try {
        const agentId = params.agentId || params.id;
        if (!agentId) {
            return false;
        }

        const appService = new AppService(env);
        const ownershipResult = await appService.checkAppOwnership(agentId, user.id);
        return ownershipResult.isOwner;
    } catch (error) {
        logger.error('Error checking app ownership', error);
        return false;
    }
}