/**
 * Model Configuration Controller
 * Handles CRUD operations for user model configurations
 */
import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
import { ApiResponse, ControllerResponse } from '../types';
import { ModelConfigsData, ModelConfigData, ModelConfigUpdateData, ModelConfigTestData, ModelConfigResetData, ModelConfigDefaultsData, ModelConfigDeleteData, ByokProvidersData } from './types';
export declare class ModelConfigController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Get all model configurations for the current user
     * GET /api/model-configs
     */
    static getModelConfigs(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigsData>>>;
    /**
     * Get a specific model configuration
     * GET /api/model-configs/:agentAction
     */
    static getModelConfig(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigData>>>;
    /**
     * Update a specific model configuration
     * PUT /api/model-configs/:agentAction
     */
    static updateModelConfig(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigUpdateData>>>;
    /**
     * Delete/reset a model configuration to default
     * DELETE /api/model-configs/:agentAction
     */
    static deleteModelConfig(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigDeleteData>>>;
    /**
     * Test a model configuration
     * POST /api/model-configs/test
     */
    static testModelConfig(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigTestData>>>;
    /**
     * Reset all model configurations to defaults
     * POST /api/model-configs/reset-all
     */
    static resetAllConfigs(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelConfigResetData>>>;
    /**
     * Get default configurations
     * GET /api/model-configs/defaults
     */
    static getDefaults(_request: Request, env: Env, _ctx: ExecutionContext): Promise<ControllerResponse<ApiResponse<ModelConfigDefaultsData>>>;
    /**
     * Get BYOK providers and available models
     * GET /api/model-configs/byok-providers
     */
    static getByokProviders(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ByokProvidersData>>>;
}
