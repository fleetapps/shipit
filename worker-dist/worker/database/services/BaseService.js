/**
 * Base Database Service Class
 * Provides common database functionality and patterns for all domain services
 */
import { createDatabaseService } from '../database';
import { and } from 'drizzle-orm';
import { createLogger } from '../../logger';
/**
 * Base class for all database domain services
 * Provides shared utilities and database access patterns
 */
export class BaseService {
    logger = createLogger(this.constructor.name);
    db;
    env;
    constructor(env) {
        this.db = createDatabaseService(env);
        this.env = env;
    }
    /**
     * Helper to build type-safe where conditions
     */
    buildWhereConditions(conditions) {
        const validConditions = conditions.filter((c) => c !== undefined);
        if (validConditions.length === 0)
            return undefined;
        if (validConditions.length === 1)
            return validConditions[0];
        // Use Drizzle's and() function to properly combine conditions
        return and(...validConditions);
    }
    /**
     * Standard error handling for database operations
     */
    handleDatabaseError(error, operation, context) {
        this.logger.error(`Database error in ${operation}`, { error, context });
        throw error;
    }
    /**
     * Get database connection for direct queries when needed
     */
    get database() {
        return this.db.db;
    }
    /**
     * Get read-optimized database connection using D1 read replicas
     * For read-only queries to reduce global latency
     *
     * @param strategy - 'fast' for lowest latency, 'fresh' for latest data
     */
    getReadDb(strategy = 'fast') {
        return this.db.getReadDb(strategy);
    }
}
