import { BaseController } from '../baseController';
import type { ControllerResponse, ApiResponse } from '../types';
import type { RouteContext } from '../../types/route-context';
export declare class ScreenshotsController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    static serveScreenshot(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<never>>>;
}
