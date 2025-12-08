/**
 * Error Handling Utilities
 */
import { createLogger } from '../logger';
import { SecurityError } from 'shared/types/errors';
import { errorResponse } from '../api/responses';
const logger = createLogger('ErrorHandling');
/**
 * Standard error types for the application
 */
export var AppErrorType;
(function (AppErrorType) {
    AppErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    AppErrorType["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    AppErrorType["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    AppErrorType["NOT_FOUND_ERROR"] = "NOT_FOUND_ERROR";
    AppErrorType["CONFLICT_ERROR"] = "CONFLICT_ERROR";
    AppErrorType["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    AppErrorType["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    AppErrorType["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(AppErrorType || (AppErrorType = {}));
/**
 * Application error class
 */
export class AppError extends Error {
    type;
    statusCode;
    context;
    constructor(type, message, statusCode = 500, context) {
        super(message);
        this.type = type;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'AppError';
    }
}
/**
 * Error handling utilities
 */
export class ErrorHandler {
    /**
     * Handle and log error with context
     */
    static handleError(error, operation, context) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error during ${operation}`, {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            ...context
        });
        // Convert SecurityError to AppError
        if (error instanceof SecurityError) {
            return new AppError(AppErrorType.AUTHENTICATION_ERROR, error.message, error.statusCode, context);
        }
        // Convert AppError
        if (error instanceof AppError) {
            return error;
        }
        // Default to internal error
        return new AppError(AppErrorType.INTERNAL_ERROR, `Failed to ${operation}`, 500, context);
    }
    /**
     * Convert AppError to HTTP Response
     */
    static toResponse(error) {
        return errorResponse(error.message, error.statusCode);
    }
    /**
     * Handle async operation with error catching
     */
    static async safeExecute(operation, operationName, context) {
        try {
            const data = await operation();
            return { success: true, data };
        }
        catch (error) {
            const appError = ErrorHandler.handleError(error, operationName, context);
            return { success: false, error: appError };
        }
    }
    /**
     * Wrap async function with error handling
     */
    static wrapAsync(fn, operationName, defaultReturn) {
        return async (...args) => {
            try {
                return await fn(...args);
            }
            catch (error) {
                const appError = ErrorHandler.handleError(error, operationName);
                if (defaultReturn !== undefined) {
                    return defaultReturn;
                }
                throw appError;
            }
        };
    }
}
/**
 * Error factory functions for common scenarios
 */
export class ErrorFactory {
    static validationError(message, context) {
        return new AppError(AppErrorType.VALIDATION_ERROR, message, 400, context);
    }
    static authenticationError(message = 'Authentication required', context) {
        return new AppError(AppErrorType.AUTHENTICATION_ERROR, message, 401, context);
    }
    static authorizationError(message = 'Insufficient permissions', context) {
        return new AppError(AppErrorType.AUTHORIZATION_ERROR, message, 403, context);
    }
    static notFoundError(resource, context) {
        return new AppError(AppErrorType.NOT_FOUND_ERROR, `${resource} not found`, 404, context);
    }
    static conflictError(message, context) {
        return new AppError(AppErrorType.CONFLICT_ERROR, message, 409, context);
    }
    static rateLimitError(message = 'Rate limit exceeded', context) {
        return new AppError(AppErrorType.RATE_LIMIT_ERROR, message, 429, context);
    }
    static externalServiceError(service, context) {
        return new AppError(AppErrorType.EXTERNAL_SERVICE_ERROR, `External service ${service} unavailable`, 502, context);
    }
    static internalError(message = 'Internal server error', context) {
        return new AppError(AppErrorType.INTERNAL_ERROR, message, 500, context);
    }
}
/**
 * Controller error handling mixin
 */
export class ControllerErrorHandler {
    /**
     * Handle controller operation with standardized error response
     */
    static async handleControllerOperation(operation, operationName, context) {
        try {
            return await operation();
        }
        catch (error) {
            const appError = ErrorHandler.handleError(error, operationName, context);
            return ErrorHandler.toResponse(appError);
        }
    }
    /**
     * Validate required parameters
     */
    static validateRequiredParams(params, requiredFields) {
        for (const field of requiredFields) {
            if (!params[field]) {
                throw ErrorFactory.validationError(`${field} is required`, { field });
            }
        }
    }
    /**
     * Handle authentication requirement
     */
    static requireAuthentication(user) {
        if (!user) {
            throw ErrorFactory.authenticationError();
        }
    }
    /**
     * Handle resource ownership verification
     */
    static requireResourceOwnership(resource, userId, resourceName) {
        if (!resource) {
            throw ErrorFactory.notFoundError(resourceName);
        }
        if (resource.userId !== userId) {
            throw ErrorFactory.authorizationError(`Access denied to ${resourceName}`);
        }
    }
    /**
     * Handle JSON parsing with proper error
     */
    static async parseJsonBody(request) {
        try {
            return await request.json();
        }
        catch (error) {
            throw ErrorFactory.validationError('Invalid JSON in request body');
        }
    }
    /**
     * Handle external service errors
     */
    static handleExternalServiceError(serviceName, error, context) {
        logger.error(`External service error: ${serviceName}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            ...context
        });
        throw ErrorFactory.externalServiceError(serviceName, context);
    }
}
