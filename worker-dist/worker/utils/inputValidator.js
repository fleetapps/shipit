/**
 * Input Validation Middleware for Cloudflare Workers
 * Uses Zod for schema validation and sanitization
 */
import { z } from 'zod';
import { SecurityError, SecurityErrorType } from '../../shared/types/errors';
import { createLogger } from '../logger';
import { validatePassword, validateEmail, validateUsername } from './validationUtils';
const logger = createLogger('InputValidator');
/**
 * Input validation middleware using Zod schemas
 *
 * @param request - The incoming request
 * @param schema - Zod schema for validation
 * @returns Validated data or throws SecurityError
 */
export async function validateInput(request, schema) {
    try {
        // Handle different content types
        const contentType = request.headers.get('content-type');
        let data;
        if (contentType?.includes('application/json')) {
            data = await parseJSON(request);
        }
        else if (contentType?.includes('application/x-www-form-urlencoded')) {
            data = await parseFormData(request);
        }
        else if (contentType?.includes('multipart/form-data')) {
            data = await parseMultipartFormData(request);
        }
        else if (request.method === 'GET' || request.method === 'DELETE') {
            data = parseQueryParams(request);
        }
        else {
            throw new SecurityError(SecurityErrorType.INVALID_INPUT, 'Unsupported content type', 400);
        }
        // Validate with Zod
        const result = schema.safeParse(data);
        if (!result.success) {
            logger.warn('Validation failed', {
                errors: result.error.errors,
                path: new URL(request.url).pathname
            });
            throw new SecurityError(SecurityErrorType.INVALID_INPUT, formatValidationErrors(result.error), 400);
        }
        logger.debug('Input validated successfully', {
            path: new URL(request.url).pathname
        });
        return result.data;
    }
    catch (error) {
        if (error instanceof SecurityError) {
            throw error;
        }
        logger.error('Input validation error', error);
        throw new SecurityError(SecurityErrorType.INVALID_INPUT, 'Invalid request data', 400);
    }
}
/**
 * Parse JSON body with size limit
 */
async function parseJSON(request) {
    const text = await request.text();
    // Check size limit (1MB)
    if (text.length > 1024 * 1024) {
        throw new SecurityError(SecurityErrorType.INVALID_INPUT, 'Request body too large', 413);
    }
    try {
        return JSON.parse(text);
    }
    catch {
        throw new SecurityError(SecurityErrorType.INVALID_INPUT, 'Invalid JSON', 400);
    }
}
/**
 * Parse URL-encoded form data
 */
async function parseFormData(request) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const data = {};
    for (const [key, value] of params) {
        data[key] = value;
    }
    return data;
}
/**
 * Parse multipart form data
 */
async function parseMultipartFormData(request) {
    const formData = await request.formData();
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });
    return data;
}
/**
 * Parse query parameters
 */
function parseQueryParams(request) {
    const url = new URL(request.url);
    const data = {};
    for (const [key, value] of url.searchParams) {
        data[key] = value;
    }
    return data;
}
/**
 * Format Zod validation errors for user-friendly response
 */
function formatValidationErrors(error) {
    const messages = error.errors.map(err => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
    });
    return messages.join(', ');
}
/**
 * Common validation schemas using centralized validation functions
 */
export const commonSchemas = {
    // Email validation using centralized function
    email: z.string().refine((email) => validateEmail(email).valid, (email) => ({ message: validateEmail(email).error || 'Invalid email format' })).transform((email) => email.toLowerCase()),
    // Password validation using centralized comprehensive validation
    password: z.string().refine((password) => validatePassword(password).valid, (password) => {
        const result = validatePassword(password);
        return { message: result.errors?.[0] || 'Password does not meet requirements' };
    }),
    // Password validation with user context (for preventing personal info in passwords)
    passwordWithUserInfo: (userInfo) => z.string().refine((password) => validatePassword(password, undefined, userInfo).valid, (password) => {
        const result = validatePassword(password, undefined, userInfo);
        return { message: result.errors?.[0] || 'Password does not meet requirements' };
    }),
    // Username validation using centralized function
    username: z.string().refine((username) => validateUsername(username).valid, (username) => ({ message: validateUsername(username).error || 'Invalid username format' })),
    // UUID validation
    uuid: z.string().uuid(),
    // Pagination
    pagination: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
    }),
    // Safe string (no special chars that could be used for injection)
    safeString: z.string()
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Only alphanumeric characters, spaces, hyphens, and underscores allowed')
        .transform(val => val.trim()),
    // URL validation
    url: z.string().url(),
    // Date validation
    date: z.string().datetime(),
};
