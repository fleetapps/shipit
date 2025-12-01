/**
 * Model Providers Service
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
import { eq, and, sql } from 'drizzle-orm';
import { generateId } from '../../utils/idGenerator';
export class ModelProvidersService extends BaseService {
    /**
     * Check if provider name exists for user
     */
    async providerExists(userId, name) {
        const existing = await this.database
            .select()
            .from(schema.userModelProviders)
            .where(and(eq(schema.userModelProviders.userId, userId), eq(schema.userModelProviders.name, name)))
            .get();
        return !!existing;
    }
    /**
     * Create a new model provider
     */
    async createProvider(userId, data) {
        const providerId = generateId();
        const provider = {
            id: providerId,
            userId,
            name: data.name,
            baseUrl: data.baseUrl,
            secretId: data.secretId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const [created] = await this.database
            .insert(schema.userModelProviders)
            .values(provider)
            .returning();
        return created;
    }
    /**
     * Get all providers for a user
     */
    async getUserProviders(userId) {
        return await this.database
            .select()
            .from(schema.userModelProviders)
            .where(eq(schema.userModelProviders.userId, userId))
            .all();
    }
    /**
     * Get a specific provider by ID
     */
    async getProvider(userId, providerId) {
        const provider = await this.database
            .select()
            .from(schema.userModelProviders)
            .where(and(eq(schema.userModelProviders.id, providerId), eq(schema.userModelProviders.userId, userId)))
            .get();
        return provider || null;
    }
    /**
     * Get a provider by name
     */
    async getProviderByName(userId, name) {
        const provider = await this.database
            .select()
            .from(schema.userModelProviders)
            .where(and(eq(schema.userModelProviders.userId, userId), eq(schema.userModelProviders.name, name)))
            .get();
        return provider || null;
    }
    /**
     * Update a provider
     */
    async updateProvider(userId, providerId, data) {
        const updateData = {
            ...data,
            updatedAt: new Date()
        };
        const [updated] = await this.database
            .update(schema.userModelProviders)
            .set(updateData)
            .where(and(eq(schema.userModelProviders.id, providerId), eq(schema.userModelProviders.userId, userId)))
            .returning();
        return updated || null;
    }
    /**
     * Delete a provider
     */
    async deleteProvider(userId, providerId) {
        const result = await this.database
            .delete(schema.userModelProviders)
            .where(and(eq(schema.userModelProviders.id, providerId), eq(schema.userModelProviders.userId, userId)))
            .returning();
        return result.length > 0;
    }
    /**
     * Toggle provider active status
     */
    async toggleProviderStatus(userId, providerId) {
        const provider = await this.getProvider(userId, providerId);
        if (!provider) {
            return null;
        }
        return await this.updateProvider(userId, providerId, {
            isActive: !provider.isActive
        });
    }
    /**
     * Get provider count for user
     */
    async getProviderCount(userId) {
        const result = await this.database
            .select({ count: sql `count(*)` })
            .from(schema.userModelProviders)
            .where(eq(schema.userModelProviders.userId, userId))
            .get();
        return result?.count || 0;
    }
}
