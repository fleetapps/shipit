import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
import { UserAppsData, ProfileUpdateData } from './types';
/**
 * User Management Controller for Orange
 * Handles user dashboard, profile management, and app history
 */
export declare class UserController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Get user's apps with pagination and filtering
     */
    static getApps(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<UserAppsData>>>;
    /**
     * Update user profile
     */
    static updateProfile(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ProfileUpdateData>>>;
}
