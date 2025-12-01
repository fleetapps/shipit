import { BaseController } from '../baseController';
import type { ApiResponse, ControllerResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
import type { PlatformStatusData } from './types';
export declare class StatusController extends BaseController {
    static getPlatformStatus(_request: Request, _env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<PlatformStatusData>>>;
}
