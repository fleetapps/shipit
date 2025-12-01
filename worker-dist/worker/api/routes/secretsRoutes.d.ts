/**
 * Secrets Routes
 * API routes for user secrets management
 */
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
/**
 * Setup secrets-related routes
 */
export declare function setupSecretsRoutes(app: Hono<AppEnv>): void;
