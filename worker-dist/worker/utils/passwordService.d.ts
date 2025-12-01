/**
 * Password Service using Web Crypto API
 * Provides secure password hashing and validation
 */
import { PasswordValidationResult } from '../types/auth-types';
/**
 * Password Service for secure password operations
 * Uses PBKDF2 with Web Crypto API (since Argon2 is not available in Workers)
 */
export declare class PasswordService {
    private readonly saltLength;
    private readonly iterations;
    private readonly keyLength;
    /**
     * Hash a password
     */
    hash(password: string): Promise<string>;
    /**
     * Verify a password against a hash
     */
    verify(password: string, hashedPassword: string): Promise<boolean>;
    /**
     * Validate password strength using centralized validation
     */
    validatePassword(password: string, userInfo?: {
        email?: string;
        name?: string;
    }): PasswordValidationResult;
}
