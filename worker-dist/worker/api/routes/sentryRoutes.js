import { Hono } from 'hono';
import { SentryTunnelController } from '../controllers/sentry/tunnelController';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
export function setupSentryRoutes(app) {
    const sentryRouter = new Hono();
    // Sentry tunnel endpoint for frontend events (public - no auth required)
    sentryRouter.post('/tunnel', setAuthLevel(AuthConfig.public), adaptController(SentryTunnelController, SentryTunnelController.tunnel));
    // Mount the router under /api/sentry
    app.route('/api/sentry', sentryRouter);
}
