import { BaseController } from '../baseController';
import { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import { AppsListData, PublicAppsData, SingleAppData, FavoriteToggleData, UpdateAppVisibilityData, AppDeleteData } from './types';
export declare class AppController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    static getUserApps(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppsListData>>>;
    static getRecentApps(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppsListData>>>;
    static getFavoriteApps(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppsListData>>>;
    static toggleFavorite(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<FavoriteToggleData>>>;
    static getPublicApps: (this: AppController, request: Request, env: Env, _ctx: ExecutionContext, _context: RouteContext) => Promise<ControllerResponse<ApiResponse<PublicAppsData>>>;
    static getApp(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<SingleAppData>>>;
    static updateAppVisibility(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<UpdateAppVisibilityData>>>;
    static deleteApp(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AppDeleteData>>>;
}
