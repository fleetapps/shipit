/**
 * Simple Structured Logger
 */
import * as Sentry from '@sentry/cloudflare';
export const DEFAULT_CONFIG = {
    level: 'info',
    prettyPrint: false,
};
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
// Credential scrubbing patterns removed by request
/**
 * Scrubbing disabled: pass-through
 */
function scrubCredentials(data) {
    return data;
}
export class StructuredLogger {
    component;
    objectContext;
    config;
    additionalFields = {};
    constructor(component, objectContext, config) {
        this.component = component;
        this.objectContext = objectContext ? { ...objectContext } : undefined;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Set the object ID dynamically
     */
    setObjectId(id) {
        if (!this.objectContext) {
            this.objectContext = { type: this.component, id };
        }
        else {
            this.objectContext.id = id;
        }
    }
    /**
     * Set additional fields that will be included in all log entries
     */
    setFields(fields) {
        this.additionalFields = { ...this.additionalFields, ...fields };
    }
    /**
     * Set a single field
     */
    setField(key, value) {
        this.additionalFields[key] = value;
    }
    /**
     * Clear all additional fields
     */
    clearFields() {
        this.additionalFields = {};
    }
    /**
     * Create a child logger with extended context
     */
    child(childContext, component) {
        const newComponent = component || this.component;
        const mergedContext = {
            type: childContext.type || 'ChildLogger',
            id: childContext.id || `child-${Date.now()}`,
            ...childContext,
        };
        const childLogger = new StructuredLogger(newComponent, mergedContext, this.config);
        childLogger.setFields(this.additionalFields);
        return childLogger;
    }
    /**
     * Check if message should be logged based on level
     */
    shouldLog(level) {
        const configLevel = LOG_LEVELS[this.config.level || 'info'];
        const messageLevel = LOG_LEVELS[level];
        return messageLevel >= configLevel;
    }
    /**
     * Core logging method - builds structured JSON and outputs via console
     */
    log(level, message, data, error) {
        if (!this.shouldLog(level))
            return;
        const logEntry = {
            level,
            time: new Date().toISOString(),
            component: this.component,
            msg: scrubCredentials(message),
        };
        // Add object context if available
        if (this.objectContext) {
            logEntry.object = { ...this.objectContext };
        }
        // Add additional fields with credential scrubbing
        if (Object.keys(this.additionalFields).length > 0) {
            const scrubbedAdditionalFields = scrubCredentials(this.additionalFields);
            Object.assign(logEntry, scrubbedAdditionalFields);
        }
        // Add structured data with credential scrubbing
        if (data) {
            try {
                const scrubbedData = scrubCredentials(data);
                if (scrubbedData && typeof scrubbedData === 'object' && !Array.isArray(scrubbedData)) {
                    Object.assign(logEntry, scrubbedData);
                }
            }
            catch {
                // If scrubbing fails, add a safe placeholder
                logEntry.data = '[DATA_SCRUB_FAILED]';
            }
        }
        // Add error details with credential scrubbing
        if (error instanceof Error) {
            logEntry.error = {
                name: error.name,
                message: scrubCredentials(error.message),
                stack: scrubCredentials(error.stack),
            };
        }
        // Output using appropriate method
        this.output(level, logEntry);
    }
    /**
     * Safe JSON stringify that handles circular references
     */
    safeStringify(obj) {
        const seen = new WeakSet();
        return JSON.stringify(obj, (_key, value) => {
            // Handle undefined, functions, symbols
            if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
                return undefined;
            }
            // Handle BigInt
            if (typeof value === 'bigint') {
                return value.toString();
            }
            // Handle circular references
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
                // Handle Error objects specially to preserve stack traces
                if (value instanceof Error) {
                    return {
                        name: value.name,
                        message: value.message,
                        stack: value.stack,
                        // Include any additional properties
                        ...Object.getOwnPropertyNames(value).reduce((acc, prop) => {
                            if (!['name', 'message', 'stack'].includes(prop)) {
                                const descriptor = Object.getOwnPropertyDescriptor(value, prop);
                                if (descriptor && descriptor.enumerable) {
                                    acc[prop] = value[prop];
                                }
                            }
                            return acc;
                        }, {})
                    };
                }
            }
            return value;
        });
    }
    /**
     * Output log entry using console methods
     */
    output(level, logEntry) {
        const consoleMethod = this.getConsoleMethod(level);
        if (this.config.prettyPrint) {
            // Pretty formatted output for development
            const objectInfo = logEntry.object
                ? `[${logEntry.object.type}${logEntry.object.id ? `#${logEntry.object.id}` : ''}]`
                : '';
            const prefix = `${logEntry.time} ${level.toUpperCase()} ${logEntry.component}${objectInfo}`;
            // Extract additional data excluding base fields
            const { level: _, time, component, msg, object, error, ...additionalData } = logEntry;
            const hasAdditionalData = Object.keys(additionalData).length > 0;
            if (hasAdditionalData || error) {
                const extraInfo = {};
                if (hasAdditionalData)
                    Object.assign(extraInfo, additionalData);
                if (error)
                    extraInfo.error = error;
                console[consoleMethod](`${prefix}: ${msg}`, extraInfo);
            }
            else {
                console[consoleMethod](`${prefix}: ${msg}`);
            }
        }
        else {
            // Structured JSON output for production (optimal for Cloudflare Workers Logs)
            try {
                const jsonStr = this.safeStringify(logEntry);
                console[consoleMethod](jsonStr);
            }
            catch (e) {
                // Fallback if even safe stringify fails
                console[consoleMethod](JSON.stringify({
                    level: logEntry.level,
                    time: logEntry.time,
                    component: logEntry.component,
                    msg: '[LOG_STRINGIFY_FAILED]',
                    stringifyError: e instanceof Error ? { name: e.name, message: e.message } : String(e),
                }));
            }
        }
    }
    /**
     * Get appropriate console method for log level
     */
    getConsoleMethod(level) {
        switch (level) {
            case 'debug':
                return 'debug';
            case 'info':
                return 'log';
            case 'warn':
                return 'warn';
            case 'error':
                return 'error';
            default:
                return 'log';
        }
    }
    /**
     * Process variable arguments into structured data
     */
    processArgs(args) {
        if (args.length === 0)
            return {};
        if (args.length === 1) {
            const arg = args[0];
            if (arg &&
                typeof arg === 'object' &&
                !Array.isArray(arg) &&
                !(arg instanceof Error)) {
                return arg;
            }
            return { data: arg };
        }
        // Multiple arguments
        const result = {};
        args.forEach((arg, index) => {
            if (arg &&
                typeof arg === 'object' &&
                !Array.isArray(arg) &&
                !(arg instanceof Error)) {
                Object.assign(result, arg);
            }
            else {
                result[`arg${index}`] = arg;
            }
        });
        return result;
    }
    /**
     * Process arguments with error handling
     */
    processArgsWithError(args) {
        let error;
        const otherArgs = [];
        const isErrorLike = (value) => {
            return (value !== null &&
                typeof value === 'object' &&
                ('message' in value || 'name' in value));
        };
        const toError = (value) => {
            const msg = typeof value.message === 'string' ? value.message : 'Unknown error';
            const err = new Error(msg);
            if (typeof value.name === 'string')
                err.name = value.name;
            if (typeof value.stack === 'string')
                err.stack = value.stack;
            return err;
        };
        args.forEach((arg) => {
            if (arg instanceof Error) {
                error = arg;
                return;
            }
            if (isErrorLike(arg)) {
                error = toError(arg);
                return;
            }
            otherArgs.push(arg);
        });
        return {
            data: this.processArgs(otherArgs),
            error,
        };
    }
    // Public logging methods
    debug(message, ...args) {
        this.log('debug', message, this.processArgs(args));
    }
    info(message, ...args) {
        this.log('info', message, this.processArgs(args));
    }
    warn(message, ...args) {
        this.log('warn', message, this.processArgs(args));
    }
    error(message, ...args) {
        const { data, error } = this.processArgsWithError(args);
        Sentry.captureException(error || new Error(message), { extra: data });
        this.log('error', message, data, error);
    }
    trace(message, ...args) {
        this.debug(message, ...args);
    }
    fatal(message, ...args) {
        this.error(message, ...args);
    }
}
/**
 * Create a basic structured logger
 */
