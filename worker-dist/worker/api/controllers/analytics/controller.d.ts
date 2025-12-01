/**
 * Analytics Controller
 * Handles AI Gateway analytics API endpoints
 */
import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
import { ApiResponse, ControllerResponse } from '../types';
import { UserAnalyticsResponseData, AgentAnalyticsResponseData } from './types';
export declare class AnalyticsController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Get analytics data for a specific user
     * GET /api/user/:id/analytics
     */
    static getUserAnalytics(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<UserAnalyticsResponseData>>>;
    /**
     * Get analytics data for a specific agent/chat
     * GET /api/agent/:id/analytics
     */
    static getAgentAnalytics(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AgentAnalyticsResponseData>>>;
}
