/**
 * Route Authentication Middleware
 */
import { AuthUser } from '../../types/auth-types';
import { Context } from 'hono';
import { AppEnv } from '../../types/appenv';
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
export declare const AuthConfig: {
    readonly public: {
        readonly required: false;
        readonly level: "public";
    };
    readonly authenticated: {
        readonly required: true;
        readonly level: "authenticated";
    };
    readonly ownerOnly: {
        readonly required: true;
        readonly level: "owner-only";
        readonly resourceOwnershipCheck: typeof checkAppOwnership;
    };
    readonly publicReadOwnerWrite: {
        readonly required: false;
    };
};
/**
 * Route authentication logic that enforces authentication requirements
 */
export declare function routeAuthChecks(user: AuthUser | null, env: Env, requirement: AuthRequirement, params?: Record<string, string>): Promise<{
    success: boolean;
    response?: Response;
}>;
export declare function enforceAuthRequirement(c: Context<AppEnv>): Promise<Response | undefined>;
export declare function setAuthLevel(requirement: AuthRequirement): import("hono").MiddlewareHandler<any, string, {}, Response>;
/**
 * Check if user owns an app by agent/app ID
 */
export declare function checkAppOwnership(user: AuthUser, params: Record<string, string>, env: Env): Promise<boolean>;
