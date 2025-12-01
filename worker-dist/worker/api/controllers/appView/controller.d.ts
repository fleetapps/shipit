import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { AppDetailsData, AppStarToggleData, GitCloneTokenData } from './types';
export declare class AppViewController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    static getAppDetails(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppDetailsData>>>;
    static toggleAppStar(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppStarToggleData>>>;
    /**
     * Generate short-lived token for git clone (private repos only)
     * POST /api/apps/:id/git/token
     */
    static generateGitCloneToken(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<GitCloneTokenData>>>;
}
