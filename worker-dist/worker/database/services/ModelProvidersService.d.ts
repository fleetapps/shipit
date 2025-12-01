/**
 * Model Providers Service
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
export interface CreateProviderData {
    name: string;
    baseUrl: string;
    secretId: string;
}
export interface UpdateProviderData {
    name?: string;
    baseUrl?: string;
    secretId?: string | null;
    isActive?: boolean;
}
export declare class ModelProvidersService extends BaseService {
    /**
     * Check if provider name exists for user
     */
    providerExists(userId: string, name: string): Promise<boolean>;
    /**
     * Create a new model provider
     */
    createProvider(userId: string, data: CreateProviderData): Promise<schema.UserModelProvider>;
    /**
     * Get all providers for a user
     */
    getUserProviders(userId: string): Promise<schema.UserModelProvider[]>;
    /**
     * Get a specific provider by ID
     */
    getProvider(userId: string, providerId: string): Promise<schema.UserModelProvider | null>;
    /**
     * Get a provider by name
     */
    getProviderByName(userId: string, name: string): Promise<schema.UserModelProvider | null>;
    /**
     * Update a provider
     */
    updateProvider(userId: string, providerId: string, data: UpdateProviderData): Promise<schema.UserModelProvider | null>;
    /**
     * Delete a provider
     */
    deleteProvider(userId: string, providerId: string): Promise<boolean>;
    /**
     * Toggle provider active status
     */
    toggleProviderStatus(userId: string, providerId: string): Promise<schema.UserModelProvider | null>;
    /**
     * Get provider count for user
     */
    getProviderCount(userId: string): Promise<number>;
}
