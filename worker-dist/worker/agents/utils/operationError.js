/**
 * Utility for consistent error handling in operations
 */
export class OperationError {
    /**
     * Log error and re-throw with consistent format
     */
    static logAndThrow(logger, operation, error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error in ${operation}:`, error);
        throw new Error(`${operation} failed: ${errorMessage}`);
    }
    /**
     * Log error and return default value instead of throwing
     */
    static logAndReturn(logger, operation, error, defaultValue) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error in ${operation}:`, error);
        logger.warn(`Returning default value for ${operation} due to error: ${errorMessage}`);
        return defaultValue;
    }
}
