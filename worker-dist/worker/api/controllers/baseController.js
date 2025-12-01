/**
 * Base Controller Class
 */
import { authMiddleware } from '../../middleware/auth/auth';
import { successResponse, errorResponse } from '../responses';
import { ControllerErrorHandler, ErrorHandler } from '../../utils/ErrorHandling';
import { createLogger } from '../../logger';
/**
 * Base controller class that provides common functionality
 */
export class BaseController {
    static logger = createLogger('BaseController');
    /**
     * Get optional user for public endpoints that can benefit from user context
     * Uses authMiddleware directly for optional authentication
     */
    static async getOptionalUser(request, env) {
        try {
            const userSession = await authMiddleware(request, env);
            if (!userSession) {
                return null;
            }
            return userSession.user;
        }
        catch (error) {
            this.logger.debug('Optional auth failed, continuing without user', { error });
            return null;
        }
    }
    /**
     * Parse query parameters from request URL
     */
    static parseQueryParams(request) {
        const url = new URL(request.url);
        return url.searchParams;
    }
    /**
     * Parse JSON body from request with error handling
     */
    static async parseJsonBody(request) {
        try {
            const body = await ControllerErrorHandler.parseJsonBody(request);
            return { success: true, data: body };
        }
        catch (error) {
            const appError = ErrorHandler.handleError(error, 'parse JSON body');
            return {
                success: false,
                response: ErrorHandler.toResponse(appError)
            };
        }
    }
    /**
     * Handle errors with consistent logging and response format
     */
    static handleError(error, action, context) {
        const appError = ErrorHandler.handleError(error, action, context);
        return ErrorHandler.toResponse(appError);
    }
    /**
     * Execute controller operation with error handling
     */
    static async executeWithErrorHandling(operation, operationName, context) {
        return ControllerErrorHandler.handleControllerOperation(operation, operationName, context);
    }
    /**
     * Validate required parameters
     */
    static validateRequiredParams(params, requiredFields) {
        ControllerErrorHandler.validateRequiredParams(params, requiredFields);
    }
    /**
     * Require authentication with standardized error
     */
    static requireAuthentication(user) {
        ControllerErrorHandler.requireAuthentication(user);
    }
    /**
     * Create a typed success response that enforces response interface compliance
     * This method ensures the response data matches the expected type T at compile time
     */
    static createSuccessResponse(data) {
        const response = successResponse(data);
        // The phantom type helps TypeScript understand this response contains type T
        return response;
    }
    /**
     * Create a typed error response with proper type annotation
     */
    static createErrorResponse(message, statusCode = 500) {
        const response = errorResponse(message, statusCode);
        return response;
    }
    /**
     * Extract client IP address from request headers
     */
    static getClientIpAddress(request) {
        return request.headers.get('CF-Connecting-IP') ||
            request.headers.get('X-Forwarded-For')?.split(',')[0] ||
            'unknown';
    }
    /**
     * Extract user agent from request headers
     */
    static getUserAgent(request) {
        return request.headers.get('user-agent') || 'unknown';
    }
}
