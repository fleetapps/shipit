/**
 * Secure base64url encoding for Cloudflare Workers
 * Prevents stack overflow and encoding corruption with large buffers
 */
export declare function base64url(buffer: Uint8Array): string;
export declare function sha256Hash(text: string): Promise<string>;
export declare function timingSafeEqual(a: string, b: string): Promise<boolean>;
export declare function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean;
export declare function generateSecureToken(length?: number): string;
export declare function generateApiKey(): Promise<{
    key: string;
    keyHash: string;
    keyPreview: string;
}>;
export declare function verifyApiKey(providedKey: string, storedHash: string): Promise<boolean>;
export declare function pbkdf2(password: string, salt: Uint8Array, iterations?: number, keyLength?: number): Promise<Uint8Array>;
