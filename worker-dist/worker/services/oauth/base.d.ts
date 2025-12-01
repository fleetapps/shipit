/**
 * Base OAuth Provider
 * Abstract base class for OAuth provider implementations
 */
import { OAuthProvider, OAuthUserInfo } from '../../types/auth-types';
/**
 * OAuth tokens returned from providers
 */
export interface OAuthTokens {
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType: string;
}
/**
 * Base OAuth Provider class
 */
export declare abstract class BaseOAuthProvider {
    protected clientId: string;
    protected clientSecret: string;
    protected redirectUri: string;
    protected abstract readonly provider: OAuthProvider;
    protected abstract readonly authorizationUrl: string;
    protected abstract readonly tokenUrl: string;
    protected abstract readonly userInfoUrl: string;
    protected abstract readonly scopes: string[];
    constructor(clientId: string, clientSecret: string, redirectUri: string);
    /**
     * Get authorization URL
     */
    getAuthorizationUrl(state: string, codeVerifier?: string): Promise<string>;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code: string, codeVerifier?: string): Promise<OAuthTokens>;
    /**
     * Get user info from provider
     */
    abstract getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Refresh access token
     */
    refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
    /**
     * Generate PKCE code challenge
     */
    protected generateCodeChallenge(verifier: string): Promise<string>;
    /**
     * Generate PKCE code verifier
     */
    static generateCodeVerifier(): string;
}
