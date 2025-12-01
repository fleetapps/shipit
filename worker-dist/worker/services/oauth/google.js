/**
 * Google OAuth Provider
 * Implements Google OAuth 2.0 authentication
 */
import { BaseOAuthProvider } from './base';
import { createLogger } from '../../logger';
const logger = createLogger('GoogleOAuth');
/**
 * Google OAuth Provider implementation
 */
export class GoogleOAuthProvider extends BaseOAuthProvider {
    provider = 'google';
    authorizationUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    tokenUrl = 'https://oauth2.googleapis.com/token';
    userInfoUrl = 'https://www.googleapis.com/oauth2/v2/userinfo';
    // Minimal scopes for authentication only
    scopes = [
        'openid',
        'email',
        'profile'
    ];
    /**
     * Get user info from Google
     */
    async getUserInfo(accessToken) {
        try {
            const response = await fetch(this.userInfoUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                const error = await response.text();
                logger.error('Failed to get user info', { error });
                throw new Error(`Failed to get user info: ${error}`);
            }
            const data = await response.json();
            return {
                id: data.id,
                email: data.email,
                name: data.name,
                picture: data.picture,
                emailVerified: data.verified_email
            };
        }
        catch (error) {
            logger.error('Error getting user info', error);
            throw error;
        }
    }
    /**
     * Create Google OAuth provider instance
     */
    static create(env, baseUrl) {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
            throw new Error('Google OAuth credentials not configured');
        }
        const redirectUri = `${baseUrl}/api/auth/callback/google`;
        return new GoogleOAuthProvider(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
    }
}
