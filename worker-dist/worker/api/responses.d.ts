/**
 * Standardized API response utilities
 */
import { RateLimitError } from "../services/rate-limit/errors";
import { SecurityError, SecurityErrorType } from '../../shared/types/errors';
/**
 * Standard response shape for all API endpoints
 */
export interface BaseErrorResponse {
    message: string;
    name: string;
    type?: SecurityErrorType;
}
export interface RateLimitErrorResponse extends BaseErrorResponse {
    details: RateLimitError;
}
type ErrorResponse = BaseErrorResponse | RateLimitErrorResponse;
export interface BaseApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: ErrorResponse;
    message?: string;
}
/**
 * Creates a success response with standard format
 */
export declare function successResponse<T = unknown>(data: T, message?: string): Response;
/**
 * Creates an error response with standard format
 */
export declare function errorResponse(error: string | Error | SecurityError, statusCode?: number, message?: string): Response;
export {};
