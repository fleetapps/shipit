import { BaseController } from '../baseController';
import { RouteContext } from '../../types/route-context';
/**
 * Sentry Tunnel Controller
 * Proxies Sentry events from frontend to bypass ad blockers
 * Implements https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers
 */
export declare class SentryTunnelController extends BaseController {
    /**
     * Tunnel endpoint for Sentry events from the frontend.
     * POST /api/sentry/tunnel
     *
     * This endpoint:
     * 1. Receives Sentry envelopes from the frontend
     * 2. Validates they're for our configured DSN
     * 3. Forwards them to Sentry with proper auth headers
     */
    static tunnel(request: Request, env: Env, _ctx: ExecutionContext, _routeContext: RouteContext): Promise<Response>;
}
