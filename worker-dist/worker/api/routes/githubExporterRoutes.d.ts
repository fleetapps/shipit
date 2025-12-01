/**
 * GitHub Exporter Routes
 * Handles GitHub repository export flows
 */
import { Hono } from 'hono';
import { AppEnv } from '../../types/appenv';
/**
 * Setup GitHub Exporter routes
 */
export declare function setupGitHubExporterRoutes(app: Hono<AppEnv>): void;
