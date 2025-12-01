/**
 * Simple Structured Logging System
 */
export * from './types';
export * from './core';
import { createLogger, createObjectLogger, LoggerFactory } from './core';
/**
 * Main Logger utilities - simplified API
 */
export declare const Logger: {
    /**
     * Create a component logger
     */
    create: typeof createLogger;
    /**
     * Create an object logger
     */
    forObject: typeof createObjectLogger;
    /**
     * Configure global logging settings
     */
    configure: typeof LoggerFactory.configure;
    /**
     * Get current configuration
     */
    getConfig: typeof LoggerFactory.getConfig;
};
/**
 * Method decorator for automatic logging (simplified)
 */
export declare function LogMethod(component?: string): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Class decorator for automatic logger injection
 */
export declare function WithLogger(component?: string): <T extends new (...args: any[]) => {}>(constructor: T) => {
    new (...args: any[]): {
        logger: import("./core").StructuredLogger;
    };
} & T;
export default Logger;
