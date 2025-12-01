/**
 * Base Database Service Class
 * Provides common database functionality and patterns for all domain services
 */
import { DatabaseService } from '../database';
import { SQL } from 'drizzle-orm';
/**
 * Base class for all database domain services
 * Provides shared utilities and database access patterns
 */
export declare abstract class BaseService {
    protected logger: import("../../logger").StructuredLogger;
    protected db: DatabaseService;
    protected env: Env;
    constructor(env: Env);
    /**
     * Helper to build type-safe where conditions
     */
    protected buildWhereConditions(conditions: (SQL<unknown> | undefined)[]): SQL<unknown> | undefined;
    /**
     * Standard error handling for database operations
     */
    protected handleDatabaseError(error: unknown, operation: string, context?: Record<string, unknown>): never;
    /**
     * Get database connection for direct queries when needed
     */
    protected get database(): import("drizzle-orm/d1").DrizzleD1Database<typeof import("../schema")>;
    /**
     * Get read-optimized database connection using D1 read replicas
     * For read-only queries to reduce global latency
     *
     * @param strategy - 'fast' for lowest latency, 'fresh' for latest data
     */
    protected getReadDb(strategy?: 'fast' | 'fresh'): import("drizzle-orm/d1").DrizzleD1Database<typeof import("../schema")>;
}
