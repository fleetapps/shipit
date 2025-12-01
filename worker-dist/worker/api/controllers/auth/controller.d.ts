/**
 * Secure Authentication Controller
 */
import { RouteContext } from '../../types/route-context';
import { BaseController } from '../baseController';
/**
 * Authentication Controller
 */
export declare class AuthController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Check if OAuth providers are configured
     */
    static hasOAuthProviders(env: Env): boolean;
    /**
     * Register a new user
     * POST /api/auth/register
     */
    static register(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Login with email and password
     * POST /api/auth/login
     */
    static login(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Logout current user
     * POST /api/auth/logout
     */
    static logout(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Get current user profile
     * GET /api/auth/profile
     */
    static getProfile(_request: Request, _env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    static updateProfile(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Initiate OAuth flow
     * GET /api/auth/oauth/:provider
     */
    static initiateOAuth(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Handle OAuth callback
     * GET /api/auth/callback/:provider
     */
    static handleOAuthCallback(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Check authentication status
     * GET /api/auth/check
     */
    static checkAuth(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Get active sessions for current user
     * GET /api/auth/sessions
     */
    static getActiveSessions(_request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Revoke a specific session
     * DELETE /api/auth/sessions/:sessionId
     */
    static revokeSession(_request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Get API keys for current user
     * GET /api/auth/api-keys
     */
    static getApiKeys(_request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Create a new API key
     * POST /api/auth/api-keys
     */
    static createApiKey(request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Revoke an API key
     * DELETE /api/auth/api-keys/:keyId
     */
    static revokeApiKey(_request: Request, env: Env, _ctx: ExecutionContext, routeContext: RouteContext): Promise<Response>;
    /**
     * Verify email with OTP
     * POST /api/auth/verify-email
     */
    static verifyEmail(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Resend verification OTP
     * POST /api/auth/resend-verification
     */
    static resendVerificationOtp(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Get CSRF token with proper expiration and rotation
     * GET /api/auth/csrf-token
     */
    static getCsrfToken(request: Request, _env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
    /**
     * Get available authentication providers
     * GET /api/auth/providers
     */
    static getAuthProviders(request: Request, env: Env, _ctx: ExecutionContext, _context: RouteContext): Promise<Response>;
}
