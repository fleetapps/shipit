import { BaseController } from '../baseController';
import { AgentConnectionData, AgentPreviewResponse } from './types';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
/**
 * CodingAgentController to handle all code generation related endpoints
 */
export declare class CodingAgentController extends BaseController {
    static logger: import("../../../logger").StructuredLogger;
    /**
     * Start the incremental code generation process
     */
    static startCodeGeneration(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<Response>;
    /**
     * Handle WebSocket connections for code generation
     * This routes the WebSocket connection directly to the Agent
     */
    static handleWebSocketConnection(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<Response>;
    /**
     * Verify that an anonymous user can access an agent
     * Allows access if agent was created recently (< 1 hour ago) and belongs to anonymous user
     */
    private static verifyAnonymousAccess;
    /**
     * Connect to an existing agent instance
     * Returns connection information for an already created agent
     */
    static connectToExistingAgent(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AgentConnectionData>>>;
    static deployPreview(_request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<AgentPreviewResponse>>>;
    /**
     * Trigger code generation via HTTP (fallback when WebSocket fails)
     * POST /api/agent/:agentId/generate
     */
    static triggerCodeGeneration(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<{
        message: string;
        agentId: string;
    }>>>;
}
