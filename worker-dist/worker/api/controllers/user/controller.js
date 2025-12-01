import { BaseController } from '../baseController';
import { UserService } from '../../../database/services/UserService';
import { AppService } from '../../../database/services/AppService';
import { createLogger } from '../../../logger';
const logger = createLogger('UserController');
/**
 * User Management Controller for Orange
 * Handles user dashboard, profile management, and app history
 */
export class UserController extends BaseController {
    static logger = logger;
    /**
     * Get user's apps with pagination and filtering
     */
    static async getApps(request, env, _ctx, context) {
        try {
            const user = context.user;
            const url = new URL(request.url);
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');
            const status = url.searchParams.get('status');
            const visibility = url.searchParams.get('visibility');
            const framework = url.searchParams.get('framework') || undefined;
            const search = url.searchParams.get('search') || undefined;
            const sort = (url.searchParams.get('sort') || 'recent');
            const order = (url.searchParams.get('order') || 'desc');
            const period = (url.searchParams.get('period') || 'all');
            const offset = (page - 1) * limit;
            const queryOptions = {
                limit,
                offset,
                status,
                visibility,
                framework,
                search,
                sort,
                order,
                period
            };
            const appService = new AppService(env);
            // Get user apps with analytics and proper total count
            const [apps, totalCount] = await Promise.all([
                appService.getUserAppsWithAnalytics(user.id, queryOptions),
                appService.getUserAppsCount(user.id, queryOptions)
            ]);
            const responseData = {
                apps,
                pagination: {
                    limit,
                    offset,
                    total: totalCount,
                    hasMore: offset + limit < totalCount
                }
            };
            return UserController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error getting user apps:', error);
            return UserController.createErrorResponse('Failed to get user apps', 500);
        }
    }
    /**
     * Update user profile
     */
    static async updateProfile(request, env, _ctx, context) {
        try {
            const user = context.user;
            const bodyResult = await UserController.parseJsonBody(request);
            if (!bodyResult.success) {
                return bodyResult.response;
            }
            const userService = new UserService(env);
            const result = await userService.updateUserProfileWithValidation(user.id, bodyResult.data);
            if (!result.success) {
                return UserController.createErrorResponse(result.message, 400);
            }
            const responseData = result;
            return UserController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error updating user profile:', error);
            return UserController.createErrorResponse('Failed to update profile', 500);
        }
    }
}
