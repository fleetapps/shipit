import { BaseController } from '../baseController';
import { getAgentStubLightweight } from '../../../agents';
import { AppService } from '../../../database/services/AppService';
import { createLogger } from '../../../logger';
import { buildUserWorkerUrl, buildGitCloneUrl } from '../../../utils/urls';
import { JWTUtils } from '../../../utils/jwtUtils';
export class AppViewController extends BaseController {
    static logger = createLogger('AppViewController');
    // Get single app details (public endpoint, auth optional for ownership check)
    static async getAppDetails(request, env, _ctx, context) {
        try {
            const appId = context.pathParams.id;
            if (!appId) {
                return AppViewController.createErrorResponse('App ID is required', 400);
            }
            // Try to get user if authenticated (optional for public endpoint)
            const user = await AppViewController.getOptionalUser(request, env);
            const userId = user?.id;
            // Get app details with stats using app service
            const appService = new AppService(env);
            const appResult = await appService.getAppDetails(appId, userId);
            if (!appResult) {
                return AppViewController.createErrorResponse('App not found', 404);
            }
            // Check if user has permission to view
            if (appResult.visibility === 'private' && appResult.userId !== userId) {
                return AppViewController.createErrorResponse('App not found', 404);
            }
            // Track view for all users (including owners and anonymous users)
            if (userId) {
                // Authenticated user view
                await appService.recordAppView(appId, userId);
            }
            else {
                // Anonymous user view - use a special anonymous identifier
                // This could be enhanced with session tracking or IP-based deduplication
                await appService.recordAppView(appId, 'anonymous-' + Date.now());
            }
            // Try to fetch current agent state to get latest generated code
            let agentSummary = null;
            let previewUrl = '';
            try {
                // Use lightweight stub for read-only operations (faster - skips template loading)
                const agentStub = await getAgentStubLightweight(env, appResult.id);
                agentSummary = await agentStub.getSummary();
                previewUrl = await agentStub.getPreviewUrlCache();
            }
            catch (agentError) {
                // If agent doesn't exist or error occurred, fall back to database stored files
                this.logger.warn('Could not fetch agent state, using stored files:', agentError);
            }
            const cloudflareUrl = appResult.deploymentId ? buildUserWorkerUrl(env, appResult.deploymentId) : '';
            const responseData = {
                ...appResult, // Spread all EnhancedAppData fields including stats
                cloudflareUrl: cloudflareUrl,
                previewUrl: previewUrl || cloudflareUrl,
                user: {
                    id: appResult.userId,
                    displayName: appResult.userName || 'Unknown',
                    avatarUrl: appResult.userAvatar
                },
                agentSummary,
            };
            return AppViewController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching app details:', error);
            return AppViewController.createErrorResponse('Internal server error', 500);
        }
    }
    // Star/unstar an app
    static async toggleAppStar(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appId = context.pathParams.id;
            if (!appId) {
                return AppViewController.createErrorResponse('App ID is required', 400);
            }
            // Check if app exists and toggle star using app service
            const appService = new AppService(env);
            const app = await appService.getSingleAppWithFavoriteStatus(appId, user.id);
            if (!app) {
                return AppViewController.createErrorResponse('App not found', 404);
            }
            // Toggle star using app service
            const result = await appService.toggleAppStar(user.id, appId);
            const responseData = result;
            return AppViewController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error toggling star:', error);
            return AppViewController.createErrorResponse('Internal server error', 500);
        }
    }
    // // Fork an app
    // DISABLED: Has been disabled for initial alpha release, for security reasons
    // static async forkApp(_request: Request, env: Env, _ctx: ExecutionContext, context: RouteContext): Promise<ControllerResponse<ApiResponse<ForkAppData>>> {
    //     try {
    //         const user = context.user!;
    //         const appId = context.pathParams.id;
    //         if (!appId) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App ID is required', 400);
    //         }
    //         // Get original app with permission checks using app service
    //         const appService = new AppService(env);
    //         const { app: originalApp, canFork } = await appService.getAppForFork(appId, user.id);
    //         if (!originalApp) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App not found', 404);
    //         }
    //         if (!canFork) {
    //             return AppViewController.createErrorResponse<ForkAppData>('App not found', 404);
    //         }
    //         // Duplicate agent state first
    //         try {
    //             const { newAgentId } = await cloneAgent(env, appId, this.logger);
    //             this.logger.info(`Successfully duplicated agent state from ${appId} to ${newAgentId}`);
    //             // Create forked app using app service
    //             const forkedApp = await appService.createForkedApp(originalApp, newAgentId, user.id);
    //             const responseData: ForkAppData = {
    //                 forkedAppId: forkedApp.id,
    //                 message: 'App forked successfully'
    //             };
    //             return AppViewController.createSuccessResponse(responseData);
    //         } catch (error) {
    //             this.logger.error('Failed to duplicate agent state:', error);
    //             return AppViewController.createErrorResponse<ForkAppData>('Failed to duplicate agent state', 500);
    //         }
    //     } catch (error) {
    //         this.logger.error('Error forking app:', error);
    //         return AppViewController.createErrorResponse<ForkAppData>('Internal server error', 500);
    //     }
    // }
    /**
     * Generate short-lived token for git clone (private repos only)
     * POST /api/apps/:id/git/token
     */
    static async generateGitCloneToken(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appId = context.pathParams.id;
            if (!appId) {
                return AppViewController.createErrorResponse('App ID is required', 400);
            }
            // Generate short-lived JWT (1 hour)
            const jwtUtils = JWTUtils.getInstance(env);
            const expiresIn = 3600; // 1 hour
            const token = await jwtUtils.createToken({
                sub: user.id,
                email: user.email,
                type: 'access',
                sessionId: 'git-clone-' + appId, // Special session for git operations
            }, expiresIn);
            const responseData = {
                token,
                expiresIn,
                expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
                cloneUrl: buildGitCloneUrl(env, appId, token)
            };
            return AppViewController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error generating git clone token:', error);
            return AppViewController.createErrorResponse('Failed to generate token', 500);
        }
    }
}
