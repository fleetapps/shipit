/**
 * Standardized API response utilities
 */
import { SecurityError } from '../../shared/types/errors';
/**
 * Creates a success response with standard format
 */
export function successResponse(data, message) {
    const responseBody = {
        success: true,
        data,
        message,
    };
    return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
/**
 * Creates an error response with standard format
 */
export function errorResponse(error, statusCode = 500, message) {
    let errorResp = {
        message: error instanceof Error ? error.message : error,
        name: error instanceof Error ? error.name : 'Error',
    };
    if (error instanceof SecurityError) {
        errorResp = {
            ...errorResp,
            type: error.type,
        };
    }
    const responseBody = {
        success: false,
        error: errorResp,
        message: message || (error instanceof Error ? error.message : 'An error occurred'),
    };
    return new Response(JSON.stringify(responseBody), {
        status: statusCode,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}
