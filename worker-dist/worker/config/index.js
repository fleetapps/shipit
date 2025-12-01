import { getConfigurableSecurityDefaults } from "./security";
import { createLogger } from "../logger";
const logger = createLogger('GlobalConfigurableSettings');
let cachedConfig = null;
// Per-invocation cache to avoid multiple KV calls within single worker invocation
const invocationUserCache = new Map();
/**
 * Type guard to check if a value should be recursively merged
 */
function isPlainObject(value) {
    return (value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.prototype.toString.call(value) === '[object Object]');
}
/**
 * Deep merge implementation with full type safety
 */
function deepMerge(target, source) {
    // Handle null/undefined source
    if (source === null || source === undefined) {
        return target;
    }
    // Handle non-object targets or sources
    if (!isPlainObject(target) || !isPlainObject(source)) {
        return (source !== undefined ? source : target);
    }
    // Safe type assertion after guard checks
    const targetObj = target;
    const sourceObj = source;
    const result = { ...targetObj };
    // Merge properties
    Object.entries(sourceObj).forEach(([key, sourceValue]) => {
        // Skip undefined - means "use default"
        if (sourceValue === undefined) {
            return;
        }
        const targetValue = targetObj[key];
        // Recursive merge for nested objects
        if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
        }
        else {
            // Direct assignment for primitives, arrays, null, or empty values
            result[key] = sourceValue;
        }
    });
    return result;
}
const CONFIG_KEY = 'platform_configs';
export async function getGlobalConfigurableSettings(env) {
    if (cachedConfig) {
        return cachedConfig;
    }
    // Get default configuration
    const defaultConfig = {
        security: getConfigurableSecurityDefaults(),
        globalMessaging: {
            globalUserMessage: "",
            changeLogs: ""
        }
    };
    try {
        // Check if KV namespace is available
        if (!env.VibecoderStore) {
            logger.info('KV namespace VibecoderStore not configured, using defaults');
            cachedConfig = defaultConfig;
            return defaultConfig;
        }
        // Try to fetch override config from KV
        const storedConfigJson = await env.VibecoderStore.get(CONFIG_KEY);
        if (!storedConfigJson) {
            // No stored config, use defaults
            return defaultConfig;
        }
        // Parse stored configuration
        const storedConfig = JSON.parse(storedConfigJson);
        // Deep merge configurations (stored config overrides defaults)
        const mergedConfig = deepMerge(defaultConfig, storedConfig);
        logger.info('Loaded configuration with overrides from KV', { storedConfig, mergedConfig });
        cachedConfig = mergedConfig;
        return mergedConfig;
    }
    catch (error) {
        logger.error('Failed to load configuration from KV, using defaults', error);
        // On error, fallback to default configuration
        return defaultConfig;
    }
}
export async function getUserConfigurableSettings(env, userId) {
    const globalConfig = await getGlobalConfigurableSettings(env);
    if (!userId) {
        return globalConfig;
    }
    if (invocationUserCache.has(userId)) {
        const conf = invocationUserCache.get(userId);
        logger.info(`Using cached configuration for user ${userId}`, conf);
        return conf;
    }
    try {
        // Check if KV namespace is available
        if (!env.VibecoderStore) {
            logger.info(`KV namespace VibecoderStore not configured for user ${userId}, using global defaults`);
            return globalConfig;
        }
        // Try to fetch override config from KV
        const storedConfigJson = await env.VibecoderStore.get(`user_config:${userId}`);
        if (!storedConfigJson) {
            // No stored config, use defaults
            return globalConfig;
        }
        // Parse stored configuration
        const storedConfig = JSON.parse(storedConfigJson);
        // Deep merge configurations (stored config overrides defaults)
        const mergedConfig = deepMerge(globalConfig, storedConfig);
        logger.info(`Loaded configuration with overrides from KV for user ${userId}`, { globalConfig, storedConfig, mergedConfig });
        invocationUserCache.set(userId, mergedConfig);
        return mergedConfig;
    }
    catch (error) {
        logger.error(`Failed to load configuration from KV for user ${userId}, using defaults`, error);
        // On error, fallback to default configuration
        return globalConfig;
    }
}
