/**
 * AI Gateway Analytics Types
 * Type definitions for AI Gateway analytics data and responses
 */
/**
 * Analytics service errors
 */
export class AnalyticsError extends Error {
    code;
    statusCode;
    originalError;
    constructor(message, code, statusCode = 500, originalError) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.name = 'AnalyticsError';
    }
}
