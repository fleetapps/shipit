import { StatsController } from '../controllers/stats/controller';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
/**
 * Setup user statistics routes
 */
export function setupStatsRoutes(app) {
    // User statistics
    app.get('/api/stats', setAuthLevel(AuthConfig.authenticated), adaptController(StatsController, StatsController.getUserStats));
    // User activity timeline
    app.get('/api/stats/activity', setAuthLevel(AuthConfig.authenticated), adaptController(StatsController, StatsController.getUserActivity));
}
