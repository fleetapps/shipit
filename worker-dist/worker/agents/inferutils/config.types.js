/**
 * Config Types - Pure type definitions only
 * Extracted from config.ts to avoid importing logic code into frontend
 */
// import { LLMCallsRateLimitConfig } from "../../services/rate-limit/config";
export var AIModels;
(function (AIModels) {
    AIModels["DISABLED"] = "disabled";
    AIModels["GEMINI_2_0_FLASH"] = "google-ai-studio/gemini-2.0-flash";
    AIModels["GEMINI_2_5_PRO"] = "google-ai-studio/gemini-2.5-pro";
    AIModels["GEMINI_2_5_FLASH"] = "google-ai-studio/gemini-2.5-flash";
    AIModels["GEMINI_2_5_FLASH_LITE"] = "google-ai-studio/gemini-2.5-flash-lite";
    AIModels["GEMINI_1_5_FLASH_8B"] = "google-ai-studio/gemini-1.5-flash-8b-latest";
    AIModels["GEMINI_2_5_FLASH_LATEST"] = "google-ai-studio/gemini-2.5-flash-latest";
    AIModels["GEMINI_2_5_FLASH_LITE_LATEST"] = "google-ai-studio/gemini-2.5-flash-lite-latest";
    AIModels["GEMINI_2_5_PRO_LATEST"] = "google-ai-studio/gemini-2.5-pro-latest";
    AIModels["GEMINI_2_5_PRO_PREVIEW_05_06"] = "google-ai-studio/gemini-2.5-pro-preview-05-06";
    AIModels["GEMINI_2_5_FLASH_PREVIEW_04_17"] = "google-ai-studio/gemini-2.5-flash-preview-04-17";
    AIModels["GEMINI_2_5_FLASH_PREVIEW_05_20"] = "google-ai-studio/gemini-2.5-flash-preview-05-20";
    AIModels["GEMINI_2_5_PRO_PREVIEW_06_05"] = "google-ai-studio/gemini-2.5-pro-preview-06-05";
    AIModels["CLAUDE_3_5_SONNET_LATEST"] = "anthropic/claude-3-5-sonnet-latest";
    AIModels["CLAUDE_3_7_SONNET_20250219"] = "anthropic/claude-3-7-sonnet-20250219";
    AIModels["CLAUDE_4_OPUS"] = "anthropic/claude-opus-4-20250514";
    AIModels["CLAUDE_4_SONNET"] = "anthropic/claude-sonnet-4-20250514";
    AIModels["OPENAI_O3"] = "openai/o3";
    AIModels["OPENAI_O4_MINI"] = "openai/o4-mini";
    AIModels["OPENAI_CHATGPT_4O_LATEST"] = "openai/chatgpt-4o-latest";
    AIModels["OPENAI_4_1"] = "openai/gpt-4.1-2025-04-14";
    AIModels["OPENAI_5"] = "openai/gpt-5";
    AIModels["OPENAI_5_MINI"] = "openai/gpt-5-mini";
    AIModels["OPENAI_OSS"] = "openai/gpt-oss-120b";
    // OPENROUTER_QWEN_3_CODER = '[openrouter]qwen/qwen3-coder',
    // OPENROUTER_KIMI_2_5 = '[openrouter]moonshotai/kimi-k2',
    // Cerebras models
    AIModels["CEREBRAS_GPT_OSS"] = "cerebras/gpt-oss-120b";
    AIModels["CEREBRAS_QWEN_3_CODER"] = "cerebras/qwen-3-coder-480b";
})(AIModels || (AIModels = {}));
