import { AuthUser } from '../../types/auth-types';
import type { ControllerResponse, ApiResponse } from './types';
/**
 * Base controller class that provides common functionality
 */
export declare abstract class BaseController {
    static logger: import("../../logger").StructuredLogger;
    /**
     * Get optional user for public endpoints that can benefit from user context
     * Uses authMiddleware directly for optional authentication
     */
    static getOptionalUser(request: Request, env: Env): Promise<AuthUser | null>;
    /**
     * Parse query parameters from request URL
     */
    static parseQueryParams(request: Request): URLSearchParams;
    /**
     * Parse JSON body from request with error handling
     */
    static parseJsonBody<T>(request: Request): Promise<{
        success: boolean;
        data?: T;
        response?: Response;
    }>;
    /**
     * Handle errors with consistent logging and response format
     */
    static handleError(error: unknown, action: string, context?: Record<string, unknown>): Response;
    /**
     * Execute controller operation with error handling
     */
    static executeWithErrorHandling<T>(operation: () => Promise<T>, operationName: string, context?: Record<string, any>): Promise<T | Response>;
    /**
     * Validate required parameters
     */
    static validateRequiredParams(params: Record<string, unknown>, requiredFields: string[]): void;
    /**
     * Require authentication with standardized error
     */
    static requireAuthentication(user: unknown): void;
    /**
     * Create a typed success response that enforces response interface compliance
     * This method ensures the response data matches the expected type T at compile time
     */
    static createSuccessResponse<T>(data: T): ControllerResponse<ApiResponse<T>>;
    /**
     * Create a typed error response with proper type annotation
     */
    static createErrorResponse<T = never>(message: string | Error, statusCode?: number): ControllerResponse<ApiResponse<T>>;
    /**
     * Extract client IP address from request headers
     */
    static getClientIpAddress(request: Request): string;
    /**
     * Extract user agent from request headers
     */
    static getUserAgent(request: Request): string;
}
