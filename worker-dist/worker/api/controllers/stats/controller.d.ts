import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
import { ApiResponse, ControllerResponse } from '../types';
import { UserStatsData, UserActivityData } from './types';
export declare class StatsController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    static getUserStats(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<UserStatsData>>>;
    static getUserActivity(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<UserActivityData>>>;
}
