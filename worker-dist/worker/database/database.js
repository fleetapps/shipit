/**
 * Core Database Service
 * Provides database connection, core utilities, and base operations∂ƒ
 */
import { drizzle } from 'drizzle-orm/d1';
import * as Sentry from '@sentry/cloudflare';
import * as schema from './schema';
/**
 * Core Database Service - Connection and Base Operations
 *
 * Provides database connection, shared utilities, and core operations.
 * Domain-specific operations are handled by dedicated service classes.
 */
export class DatabaseService {
    db;
    d1;
    enableReplicas;
    constructor(env) {
        const instrumented = Sentry.instrumentD1WithSentry(env.DB);
        this.d1 = instrumented;
        this.db = drizzle(instrumented, { schema });
        this.enableReplicas = env.ENABLE_READ_REPLICAS === 'true';
    }
    /**
     * Get a read-optimized database connection using D1 Sessions API
     * This routes queries to read replicas for lower global latency
     *
     * @param strategy - Session strategy:
     *   - 'fast' (default): Routes to any replica for lowest latency
     *   - 'fresh': Routes first query to primary for latest data
     * @returns Drizzle database instance configured for read operations
     */
    getReadDb(strategy = 'fast') {
        // Return regular db if replicas are disabled
        if (!this.enableReplicas) {
            return this.db;
        }
        const sessionType = strategy === 'fresh' ? 'first-primary' : 'first-unconstrained';
        const session = this.d1.withSession(sessionType);
        // D1DatabaseSession is compatible with D1Database for Drizzle operations
        return drizzle(session, { schema });
    }
    // ========================================
    // UTILITY METHODS
    // ========================================
    async getHealthStatus() {
        try {
            await this.db.select().from(schema.systemSettings).limit(1);
            return {
                healthy: true,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                healthy: false,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
/**
 * Factory function to create database service instance
 */
export function createDatabaseService(env) {
    return new DatabaseService(env);
}
