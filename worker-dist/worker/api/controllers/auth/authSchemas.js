/**
 * Authentication Validation Schemas
 * Zod schemas for validating auth-related requests
 */
import { z } from 'zod';
import { commonSchemas } from '../../../utils/inputValidator';
/**
 * Login request schema
 */
export const loginSchema = z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
});
/**
 * Registration request schema
 */
export const registerSchema = z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional()
});
/**
 * OAuth callback schema
 */
export const oauthCallbackSchema = z.object({
    code: z.string().min(1, 'Authorization code is required'),
    state: z.string().min(1, 'State is required'),
    error: z.string().optional(),
    error_description: z.string().optional()
});
/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});
/**
 * Forgot password schema
 */
export const forgotPasswordSchema = z.object({
    email: commonSchemas.email
});
/**
 * Reset password schema
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});
/**
 * Verify email schema
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, 'Verification token is required')
});
/**
 * OAuth provider schema
 */
export const oauthProviderSchema = z.enum(['google', 'github']);