export function createLogger(component, config) {
    return new StructuredLogger(component, undefined, config);
}
/**
 * Create logger with object context
 */
export function createObjectLogger(obj, component, config) {
    const componentName = component || getObjectType(obj) || 'UnknownComponent';
    // Create basic object context without complex probing
    const objectContext = {
        type: componentName,
    };
    // Try to get ID safely
    if (obj && typeof obj === 'object') {
        const objWithId = obj;
        if (objWithId.id &&
            (typeof objWithId.id === 'string' ||
                typeof objWithId.id === 'number')) {
            objectContext.id = String(objWithId.id);
        }
    }
    return new StructuredLogger(componentName, objectContext, config);
}
/**
 * Safely get object type
 */
function getObjectType(obj) {
    try {
        if (obj && typeof obj === 'object') {
            return obj.constructor?.name;
        }
        return typeof obj;
    }
    catch {
        return undefined;
    }
}
/**
 * Logger factory for global configuration
 */
export class LoggerFactory {
    static globalConfig = DEFAULT_CONFIG;
    static configure(config) {
        this.globalConfig = { ...this.globalConfig, ...config };
    }
    static getConfig() {
        return { ...this.globalConfig };
    }
    static create(component) {
        return new StructuredLogger(component, undefined, this.globalConfig);
    }
    static createForObject(obj, component) {
        return createObjectLogger(obj, component, this.globalConfig);
    }
}
