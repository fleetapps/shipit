/**
 * Core Database Service
 * Provides database connection, core utilities, and base operations∂ƒ
 */
import * as schema from './schema';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { HealthStatusResult } from './types';
export type { User, NewUser, Session, NewSession, App, NewApp, AppLike, NewAppLike, AppComment, NewAppComment, AppView, NewAppView, OAuthState, NewOAuthState, SystemSetting, NewSystemSetting, UserSecret, NewUserSecret, UserModelConfig, NewUserModelConfig, } from './schema';
/**
 * Core Database Service - Connection and Base Operations
 *
 * Provides database connection, shared utilities, and core operations.
 * Domain-specific operations are handled by dedicated service classes.
 */
export declare class DatabaseService {
    readonly db: DrizzleD1Database<typeof schema>;
    private readonly d1;
    private readonly enableReplicas;
    constructor(env: Env);
    /**
     * Get a read-optimized database connection using D1 Sessions API
     * This routes queries to read replicas for lower global latency
     *
     * @param strategy - Session strategy:
     *   - 'fast' (default): Routes to any replica for lowest latency
     *   - 'fresh': Routes first query to primary for latest data
     * @returns Drizzle database instance configured for read operations
     */
    getReadDb(strategy?: 'fast' | 'fresh'): DrizzleD1Database<typeof schema>;
    getHealthStatus(): Promise<HealthStatusResult>;
}
/**
 * Factory function to create database service instance
 */
export declare function createDatabaseService(env: Env): DatabaseService;
