/**
 * Model Providers Controller
 * Handles CRUD operations for user custom model providers
 */
import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
import { ApiResponse, ControllerResponse } from '../types';
import { ModelProvidersListData, ModelProviderData, ModelProviderCreateData, ModelProviderUpdateData, ModelProviderDeleteData, ModelProviderTestData } from './types';
export declare class ModelProvidersController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Get all custom providers for the authenticated user
     */
    static getProviders(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProvidersListData>>>;
    /**
     * Get a specific provider by ID
     */
    static getProvider(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProviderData>>>;
    /**
     * Create a new custom provider
     */
    static createProvider(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProviderCreateData>>>;
    /**
     * Update an existing provider
     */
    static updateProvider(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProviderUpdateData>>>;
    /**
     * Delete a provider
     */
    static deleteProvider(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProviderDeleteData>>>;
    /**
     * Test provider connection
     */
    static testProvider(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ModelProviderTestData>>>;
}
