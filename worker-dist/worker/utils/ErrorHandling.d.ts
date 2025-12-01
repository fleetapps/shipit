/**
 * Error Handling Utilities
 */
/**
 * Standard error types for the application
 */
export declare enum AppErrorType {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
    CONFLICT_ERROR = "CONFLICT_ERROR",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
/**
 * Application error class
 */
export declare class AppError extends Error {
    type: AppErrorType;
    statusCode: number;
    context?: Record<string, any> | undefined;
    constructor(type: AppErrorType, message: string, statusCode?: number, context?: Record<string, any> | undefined);
}
/**
 * Error handling utilities
 */
export declare class ErrorHandler {
    /**
     * Handle and log error with context
     */
    static handleError(error: unknown, operation: string, context?: Record<string, any>): AppError;
    /**
     * Convert AppError to HTTP Response
     */
    static toResponse(error: AppError): Response;
    /**
     * Handle async operation with error catching
     */
    static safeExecute<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<{
        success: true;
        data: T;
    } | {
        success: false;
        error: AppError;
    }>;
    /**
     * Wrap async function with error handling
     */
    static wrapAsync<TArgs extends any[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>, operationName: string, defaultReturn?: TReturn): (...args: TArgs) => Promise<TReturn>;
}
/**
 * Error factory functions for common scenarios
 */
export declare class ErrorFactory {
    static validationError(message: string, context?: Record<string, any>): AppError;
    static authenticationError(message?: string, context?: Record<string, any>): AppError;
    static authorizationError(message?: string, context?: Record<string, any>): AppError;
    static notFoundError(resource: string, context?: Record<string, any>): AppError;
    static conflictError(message: string, context?: Record<string, any>): AppError;
    static rateLimitError(message?: string, context?: Record<string, any>): AppError;
    static externalServiceError(service: string, context?: Record<string, any>): AppError;
    static internalError(message?: string, context?: Record<string, any>): AppError;
}
/**
 * Controller error handling mixin
 */
export declare class ControllerErrorHandler {
    /**
     * Handle controller operation with standardized error response
     */
    static handleControllerOperation<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<T | Response>;
    /**
     * Validate required parameters
     */
    static validateRequiredParams(params: Record<string, any>, requiredFields: string[]): void;
    /**
     * Handle authentication requirement
     */
    static requireAuthentication(user: any): void;
    /**
     * Handle resource ownership verification
     */
    static requireResourceOwnership(resource: any, userId: string, resourceName: string): void;
    /**
     * Handle JSON parsing with proper error
     */
    static parseJsonBody<T>(request: Request): Promise<T>;
    /**
     * Handle external service errors
     */
    static handleExternalServiceError(serviceName: string, error: unknown, context?: Record<string, any>): never;
}
