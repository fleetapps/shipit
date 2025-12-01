/**
 * Centralized Validation Utilities
 */
import type { PasswordValidationResult } from '../types/auth-types';
/**
 * Email validation configuration
 */
export interface EmailValidationConfig {
    allowPlusAddressing?: boolean;
    allowInternational?: boolean;
    maxLength?: number;
    blockedDomains?: string[];
}
/**
 * Comprehensive email validation
 */
export declare function validateEmail(email: string, config?: EmailValidationConfig): {
    valid: boolean;
    error?: string;
};
/**
 * Password validation using Zod
 */
export declare function validatePassword(password: string, _config?: unknown, _userInfo?: {
    email?: string;
    username?: string;
    name?: string;
}): PasswordValidationResult;
/**
 * Validate username format
 */
export declare function validateUsername(username: string, config?: {
    minLength?: number;
    maxLength?: number;
    allowSpecialChars?: boolean;
    reservedNames?: string[];
}): {
    valid: boolean;
    error?: string;
};
/**
 * Batch validation utility
 */
export interface ValidationField<T extends readonly unknown[] = readonly unknown[]> {
    value: string;
    validator: (value: string, ...args: T) => {
        valid: boolean;
        error?: string;
    };
    validatorArgs?: T;
    fieldName: string;
}
