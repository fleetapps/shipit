import { Hono } from 'hono';
import { StatusController } from '../controllers/status/controller';
import { adaptController } from '../honoAdapter';
import { AuthConfig, setAuthLevel } from '../../middleware/auth/routeAuth';
export function setupStatusRoutes(app) {
    const statusRouter = new Hono();
    statusRouter.get('/', setAuthLevel(AuthConfig.public), adaptController(StatusController, StatusController.getPlatformStatus));
    app.route('/api/status', statusRouter);
}
