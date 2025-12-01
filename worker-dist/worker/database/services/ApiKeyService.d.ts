/**
 * API Key Service
 * Handles all API key-related database operations
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
export interface ApiKeyInfo {
    id: string;
    name: string;
    keyPreview: string;
    createdAt: Date | null;
    lastUsed?: Date | null;
    isActive: boolean | null;
}
export interface CreateApiKeyData {
    userId: string;
    name: string;
    keyHash: string;
    keyPreview: string;
}
/**
 * API Key Service for managing API keys
 */
export declare class ApiKeyService extends BaseService {
    /**
     * Get all API keys for a user
     */
    getUserApiKeys(userId: string): Promise<ApiKeyInfo[]>;
    /**
     * Create a new API key
     */
    createApiKey(data: CreateApiKeyData): Promise<string>;
    /**
     * Revoke an API key
     */
    revokeApiKey(keyId: string, userId: string): Promise<boolean>;
    /**
     * Find API key by hash
     */
    findApiKeyByHash(keyHash: string): Promise<schema.ApiKey | null>;
    /**
     * Update API key last used time
     */
    updateApiKeyLastUsed(keyId: string): Promise<void>;
    /**
     * Check if API key name is unique for user
     */
    isApiKeyNameUnique(userId: string, name: string): Promise<boolean>;
    /**
     * Get active API key count for user
     */
    getActiveApiKeyCount(userId: string): Promise<number>;
}
