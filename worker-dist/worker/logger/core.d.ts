import type { LoggerConfig, ObjectContext } from './types';
export declare const DEFAULT_CONFIG: LoggerConfig;
export declare class StructuredLogger {
    private readonly component;
    private objectContext?;
    private readonly config;
    private additionalFields;
    constructor(component: string, objectContext?: ObjectContext, config?: LoggerConfig);
    /**
     * Set the object ID dynamically
     */
    setObjectId(id: string): void;
    /**
     * Set additional fields that will be included in all log entries
     */
    setFields(fields: Record<string, unknown>): void;
    /**
     * Set a single field
     */
    setField(key: string, value: unknown): void;
    /**
     * Clear all additional fields
     */
    clearFields(): void;
    /**
     * Create a child logger with extended context
     */
    child(childContext: Partial<ObjectContext>, component?: string): StructuredLogger;
    /**
     * Check if message should be logged based on level
     */
    private shouldLog;
    /**
     * Core logging method - builds structured JSON and outputs via console
     */
    private log;
    /**
     * Safe JSON stringify that handles circular references
     */
    private safeStringify;
    /**
     * Output log entry using console methods
     */
    private output;
    /**
     * Get appropriate console method for log level
     */
    private getConsoleMethod;
    /**
     * Process variable arguments into structured data
     */
    private processArgs;
    /**
     * Process arguments with error handling
     */
    private processArgsWithError;
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    trace(message: string, ...args: unknown[]): void;
    fatal(message: string, ...args: unknown[]): void;
}
/**
 * Create a basic structured logger
 */
export declare function createLogger(component: string, config?: LoggerConfig): StructuredLogger;
/**
 * Create logger with object context
 */
export declare function createObjectLogger(obj: unknown, component?: string, config?: LoggerConfig): StructuredLogger;
/**
 * Logger factory for global configuration
 */
export declare class LoggerFactory {
    private static globalConfig;
    static configure(config: Partial<LoggerConfig>): void;
    static getConfig(): LoggerConfig;
    static create(component: string): StructuredLogger;
    static createForObject(obj: unknown, component?: string): StructuredLogger;
}
