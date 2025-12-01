/**
 * Secrets Controller
 * Handles API endpoints for user secrets and API keys management
 */
import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
import { SecretsData, SecretStoreData, SecretDeleteData, SecretTemplatesData } from './types';
export declare class SecretsController extends BaseController {
    /**
     * Get all user secrets including inactive ones
     * GET /api/secrets
     */
    static getAllSecrets(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<SecretsData>>>;
    /**
     * Store a new secret
     * POST /api/secrets
     */
    static storeSecret(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<SecretStoreData>>>;
    /**
     * Delete a secret
     * DELETE /api/secrets/:secretId
     */
    static deleteSecret(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<SecretDeleteData>>>;
    /**
     * Toggle secret active status
     * PATCH /api/secrets/:secretId/toggle
     */
    static toggleSecret(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<SecretStoreData>>>;
    /**
     * Get predefined secret templates for common providers
     * GET /api/secrets/templates
     */
    static getTemplates(request: Request, _env: Env, _ctx: ExecutionContext): Promise<ControllerResponse<ApiResponse<SecretTemplatesData>>>;
}
