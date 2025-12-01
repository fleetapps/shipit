import * as Sentry from '@sentry/cloudflare';
import type { Hono } from 'hono';
import type { AppEnv } from '../types/appenv';
export declare function sentryOptions(env: Env): Sentry.CloudflareOptions;
export declare function initHonoSentry(app: Hono<AppEnv>): void;
export type SecurityEventType = 'csrf_violation' | 'rate_limit_exceeded' | 'auth_violation' | 'oauth_state_mismatch' | 'jwt_invalid' | string;
export type SecuritySeverity = 'debug' | 'info' | 'warning' | 'error' | 'fatal';
export interface SecurityEventOptions {
    level?: SecuritySeverity;
    error?: unknown;
}
export declare function captureSecurityEvent(type: SecurityEventType, data?: Record<string, unknown>, options?: SecurityEventOptions): void;
export declare function captureException(error: Error): void;
