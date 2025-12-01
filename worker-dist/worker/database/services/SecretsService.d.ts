/**
 * Secrets Service
 * Handles encryption/decryption and management of user API keys and secrets
 */
import { BaseService } from './BaseService';
import type { SecretData, EncryptedSecret } from '../types';
export declare class SecretsService extends BaseService {
    /**
     * Encrypt a secret value using XChaCha20-Poly1305
     */
    encryptSecret(value: string): Promise<{
        encryptedValue: string;
        keyPreview: string;
    }>;
    /**
     * Decrypt a secret value
     */
    private decryptSecret;
    /**
     * Derive a key using PBKDF2
     */
    private deriveKey;
    /**
     * Store a new secret for a user
     */
    storeSecret(_userId: string, _secretData: SecretData): Promise<EncryptedSecret>;
    /**
     * Get all secrets for a user (without decrypted values)
     */
    getUserSecrets(userId: string): Promise<EncryptedSecret[]>;
    /**
     * Get all secrets for a user (both active and inactive)
     */
    getAllUserSecrets(userId: string): Promise<EncryptedSecret[]>;
    /**
     * Get decrypted secret value (for code generation use)
     */
    getSecretValue(userId: string, secretId: string): Promise<string>;
    /**
     * Delete a secret permanently
     */
    deleteSecret(_userId: string, _secretId: string): Promise<void>;
    /**
     * Get BYOK (Bring Your Own Key) API keys as a map (provider -> decrypted key)
     */
    getUserBYOKKeysMap(userId: string): Promise<Map<string, string>>;
    /**
     * Toggle secret active status
     */
    toggleSecretActiveStatus(_userId: string, _secretId: string): Promise<EncryptedSecret>;
    /**
     * Format secret response (remove sensitive data)
     */
    private formatSecretResponse;
}
