/**
 * GitHub OAuth Provider
 * Implements GitHub OAuth 2.0 authentication
 */
import { BaseOAuthProvider } from './base';
import type { OAuthUserInfo } from '../../types/auth-types';
import { OAuthProvider } from '../../types/auth-types';
/**
 * GitHub OAuth Provider implementation
 */
export declare class GitHubOAuthProvider extends BaseOAuthProvider {
    protected readonly provider: OAuthProvider;
    protected readonly authorizationUrl = "https://github.com/login/oauth/authorize";
    protected readonly tokenUrl = "https://github.com/login/oauth/access_token";
    protected readonly userInfoUrl = "https://api.github.com/user";
    protected readonly emailsUrl = "https://api.github.com/user/emails";
    protected readonly scopes: string[];
    /**
     * Get user info from GitHub
     */
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    /**
     * Create GitHub OAuth provider instance
     */
    static create(env: Env, baseUrl: string): GitHubOAuthProvider;
}
