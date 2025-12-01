/**
 * Model Providers Controller
 * Handles CRUD operations for user custom model providers
 */
import { BaseController } from '../baseController';
import { SecretsService } from '../../../database/services/SecretsService';
import { ModelProvidersService } from '../../../database/services/ModelProvidersService';
import { z } from 'zod';
import { createLogger } from '../../../logger';
// Validation schemas
const createProviderSchema = z.object({
    name: z.string().min(1).max(100),
    baseUrl: z.string().url(),
    apiKey: z.string().min(1)
});
const updateProviderSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    baseUrl: z.string().url().optional(),
    apiKey: z.string().min(1).optional(),
    isActive: z.boolean().optional()
});
const testProviderSchema = z.object({
    providerId: z.string().optional(),
    baseUrl: z.string().url().optional(),
    apiKey: z.string().min(1).optional()
}).refine((data) => data.providerId || (data.baseUrl && data.apiKey), "Either providerId or both baseUrl and apiKey must be provided");
export class ModelProvidersController extends BaseController {
    static logger = createLogger('ModelProvidersController');
    /**
     * Get all custom providers for the authenticated user
     */
    static async getProviders(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const modelProvidersService = new ModelProvidersService(env);
            const providers = await modelProvidersService.getUserProviders(user.id);
            return ModelProvidersController.createSuccessResponse({
                providers: providers.filter(p => p.isActive)
            });
        }
        catch (error) {
            this.logger.error('Error getting providers:', error);
            return ModelProvidersController.createErrorResponse('Failed to get providers', 500);
        }
    }
    /**
     * Get a specific provider by ID
     */
    static async getProvider(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const providerId = url.pathname.split('/').pop();
            if (!providerId) {
                return ModelProvidersController.createErrorResponse('Provider ID is required', 400);
            }
            const modelProvidersService = new ModelProvidersService(env);
            const provider = await modelProvidersService.getProvider(user.id, providerId);
            if (!provider) {
                throw new Error('Provider not found');
            }
            return ModelProvidersController.createSuccessResponse({
                provider
            });
        }
        catch (error) {
            this.logger.error('Error getting provider:', error);
            return ModelProvidersController.createErrorResponse('Failed to get provider', 500);
        }
    }
    /**
     * Create a new custom provider
     */
    static async createProvider(request, env, _ctx, context) {
        try {
            const user = context.user;
            const bodyResult = await ModelProvidersController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const validation = createProviderSchema.safeParse(bodyResult.data);
            if (!validation.success) {
                return ModelProvidersController.createErrorResponse(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
            }
            const { name, baseUrl, apiKey } = validation.data;
            const modelProvidersService = new ModelProvidersService(env);
            const exists = await modelProvidersService.providerExists(user.id, name);
            if (exists) {
                throw new Error('Provider name already exists');
            }
            const secretsService = new SecretsService(env);
            const secretResult = await secretsService.storeSecret(user.id, {
                name: `${name} API Key`,
                provider: 'custom',
                secretType: 'api_key',
                value: apiKey,
                description: `API key for custom provider: ${name}`,
                expiresAt: null
            });
            const provider = await modelProvidersService.createProvider(user.id, {
                name,
                baseUrl,
                secretId: secretResult.id
            });
            return ModelProvidersController.createSuccessResponse({
                provider
            });
        }
        catch (error) {
            return ModelProvidersController.createErrorResponse('Failed to create provider', 500);
        }
    }
    /**
     * Update an existing provider
     */
    static async updateProvider(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const providerId = url.pathname.split('/').pop();
            if (!providerId) {
                return ModelProvidersController.createErrorResponse('Provider ID is required', 400);
            }
            const bodyResult = await ModelProvidersController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const validation = updateProviderSchema.safeParse(bodyResult.data);
            if (!validation.success) {
                return ModelProvidersController.createErrorResponse(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
            }
            const updates = validation.data;
            const modelProvidersService = new ModelProvidersService(env);
            const secretsService = new SecretsService(env);
            const existingProvider = await modelProvidersService.getProvider(user.id, providerId);
            if (!existingProvider) {
                throw new Error('Provider not found');
            }
            let secretId = existingProvider.secretId;
            if (updates.apiKey) {
                if (existingProvider.secretId) {
                    await secretsService.deleteSecret(user.id, existingProvider.secretId);
                }
                const secretResult = await secretsService.storeSecret(user.id, {
                    name: `${updates.name || existingProvider.name} API Key`,
                    provider: 'custom',
                    secretType: 'api_key',
                    value: updates.apiKey,
                    description: `API key for custom provider: ${updates.name || existingProvider.name}`,
                    expiresAt: null
                });
                secretId = secretResult.id;
            }
            const updatedProvider = await modelProvidersService.updateProvider(user.id, providerId, {
                name: updates.name,
                baseUrl: updates.baseUrl,
                isActive: updates.isActive,
                secretId
            });
            if (!updatedProvider) {
                throw new Error('Failed to update provider');
            }
            return ModelProvidersController.createSuccessResponse({
                provider: updatedProvider
            });
        }
        catch (error) {
            this.logger.error('Error updating provider:', error);
            return ModelProvidersController.createErrorResponse('Failed to update provider', 500);
        }
    }
    /**
     * Delete a provider
     */
    static async deleteProvider(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const providerId = url.pathname.split('/').pop();
            if (!providerId) {
                return ModelProvidersController.createErrorResponse('Provider ID is required', 400);
            }
            const modelProvidersService = new ModelProvidersService(env);
            const secretsService = new SecretsService(env);
            const existingProvider = await modelProvidersService.getProvider(user.id, providerId);
            if (!existingProvider) {
                throw new Error('Provider not found');
            }
            if (existingProvider.secretId) {
                await secretsService.deleteSecret(user.id, existingProvider.secretId);
            }
            const updated = await modelProvidersService.updateProvider(user.id, providerId, {
                isActive: false
            });
            return ModelProvidersController.createSuccessResponse({
                success: !!updated,
                providerId
            });
        }
        catch (error) {
            this.logger.error('Error deleting provider:', error);
            return ModelProvidersController.createErrorResponse('Failed to delete provider', 500);
        }
    }
    /**
     * Test provider connection
     */
    static async testProvider(request, env, _ctx, context) {
        try {
            const user = context.user;
            const bodyResult = await ModelProvidersController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const validation = testProviderSchema.safeParse(bodyResult.data);
            if (!validation.success) {
                return ModelProvidersController.createErrorResponse(`Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`, 400);
            }
            let baseUrl;
            let apiKey;
            if (validation.data.providerId) {
                const modelProvidersService = new ModelProvidersService(env);
                const secretsService = new SecretsService(env);
                const provider = await modelProvidersService.getProvider(user.id, validation.data.providerId);
                if (!provider) {
                    throw new Error('Provider not found');
                }
                if (!provider.secretId) {
                    throw new Error('Provider has no API key');
                }
                const secretValue = await secretsService.getSecretValue(user.id, provider.secretId);
                if (!secretValue) {
                    throw new Error('API key not found');
                }
                baseUrl = provider.baseUrl;
                apiKey = secretValue;
            }
            else {
                baseUrl = validation.data.baseUrl;
                apiKey = validation.data.apiKey;
            }
            const startTime = Date.now();
            try {
                const testUrl = `${baseUrl.replace(/\/$/, '')}/models`;
                const response = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                const responseTime = Date.now() - startTime;
                if (response.ok) {
                    return ModelProvidersController.createSuccessResponse({
                        success: true,
                        responseTime
                    });
                }
                else {
                    const errorText = await response.text();
                    return ModelProvidersController.createErrorResponse(`API request failed: ${response.status} ${errorText}`, 500);
                }
            }
            catch (error) {
                return ModelProvidersController.createErrorResponse(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
            }
        }
        catch (error) {
            this.logger.error('Error testing provider:', error);
            return ModelProvidersController.createErrorResponse('Failed to test provider', 500);
        }
    }
}
