/**
 * Main Authentication Service
 * Orchestrates all auth operations including login, registration, and OAuth
 */
import { BaseOAuthProvider } from '../../services/oauth/base';
import { AuthResult, AuthUserSession } from '../../types/auth-types';
import { AuthUser, OAuthProvider } from '../../types/auth-types';
import { BaseService } from './BaseService';
/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * Registration data
 */
export interface RegistrationData {
    email: string;
    password: string;
    name?: string;
}
/**
 * Main Authentication Service
 */
export declare class AuthService extends BaseService {
    private readonly sessionService;
    private readonly passwordService;
    constructor(env: Env);
    /**
     * Register a new user
     */
    register(data: RegistrationData, request: Request): Promise<AuthResult>;
    /**
     * Login with email and password
     */
    login(credentials: LoginCredentials, request: Request): Promise<AuthResult>;
    /**
     * Logout
     */
    logout(sessionId: string): Promise<void>;
    getOauthProvider(provider: OAuthProvider, request: Request): Promise<BaseOAuthProvider>;
    /**
     * Get OAuth authorization URL
     */
    getOAuthAuthorizationUrl(provider: OAuthProvider, request: Request, intendedRedirectUrl?: string): Promise<string>;
    /**
     * Clean up expired OAuth states
     */
    private cleanupExpiredOAuthStates;
    /**
     * Handle OAuth callback
     */
    handleOAuthCallback(provider: OAuthProvider, code: string, state: string, request: Request): Promise<AuthResult>;
    /**
     * Find or create OAuth user
     */
    private findOrCreateOAuthUser;
    /**
     * Log authentication attempt
     */
    private logAuthAttempt;
    /**
     * Validate and sanitize redirect URL to prevent open redirect attacks
     */
    private validateRedirectUrl;
    /**
     * Generate and store verification OTP for email
     */
    private generateAndStoreVerificationOtp;
    /**
     * Verify email with OTP
     */
    verifyEmailWithOtp(email: string, otp: string, request: Request): Promise<AuthResult>;
    /**
     * Get user for authentication (for middleware)
     */
    getUserForAuth(userId: string): Promise<AuthUser | null>;
    /**
     * Validate token and return user (for middleware)
     */
    validateTokenAndGetUser(token: string, env: Env): Promise<AuthUserSession | null>;
    /**
     * Resend verification OTP
     */
    resendVerificationOtp(email: string): Promise<void>;
}
