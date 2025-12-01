import { AppService } from '../../../database/services/AppService';
import { formatRelativeTime } from '../../../utils/timeFormatter';
import { BaseController } from '../baseController';
// import { withCache } from '../../../services/cache/wrapper';
import { createLogger } from '../../../logger';
export class AppController extends BaseController {
    static logger = createLogger('AppController');
    // Get all apps for the current user
    static async getUserApps(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appService = new AppService(env);
            const userApps = await appService.getUserAppsWithFavorites(user.id);
            const responseData = {
                apps: userApps // Already properly typed and formatted by DatabaseService
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching user apps:', error);
            return AppController.createErrorResponse('Failed to fetch apps', 500);
        }
    }
    // Get recent apps (last 10)
    static async getRecentApps(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appService = new AppService(env);
            const recentApps = await appService.getRecentAppsWithFavorites(user.id, 10);
            const responseData = {
                apps: recentApps // Already properly typed and formatted by DatabaseService
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching recent apps:', error);
            return AppController.createErrorResponse('Failed to fetch recent apps', 500);
        }
    }
    // Get favorite apps - NO CACHE (user-specific, real-time)
    static async getFavoriteApps(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appService = new AppService(env);
            const favoriteApps = await appService.getFavoriteAppsOnly(user.id);
            const responseData = {
                apps: favoriteApps
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching favorite apps:', error);
            return AppController.createErrorResponse('Failed to fetch favorite apps', 500);
        }
    }
    // Toggle favorite status
    static async toggleFavorite(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appService = new AppService(env);
            const appId = context.pathParams.id;
            if (!appId) {
                return AppController.createErrorResponse('App ID is required', 400);
            }
            // Check if app exists (no ownership check needed - users can bookmark any app)
            const ownershipResult = await appService.checkAppOwnership(appId, user.id);
            if (!ownershipResult.exists) {
                return AppController.createErrorResponse('App not found', 404);
            }
            const result = await appService.toggleAppFavorite(user.id, appId);
            const responseData = result;
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error toggling favorite:', error);
            return AppController.createErrorResponse('Failed to toggle favorite', 500);
        }
    }
    // Get public apps feed (like a global board)
    static getPublicApps = async function (request, env, _ctx, _context) {
        try {
            const url = new URL(request.url);
            // Parse query parameters with type safety
            const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
            const page = parseInt(url.searchParams.get('page') || '1');
            const offset = (page - 1) * limit;
            const sort = (url.searchParams.get('sort') || 'recent');
            const order = (url.searchParams.get('order') || 'desc');
            const period = (url.searchParams.get('period') || 'all');
            const framework = url.searchParams.get('framework') || undefined;
            const search = url.searchParams.get('search') || undefined;
            const user = await AppController.getOptionalUser(request, env);
            const userId = user?.id;
            // Get apps
            const appService = new AppService(env);
            const result = await appService.getPublicApps({
                limit,
                offset,
                sort,
                order,
                period,
                framework,
                search,
                userId
            });
            // Format response with relative timestamps
            const responseData = {
                apps: result.data.map(app => ({
                    ...app,
                    userName: app.userName || 'Anonymous User',
                    userAvatar: app.userAvatar || null,
                    updatedAtFormatted: formatRelativeTime(app.updatedAt),
                    createdAtFormatted: app.createdAt ? formatRelativeTime(app.createdAt) : ''
                })),
                pagination: result.pagination
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            AppController.logger.error('Error fetching public apps:', error);
            return AppController.createErrorResponse('Failed to fetch public apps', 500);
        }
    };
    // Get single app
    static async getApp(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appId = context.pathParams.id;
            if (!appId) {
                return AppController.createErrorResponse('App ID is required', 400);
            }
            const appService = new AppService(env);
            const app = await appService.getSingleAppWithFavoriteStatus(appId, user.id);
            if (!app) {
                return AppController.createErrorResponse('App not found', 404);
            }
            const responseData = { app };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching app:', error);
            return AppController.createErrorResponse('Failed to fetch app', 500);
        }
    }
    // Update app visibility
    static async updateAppVisibility(request, env, _ctx, context) {
        try {
            const user = context.user;
            const appId = context.pathParams.id;
            if (!appId) {
                return AppController.createErrorResponse('App ID is required', 400);
            }
            const bodyResult = await AppController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const visibility = bodyResult.data?.visibility;
            // Validate visibility value
            if (!visibility || !['private', 'public'].includes(visibility)) {
                return AppController.createErrorResponse('Visibility must be either "private" or "public"', 400);
            }
            const validVisibility = visibility;
            const appService = new AppService(env);
            const result = await appService.updateAppVisibility(appId, user.id, validVisibility);
            if (!result.success) {
                const statusCode = result.error === 'App not found' ? 404 :
                    result.error?.includes('only change visibility of your own apps') ? 403 : 500;
                return AppController.createErrorResponse(result.error || 'Failed to update app visibility', statusCode);
            }
            const responseData = {
                app: {
                    ...result.app,
                    visibility: result.app.visibility
                },
                message: `App visibility updated to ${validVisibility}`
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error updating app visibility:', error);
            return AppController.createErrorResponse('Failed to update app visibility', 500);
        }
    }
    // Delete app
    static async deleteApp(_request, env, _ctx, context) {
        try {
            const user = context.user;
            const appId = context.pathParams.id;
            if (!appId) {
                return AppController.createErrorResponse('App ID is required', 400);
            }
            const appService = new AppService(env);
            const result = await appService.deleteApp(appId, user.id);
            if (!result.success) {
                const statusCode = result.error === 'App not found' ? 404 :
                    result.error?.includes('only delete your own apps') ? 403 : 500;
                return AppController.createErrorResponse(result.error || 'Failed to delete app', statusCode);
            }
            const responseData = {
                success: true,
                message: 'App deleted successfully'
            };
            return AppController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error deleting app:', error);
            return AppController.createErrorResponse('Failed to delete app', 500);
        }
    }
}
