import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
/**
 * Setup app management routes
 */
export declare function setupAppRoutes(app: Hono<AppEnv>): void;
