/**
 * GitHub service types and utilities
 * Extends Octokit types where possible to avoid duplication
 */
export class GitHubServiceError extends Error {
    code;
    statusCode;
    originalError;
    constructor(message, code, statusCode, originalError) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.name = 'GitHubServiceError';
    }
}
