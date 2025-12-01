import type { RateLimitError } from "../../worker/services/rate-limit/errors";
import type { RateLimitType } from "../../worker/services/rate-limit/config";
/**
 * Security error types for proper error handling
 */
export declare enum SecurityErrorType {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    INVALID_TOKEN = "INVALID_TOKEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    RATE_LIMITED = "RATE_LIMITED",
    INVALID_INPUT = "INVALID_INPUT",
    CSRF_VIOLATION = "CSRF_VIOLATION"
}
/**
 * Custom security error class
 */
export declare class SecurityError extends Error {
    type: SecurityErrorType;
    statusCode: number;
    constructor(type: SecurityErrorType, message: string, statusCode?: number);
}
export declare class RateLimitExceededError extends SecurityError {
    limitType: RateLimitType;
    limit?: number | undefined;
    period?: number | undefined;
    suggestions?: string[] | undefined;
    details: RateLimitError;
    constructor(message: string, limitType: RateLimitType, limit?: number | undefined, period?: number | undefined, suggestions?: string[] | undefined);
    static fromRateLimitError(error: RateLimitError): RateLimitExceededError;
}
