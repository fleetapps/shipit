import { BaseController } from '../baseController';
import { AnalyticsService } from '../../../database/services/AnalyticsService';
import { createLogger } from '../../../logger';
export class StatsController extends BaseController {
    static logger = createLogger('StatsController');
    // Get user statistics
    static async getUserStats(_request, env, _ctx, context) {
        try {
            const user = context.user;
            // Get comprehensive user statistics using analytics service
            const analyticsService = new AnalyticsService(env);
            const userStats = await analyticsService.getUserStats(user.id);
            const responseData = userStats;
            return StatsController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching user stats:', error);
            return StatsController.createErrorResponse('Failed to fetch user statistics', 500);
        }
    }
    // Get user activity timeline
    static async getUserActivity(_request, env, _ctx, context) {
        try {
            const user = context.user;
            // Get user activity timeline using analytics service
            const analyticsService = new AnalyticsService(env);
            const activities = await analyticsService.getUserActivityTimeline(user.id, 20);
            const responseData = { activities };
            return StatsController.createSuccessResponse(responseData);
        }
        catch (error) {
            this.logger.error('Error fetching user activity:', error);
            return StatsController.createErrorResponse('Failed to fetch user activity', 500);
        }
    }
}
