import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
export interface GitHubExportData {
    success: boolean;
    repositoryUrl?: string;
    error?: string;
}
export declare class GitHubExporterController extends BaseController {
    static readonly logger: import("../../../logger").StructuredLogger;
    /**
     * Creates GitHub repository and pushes files from agent
     * If existingRepositoryUrl is provided, skips creation and syncs to existing repo
     */
    private static createRepositoryAndPush;
    static handleOAuthCallback(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<Response>;
    static initiateGitHubExport(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<Response>;
    static checkRemoteStatus(request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<Response>;
}
