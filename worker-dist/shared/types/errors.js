/**
 * Security error types for proper error handling
 */
export var SecurityErrorType;
(function (SecurityErrorType) {
    SecurityErrorType["UNAUTHORIZED"] = "UNAUTHORIZED";
    SecurityErrorType["FORBIDDEN"] = "FORBIDDEN";
    SecurityErrorType["INVALID_TOKEN"] = "INVALID_TOKEN";
    SecurityErrorType["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    SecurityErrorType["RATE_LIMITED"] = "RATE_LIMITED";
    SecurityErrorType["INVALID_INPUT"] = "INVALID_INPUT";
    SecurityErrorType["CSRF_VIOLATION"] = "CSRF_VIOLATION";
})(SecurityErrorType || (SecurityErrorType = {}));
/**
 * Custom security error class
 */
export class SecurityError extends Error {
    type;
    statusCode;
    constructor(type, message, statusCode = 401) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.name = 'SecurityError';
    }
}
export class RateLimitExceededError extends SecurityError {
    limitType;
    limit;
    period;
    suggestions;
    details;
    constructor(message, limitType, limit, period, suggestions) {
        super(SecurityErrorType.RATE_LIMITED, message, 429);
        this.limitType = limitType;
        this.limit = limit;
        this.period = period;
        this.suggestions = suggestions;
        this.name = 'RateLimitExceededError';
        this.details = {
            message,
            limitType,
            limit,
            period,
            suggestions
        };
    }
    static fromRateLimitError(error) {
        return new RateLimitExceededError(error.message, error.limitType, error.limit, error.period, error.suggestions);
    }
}
