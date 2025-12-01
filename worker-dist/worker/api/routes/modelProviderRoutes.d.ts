/**
 * Model Provider Routes
 * Routes for custom model provider management
 */
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
export declare function setupModelProviderRoutes(app: Hono<AppEnv>): void;
