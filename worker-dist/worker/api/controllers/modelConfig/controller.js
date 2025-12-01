/**
 * Model Configuration Controller
 * Handles CRUD operations for user model configurations
 */
import { BaseController } from '../baseController';
import { ModelConfigService } from '../../../database/services/ModelConfigService';
import { SecretsService } from '../../../database/services/SecretsService';
import { ModelTestService } from '../../../database/services/ModelTestService';
import { AGENT_CONFIG } from '../../../agents/inferutils/config';
import { getUserProviderStatus, getByokModels, getPlatformAvailableModels, validateModelAccessForEnvironment } from './byokHelper';
import { z } from 'zod';
import { createLogger } from '../../../logger';
// Validation schemas
const modelConfigUpdateSchema = z.object({
    modelName: z.string().min(1).max(100).nullable().optional(),
    maxTokens: z.number().min(1).max(200000).nullable().optional(),
    temperature: z.number().min(0).max(2).nullable().optional(),
    reasoningEffort: z.enum(['low', 'medium', 'high']).nullable().optional(),
    providerOverride: z.enum(['cloudflare', 'direct']).nullable().optional(),
    fallbackModel: z.string().min(1).max(100).nullable().optional(),
    isUserOverride: z.boolean().optional()
});
const modelTestSchema = z.object({
    agentActionName: z.string(),
    testPrompt: z.string().optional(),
    useUserKeys: z.boolean().default(true),
    tempConfig: modelConfigUpdateSchema.optional()
});
export class ModelConfigController extends BaseController {
    static logger = createLogger('ModelConfigController');
    /**
     * Get all model configurations for the current user
     * GET /api/model-configs
     */
    static async getModelConfigs(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const modelConfigService = new ModelConfigService(env);
            const configs = await modelConfigService.getUserModelConfigs(user.id);
            const defaults = modelConfigService.getDefaultConfigs();
            const responseData = {
                configs,
                defaults,
                message: 'Model configurations retrieved successfully'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error getting model configurations:', error);
            return ModelConfigController.createErrorResponse('Failed to get model configurations', 500);
        }
    }
    /**
     * Get a specific model configuration
     * GET /api/model-configs/:agentAction
     */
    static async getModelConfig(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const agentAction = url.pathname.split('/').pop();
            if (!agentAction || !(agentAction in AGENT_CONFIG)) {
                return ModelConfigController.createErrorResponse('Invalid agent action name', 400);
            }
            const modelConfigService = new ModelConfigService(env);
            const config = await modelConfigService.getUserModelConfig(user.id, agentAction);
            const defaultConfig = modelConfigService.getDefaultConfigs()[agentAction];
            const responseData = {
                config,
                defaultConfig,
                message: 'Model configuration retrieved successfully'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error getting model configuration:', error);
            return ModelConfigController.createErrorResponse('Failed to get model configuration', 500);
        }
    }
    /**
     * Update a specific model configuration
     * PUT /api/model-configs/:agentAction
     */
    static async updateModelConfig(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const agentAction = url.pathname.split('/').pop();
            if (!agentAction || !(agentAction in AGENT_CONFIG)) {
                return ModelConfigController.createErrorResponse('Invalid agent action name', 400);
            }
            const bodyResult = await ModelConfigController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const validatedData = modelConfigUpdateSchema.parse(bodyResult.data);
            // Convert to ModelConfig format - only include non-null values
            const modelConfig = {};
            if (validatedData.modelName !== null && validatedData.modelName !== undefined) {
                modelConfig.name = validatedData.modelName;
            }
            if (validatedData.maxTokens !== null && validatedData.maxTokens !== undefined) {
                modelConfig.max_tokens = validatedData.maxTokens;
            }
            if (validatedData.temperature !== null && validatedData.temperature !== undefined) {
                modelConfig.temperature = validatedData.temperature;
            }
            if (validatedData.reasoningEffort !== null && validatedData.reasoningEffort !== undefined) {
                modelConfig.reasoning_effort = validatedData.reasoningEffort;
            }
            if (validatedData.fallbackModel !== null && validatedData.fallbackModel !== undefined) {
                modelConfig.fallbackModel = validatedData.fallbackModel;
            }
            // Validate model access based on environment configuration and user BYOK status
            if (modelConfig.name || modelConfig.fallbackModel) {
                const userProviderStatus = await getUserProviderStatus(user.id, env);
                // Validate primary model
                if (modelConfig.name) {
                    const isValidAccess = validateModelAccessForEnvironment(modelConfig.name, env, userProviderStatus);
                    if (!isValidAccess) {
                        const provider = modelConfig.name.split('/')[0];
                        return ModelConfigController.createErrorResponse(`Model requires API key for provider '${provider}'. Please add your API key in the BYOK settings or contact your platform administrator.`, 403);
                    }
                }
                // Validate fallback model
                if (modelConfig.fallbackModel) {
                    const isValidAccess = validateModelAccessForEnvironment(modelConfig.fallbackModel, env, userProviderStatus);
                    if (!isValidAccess) {
                        const provider = modelConfig.fallbackModel.split('/')[0];
                        return ModelConfigController.createErrorResponse(`Fallback model requires API key for provider '${provider}'. Please add your API key in the BYOK settings or contact your platform administrator.`, 403);
                    }
                }
            }
            const modelConfigService = new ModelConfigService(env);
            const updatedConfig = await modelConfigService.upsertUserModelConfig(user.id, agentAction, modelConfig);
            const responseData = {
                config: updatedConfig,
                message: 'Model configuration updated successfully'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return ModelConfigController.createErrorResponse('Validation failed: ' + JSON.stringify(error.errors), 400);
            }
            this.logger.error('Error updating model configuration:', error);
            return ModelConfigController.createErrorResponse('Failed to update model configuration', 500);
        }
    }
    /**
     * Delete/reset a model configuration to default
     * DELETE /api/model-configs/:agentAction
     */
    static async deleteModelConfig(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const agentAction = url.pathname.split('/').pop();
            if (!agentAction || !(agentAction in AGENT_CONFIG)) {
                return ModelConfigController.createErrorResponse('Invalid agent action name', 400);
            }
            const modelConfigService = new ModelConfigService(env);
            const deleted = await modelConfigService.deleteUserModelConfig(user.id, agentAction);
            if (!deleted) {
                return ModelConfigController.createErrorResponse('Configuration not found or already using defaults', 404);
            }
            const responseData = {
                message: 'Model configuration reset to default successfully'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error deleting model configuration:', error);
            return ModelConfigController.createErrorResponse('Failed to delete model configuration', 500);
        }
    }
    /**
     * Test a model configuration
     * POST /api/model-configs/test
     */
    static async testModelConfig(request, env, _ctx, context) {
        try {
            const user = context.user;
            const bodyResult = await ModelConfigController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const validatedData = modelTestSchema.parse(bodyResult.data);
            const agentAction = validatedData.agentActionName;
            if (!(agentAction in AGENT_CONFIG)) {
                return ModelConfigController.createErrorResponse('Invalid agent action name', 400);
            }
            const modelConfigService = new ModelConfigService(env);
            const secretsService = new SecretsService(env);
            const modelTestService = new ModelTestService(env);
            // Get base configuration and merge with temporary changes if provided
            const baseConfig = await modelConfigService.getUserModelConfig(user.id, agentAction);
            const configToTest = validatedData.tempConfig ? {
                ...baseConfig,
                // Map frontend field names to backend config structure
                ...(validatedData.tempConfig.modelName != null && { name: validatedData.tempConfig.modelName }),
                ...(validatedData.tempConfig.maxTokens != null && { max_tokens: validatedData.tempConfig.maxTokens }),
                ...(validatedData.tempConfig.temperature != null && { temperature: validatedData.tempConfig.temperature }),
                ...(validatedData.tempConfig.reasoningEffort != null && { reasoning_effort: validatedData.tempConfig.reasoningEffort }),
                ...(validatedData.tempConfig.fallbackModel != null && { fallbackModel: validatedData.tempConfig.fallbackModel }),
                ...(validatedData.tempConfig.providerOverride != null && { providerOverride: validatedData.tempConfig.providerOverride })
            } : baseConfig;
            // Get user API keys if requested
            let userApiKeys;
            if (validatedData.useUserKeys) {
                const userApiKeysMap = await secretsService.getUserBYOKKeysMap(user.id);
                userApiKeys = Object.fromEntries(userApiKeysMap);
            }
            // Test the configuration
            const testResult = await modelTestService.testModelConfig({
                modelConfig: configToTest,
                userApiKeys,
                testPrompt: validatedData.testPrompt
            });
            const responseData = {
                testResult,
                message: testResult.success
                    ? 'Model configuration test successful'
                    : 'Model configuration test failed'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                return ModelConfigController.createErrorResponse('Validation failed: ' + JSON.stringify(error.errors), 400);
            }
            this.logger.error('Error testing model configuration:', error);
            return ModelConfigController.createErrorResponse('Failed to test model configuration', 500);
        }
    }
    /**
     * Reset all model configurations to defaults
     * POST /api/model-configs/reset-all
     */
    static async resetAllConfigs(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const modelConfigService = new ModelConfigService(env);
            const resetCount = await modelConfigService.resetAllUserConfigs(user.id);
            const responseData = {
                resetCount,
                message: `${resetCount} model configurations reset to defaults`
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error resetting all model configurations:', error);
            return ModelConfigController.createErrorResponse('Failed to reset model configurations', 500);
        }
    }
    /**
     * Get default configurations
     * GET /api/model-configs/defaults
     */
    static async getDefaults(_request, env, _ctx) {
        try {
            const modelConfigService = new ModelConfigService(env);
            const defaults = modelConfigService.getDefaultConfigs();
            const responseData = {
                defaults,
                message: 'Default configurations retrieved successfully'
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error getting default configurations:', error);
            return ModelConfigController.createErrorResponse('Failed to get default configurations', 500);
        }
    }
    /**
     * Get BYOK providers and available models
     * GET /api/model-configs/byok-providers
     */
    static async getByokProviders(_request, env, _ctx, context) {
        try {
            const user = context.user;
            // Get user's provider status
            const providers = await getUserProviderStatus(user.id, env);
            // Get models available for providers with valid keys
            const modelsByProvider = getByokModels(providers);
            // Get platform models based on environment configuration
            const platformModels = getPlatformAvailableModels(env);
            const responseData = {
                providers,
                modelsByProvider,
                platformModels
            };
            return ModelConfigController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error getting BYOK providers:', error);
            return ModelConfigController.createErrorResponse('Failed to get BYOK providers', 500);
        }
    }
}
