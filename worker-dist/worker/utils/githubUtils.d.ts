/**
 * GitHub-specific Utilities
 * Centralized GitHub API helpers
 */
/**
 * Create standardized GitHub API headers with consistent User-Agent
 */
export declare function createGitHubHeaders(accessToken: string): Record<string, string>;
/**
 * Extract error text from GitHub API response
 */
export declare function extractGitHubErrorText(response: Response): Promise<string>;
