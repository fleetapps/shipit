import { StructuredLogger } from "../../logger";
/**
 * Utility for consistent error handling in operations
 */
export declare class OperationError {
    /**
     * Log error and re-throw with consistent format
     */
    static logAndThrow(logger: StructuredLogger, operation: string, error: unknown): never;
    /**
     * Log error and return default value instead of throwing
     */
    static logAndReturn<T>(logger: StructuredLogger, operation: string, error: unknown, defaultValue: T): T;
}
