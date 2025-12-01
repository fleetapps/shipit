/**
 * Routes for managing user model configurations
 */
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
/**
 * Setup model configuration routes
 * All routes are protected and require authentication
 */
export declare function setupModelConfigRoutes(app: Hono<AppEnv>): void;
