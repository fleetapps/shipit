import type { OAuthUserInfo } from '../../types/auth-types';
import { GitHubOAuthProvider } from './github';
export declare class GitHubExporterOAuthProvider extends GitHubOAuthProvider {
    protected readonly scopes: string[];
    getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
    static create(env: Env, baseUrl: string): GitHubExporterOAuthProvider;
}
