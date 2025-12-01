import { AIModels } from "../../agents/inferutils/config.types";
export var RateLimitStore;
(function (RateLimitStore) {
    RateLimitStore["KV"] = "kv";
    RateLimitStore["RATE_LIMITER"] = "rate_limiter";
    RateLimitStore["DURABLE_OBJECT"] = "durable_object";
})(RateLimitStore || (RateLimitStore = {}));
export var RateLimitType;
(function (RateLimitType) {
    RateLimitType["API_RATE_LIMIT"] = "apiRateLimit";
    RateLimitType["AUTH_RATE_LIMIT"] = "authRateLimit";
    RateLimitType["APP_CREATION"] = "appCreation";
    RateLimitType["LLM_CALLS"] = "llmCalls";
})(RateLimitType || (RateLimitType = {}));
export const DEFAULT_RATE_LIMIT_SETTINGS = {
    apiRateLimit: {
        enabled: true,
        store: RateLimitStore.RATE_LIMITER,
        bindingName: 'API_RATE_LIMITER',
    },
    authRateLimit: {
        enabled: true,
        store: RateLimitStore.RATE_LIMITER,
        bindingName: 'AUTH_RATE_LIMITER',
    },
    appCreation: {
        enabled: true,
        store: RateLimitStore.DURABLE_OBJECT,
        limit: 10,
        dailyLimit: 10,
        period: 4 * 60 * 60, // 4 hour
    },
    llmCalls: {
        enabled: true,
        store: RateLimitStore.DURABLE_OBJECT,
        limit: 800,
        period: 60 * 60, // 1 hour
        dailyLimit: 2000,
        excludeBYOKUsers: true,
    },
};
// Simple, pro models -> 4, Flash -> 1, Flash Lite -> 0
export const DEFAULT_RATE_INCREMENTS_FOR_MODELS = {
    [AIModels.GEMINI_1_5_FLASH_8B]: 0,
    [AIModels.GEMINI_2_0_FLASH]: 0,
    [AIModels.GEMINI_2_5_FLASH_LITE]: 0,
    [AIModels.GEMINI_2_5_FLASH_LITE_LATEST]: 0,
    [AIModels.GEMINI_2_5_FLASH]: 1,
    [AIModels.GEMINI_2_5_FLASH_LATEST]: 1,
    [AIModels.GEMINI_2_5_FLASH_PREVIEW_04_17]: 1,
    [AIModels.GEMINI_2_5_FLASH_PREVIEW_05_20]: 1,
    [AIModels.GEMINI_2_5_PRO_LATEST]: 4,
    [AIModels.GEMINI_2_5_PRO]: 4,
    [AIModels.GEMINI_2_5_PRO_PREVIEW_05_06]: 4,
    [AIModels.GEMINI_2_5_PRO_PREVIEW_06_05]: 4,
};
