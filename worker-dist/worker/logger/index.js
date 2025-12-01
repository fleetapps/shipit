/**
 * Simple Structured Logging System
 */
export * from './types';
export * from './core';
import { createLogger, createObjectLogger, LoggerFactory } from './core';
import { DEFAULT_CONFIG } from './core';
// Configure logger for Cloudflare Workers environment
LoggerFactory.configure(DEFAULT_CONFIG);
/**
 * Main Logger utilities - simplified API
 */
export const Logger = {
    /**
     * Create a component logger
     */
    create: createLogger,
    /**
     * Create an object logger
     */
    forObject: createObjectLogger,
    /**
     * Configure global logging settings
     */
    configure: LoggerFactory.configure.bind(LoggerFactory),
    /**
     * Get current configuration
     */
    getConfig: LoggerFactory.getConfig.bind(LoggerFactory),
};
/**
 * Method decorator for automatic logging (simplified)
 */
export function LogMethod(component) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const className = target?.constructor?.name ||
            'UnknownClass';
        const methodName = propertyKey;
        const loggerComponent = component || className;
        descriptor.value = function (...args) {
            const logger = createObjectLogger(this, loggerComponent);
            logger.debug(`Entering method: ${methodName}`, {
                argsCount: args.length,
            });
            try {
                const result = originalMethod.apply(this, args);
                if (result && typeof result === 'object' && 'then' in result) {
                    // Handle async methods
                    return result.then((res) => {
                        logger.debug(`Exiting method: ${methodName}`, {
                            success: true,
                        });
                        return res;
                    }, (error) => {
                        logger.error(`Method ${methodName} failed`, error);
                        throw error;
                    });
                }
                else {
                    logger.debug(`Exiting method: ${methodName}`, {
                        success: true,
                    });
                    return result;
                }
            }
            catch (error) {
                logger.error(`Method ${methodName} failed`, error);
                throw error;
            }
        };
        return descriptor;
    };
}
/**
 * Class decorator for automatic logger injection
 */
export function WithLogger(component) {
    return function (constructor) {
        return class extends constructor {
            logger = createObjectLogger(this, component || constructor.name);
            constructor(...args) {
                super(...args);
            }
        };
    };
}
// Export default logger instance for quick usage
export default Logger;
