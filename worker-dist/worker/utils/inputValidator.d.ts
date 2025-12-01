/**
 * Input Validation Middleware for Cloudflare Workers
 * Uses Zod for schema validation and sanitization
 */
import { z } from 'zod';
/**
 * Input validation middleware using Zod schemas
 *
 * @param request - The incoming request
 * @param schema - Zod schema for validation
 * @returns Validated data or throws SecurityError
 */
export declare function validateInput<T extends z.ZodSchema>(request: Request, schema: T): Promise<z.infer<T>>;
/**
 * Common validation schemas using centralized validation functions
 */
export declare const commonSchemas: {
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    password: z.ZodEffects<z.ZodString, string, string>;
    passwordWithUserInfo: (userInfo?: {
        email?: string;
        username?: string;
        name?: string;
    }) => z.ZodEffects<z.ZodString, string, string>;
    username: z.ZodEffects<z.ZodString, string, string>;
    uuid: z.ZodString;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        sortBy: z.ZodOptional<z.ZodString>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy?: string | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        sortBy?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
    safeString: z.ZodEffects<z.ZodString, string, string>;
    url: z.ZodString;
    date: z.ZodString;
};
