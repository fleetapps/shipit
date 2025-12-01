/**
 * Google OAuth Provider
 * Implements Google OAuth 2.0 authentication
 */
import { BaseOAuthProvider } from './base';
import type { OAuthUserInfo } from '../../types/auth-types';
import { OAuthProvider } from '../../types/auth-types';
/**
 * Google OAuth Provider implementation
 */
export declare class GoogleOAuthProvider extends BaseOAuthProvider {
    protected readonly provider: OAuthProvider;
    protected readonly authorizationUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    protected readonly tokenUrl = "https://oauth2.googleapis.com/token";
    protected readonly userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
    protected readonly scopes: string[];
    /**
     * Get user info from Google
     */
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Create Google OAuth provider instance
     */
    static create(env: Env, baseUrl: string): GoogleOAuthProvider;
}
