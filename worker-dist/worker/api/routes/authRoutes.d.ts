import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
/**
 * Setup authentication routes
 */
export declare function setupAuthRoutes(app: Hono<AppEnv>): void;
