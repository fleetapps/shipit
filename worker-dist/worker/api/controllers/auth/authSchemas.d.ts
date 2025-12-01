/**
 * Authentication Validation Schemas
 * Zod schemas for validating auth-related requests
 */
import { z } from 'zod';
/**
 * Login request schema
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginRequest = z.infer<typeof loginSchema>;
/**
 * Registration request schema
 */
export declare const registerSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    password: z.ZodEffects<z.ZodString, string, string>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name?: string | undefined;
}, {
    email: string;
    password: string;
    name?: string | undefined;
}>;
export type RegisterRequest = z.infer<typeof registerSchema>;
/**
 * OAuth callback schema
 */
export declare const oauthCallbackSchema: z.ZodObject<{
    code: z.ZodString;
    state: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    error_description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    state: string;
    error?: string | undefined;
    error_description?: string | undefined;
}, {
    code: string;
    state: string;
    error?: string | undefined;
    error_description?: string | undefined;
}>;
export type OAuthCallbackRequest = z.infer<typeof oauthCallbackSchema>;
/**
 * Change password schema
 */
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
/**
 * Forgot password schema
 */
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
/**
 * Reset password schema
 */
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}, {
    token: string;
    newPassword: string;
    confirmPassword: string;
}>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
/**
 * Verify email schema
 */
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailSchema>;
/**
 * OAuth provider schema
 */
export declare const oauthProviderSchema: z.ZodEnum<["google", "github"]>;
export type OAuthProviderParam = z.infer<typeof oauthProviderSchema>;
