import { OpenAI } from 'openai';
import { Stream } from 'openai/streaming';
import { z } from 'zod';
import {
    type SchemaFormat,
    type FormatterOptions,
    generateTemplateForSchema,
    parseContentForSchema,
} from './schemaFormatters';
import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import {
    ChatCompletionMessageFunctionToolCall,
    type ReasoningEffort,
    type ChatCompletionChunk,
} from 'openai/resources.mjs';
import { CompletionSignal, Message, MessageContent, MessageRole } from './common';
import { ToolCallResult, ToolDefinition, toOpenAITool } from '../tools/types';
import { AgentActionKey, AI_MODEL_CONFIG, AIModelConfig, AIModels, InferenceMetadata, type InferenceRuntimeOverrides } from './config.types';
import { RateLimitService } from '../../services/rate-limit/rateLimits';
import { getUserConfigurableSettings } from '../../config';
import { SecurityError, RateLimitExceededError } from 'shared/types/errors';
import { RateLimitType } from 'worker/services/rate-limit/config';
import { getMaxToolCallingDepth, MAX_LLM_MESSAGES } from '../constants';
import { executeToolCallsWithDependencies } from './toolExecution';
import { CompletionDetector } from './completionDetection';

// Provider capability matrix - prevents misrouting providers to wrong inference paths
const PROVIDER_CAPABILITIES = {
  openai: { openAICompatible: true },
  grok: { openAICompatible: true },
  anthropic: { openAICompatible: false },
  'google-ai-studio': { openAICompatible: false, requiresNativeInference: true },
  deepseek: { openAICompatible: true },
} as const;

// Type guard using capability matrix
function requiresNativeInference(provider: string): boolean {
  const capabilities = PROVIDER_CAPABILITIES[provider as keyof typeof PROVIDER_CAPABILITIES];
  return capabilities !== undefined && 'requiresNativeInference' in capabilities && capabilities.requiresNativeInference === true;
}

function optimizeInputs(messages: Message[]): Message[] {
    return messages.map((message) => ({
        ...message,
        content: optimizeMessageContent(message.content),
    }));
}

// Streaming tool-call accumulation helpers 
type ToolCallsArray = NonNullable<NonNullable<ChatCompletionChunk['choices'][number]['delta']>['tool_calls']>;
type ToolCallDelta = ToolCallsArray[number];
type ToolAccumulatorEntry = ChatCompletionMessageFunctionToolCall & { index?: number; __order: number };

function synthIdForIndex(i: number): string {
    return `tool_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
}

function accumulateToolCallDelta(
    byIndex: Map<number, ToolAccumulatorEntry>,
    byId: Map<string, ToolAccumulatorEntry>,
    deltaToolCall: ToolCallDelta,
    orderCounterRef: { value: number }
): void {
    const idx = deltaToolCall.index;
    const idFromDelta = deltaToolCall.id;

    let entry: ToolAccumulatorEntry | undefined;

    // Look up existing entry by id or index
    if (idFromDelta && byId.has(idFromDelta)) {
        entry = byId.get(idFromDelta)!;
        console.log(`[TOOL_CALL_DEBUG] Found existing entry by id: ${idFromDelta}`);
    } else if (idx !== undefined && byIndex.has(idx)) {
        entry = byIndex.get(idx)!;
        console.log(`[TOOL_CALL_DEBUG] Found existing entry by index: ${idx}`);
    } else {
        console.log(`[TOOL_CALL_DEBUG] Creating new entry - id: ${idFromDelta}, index: ${idx}`);
        // Create new entry
        const provisionalId = idFromDelta || synthIdForIndex(idx ?? byId.size);
        entry = {
            id: provisionalId,
            type: 'function',
            function: {
                name: '',
                arguments: '',
            },
            __order: orderCounterRef.value++,
            ...(idx !== undefined ? { index: idx } : {}),
        };
        if (idx !== undefined) byIndex.set(idx, entry);
        byId.set(provisionalId, entry);
    }

    // Update id if provided and different
    if (idFromDelta && entry.id !== idFromDelta) {
        byId.delete(entry.id);
        entry.id = idFromDelta;
        byId.set(entry.id, entry);
    }

    // Register index if provided and not yet registered
    if (idx !== undefined && entry.index === undefined) {
        entry.index = idx;
        byIndex.set(idx, entry);
    }

    // Update function name - replace if provided
    if (deltaToolCall.function?.name) {
        entry.function.name = deltaToolCall.function.name;
    }

    // Append arguments - accumulate string chunks
    if (deltaToolCall.function?.arguments !== undefined) {
        const before = entry.function.arguments;
        const chunk = deltaToolCall.function.arguments;

        // Check if we already have complete JSON and this is extra data. Question: Do we want this?
        let isComplete = false;
        if (before.length > 0) {
            try {
                JSON.parse(before);
                isComplete = true;
                console.warn(`[TOOL_CALL_WARNING] Already have complete JSON, ignoring additional chunk for ${entry.function.name}:`, {
                    existing_json: before,
                    ignored_chunk: chunk
                });
            } catch {
                // Not complete yet, continue accumulating
            }
        }

        if (!isComplete) {
            entry.function.arguments += chunk;

            // Debug logging for tool call argument accumulation
            console.log(`[TOOL_CALL_DEBUG] Accumulating arguments for ${entry.function.name || 'unknown'}:`, {
                id: entry.id,
                index: entry.index,
                before_length: before.length,
                chunk_length: chunk.length,
                chunk_content: chunk,
                after_length: entry.function.arguments.length,
                after_content: entry.function.arguments
            });
        }
    }
}

function assembleToolCalls(
    byIndex: Map<number, ToolAccumulatorEntry>,
    byId: Map<string, ToolAccumulatorEntry>
): ChatCompletionMessageFunctionToolCall[] {
    if (byIndex.size > 0) {
        return Array.from(byIndex.values())
            .sort((a, b) => (a.index! - b.index!))
            .map((e) => ({ id: e.id, type: 'function' as const, function: { name: e.function.name, arguments: e.function.arguments } }));
    }
    return Array.from(byId.values())
        .sort((a, b) => a.__order - b.__order)
        .map((e) => ({ id: e.id, type: 'function' as const, function: { name: e.function.name, arguments: e.function.arguments } }));
}

function optimizeMessageContent(content: MessageContent): MessageContent {
    if (!content) return content;
    // If content is an array (TextContent | ImageContent), only optimize text content
    if (Array.isArray(content)) {
        return content.map((item) =>
            item.type === 'text'
                ? { ...item, text: optimizeTextContent(item.text) }
                : item,
        );
    }

    // If content is a string, optimize it directly
    return optimizeTextContent(content);
}

function optimizeTextContent(content: string): string {
    // CONSERVATIVE OPTIMIZATION - Only safe changes that preserve readability

    // 1. Remove trailing whitespace from lines (always safe)
    content = content.replace(/[ \t]+$/gm, '');

    // 2. Reduce excessive empty lines (more than 3 consecutive) to 2 max
    // This preserves intentional spacing while removing truly excessive gaps
    content = content.replace(/\n\s*\n\s*\n\s*\n+/g, '\n\n\n');

    // // Convert 4-space indentation to 2-space for non-Python/YAML content
    // content = content.replace(/^( {4})+/gm, (match) =>
    // 	'  '.repeat(match.length / 4),
    // );

    // // Convert 8-space indentation to 2-space
    // content = content.replace(/^( {8})+/gm, (match) =>
    // 	'  '.repeat(match.length / 8),
    // );
    // 4. Remove leading/trailing whitespace from the entire content
    // (but preserve internal structure)
    content = content.trim();

    return content;
}

function buildGatewayPathname(cleanPathname: string, providerOverride?: AIGatewayProviders): string {
    return providerOverride ? `${cleanPathname}/${providerOverride}` : `${cleanPathname}/compat`;
}

function constructGatewayUrl(url: URL, providerOverride?: AIGatewayProviders): string {
    const cleanPathname = url.pathname.replace(/\/$/, '');
    url.pathname = buildGatewayPathname(cleanPathname, providerOverride);
    return url.toString();
}

export async function buildGatewayUrl(
	env: Env,
	providerOverride?: AIGatewayProviders,
	gatewayOverride?: { baseUrl: string; token: string },
): Promise<string> {
    // Runtime override (SDK): explicit AI Gateway base URL
    if (gatewayOverride?.baseUrl) {
        const url = new URL(gatewayOverride.baseUrl);
        return constructGatewayUrl(url, providerOverride);
    }

    // If CLOUDFLARE_AI_GATEWAY_URL is set and is a valid URL, use it directly
    if (env.CLOUDFLARE_AI_GATEWAY_URL && 
        env.CLOUDFLARE_AI_GATEWAY_URL !== 'none' && 
        env.CLOUDFLARE_AI_GATEWAY_URL.trim() !== '') {
        
        try {
            const url = new URL(env.CLOUDFLARE_AI_GATEWAY_URL);
            // Validate it's actually an HTTP/HTTPS URL
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                // Add 'providerOverride' as a segment to the URL
                const cleanPathname = url.pathname.replace(/\/$/, ''); // Remove trailing slash
                url.pathname = buildGatewayPathname(cleanPathname, providerOverride);
                return url.toString();
            }
        } catch (error) {
            // Invalid URL, fall through to use bindings
            console.warn(`Invalid CLOUDFLARE_AI_GATEWAY_URL provided: ${env.CLOUDFLARE_AI_GATEWAY_URL}. Falling back to AI bindings.`);
        }
    }
    
    // Build the url via bindings
    const gateway = env.AI.gateway(env.CLOUDFLARE_AI_GATEWAY);
    const baseUrl = providerOverride ? await gateway.getUrl(providerOverride) : `${await gateway.getUrl()}compat`;
    return baseUrl;
}

function isValidApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim() === '') {
        return false;
    }
    // Check if value is not 'default' or 'none' and is more than 10 characters long
    if (apiKey.trim().toLowerCase() === 'default' || apiKey.trim().toLowerCase() === 'none' || apiKey.trim().length < 10) {
        return false;
    }
    return true;
}

async function getApiKey(
	provider: string,
	env: Env,
	_userId: string,
	runtimeOverrides?: InferenceRuntimeOverrides,
): Promise<string> {
    console.log("Getting API key for provider: ", provider);

    const runtimeKey = runtimeOverrides?.userApiKeys?.[provider];
    if (runtimeKey && isValidApiKey(runtimeKey)) {
        return runtimeKey;
    }
    // try {
    //     const userProviderKeys = await secretsService.getUserBYOKKeysMap(userId);
    //     // First check if user has a custom API key for this provider
    //     if (userProviderKeys && provider in userProviderKeys) {
    //         const userKey = userProviderKeys.get(provider);
    //         if (userKey && isValidApiKey(userKey)) {
    //             console.log("Found user API key for provider: ", provider, userKey);
    //             return userKey;
    //         }
    //     }
    // } catch (error) {
    //     console.error("Error getting API key for provider: ", provider, error);
    // }
    // Fallback to environment variables
    // Special case: grok provider uses GROQ_API_KEY (not GROK_API_KEY)
    // Special case: deepseek provider uses DEEPSEEK_API_KEY and NEVER falls back to gateway
    let envKey: keyof Env;
    if (provider === 'grok') {
        envKey = 'GROQ_API_KEY';
    } else if (provider === 'deepseek') {
        envKey = 'DEEPSEEK_API_KEY';
    } else {
        const providerKeyString = provider.toUpperCase().replaceAll('-', '_');
        envKey = `${providerKeyString}_API_KEY` as keyof Env;
    }
    let apiKey: string = env[envKey] as string;
    
    // Check if apiKey is empty or undefined and is valid
    // DeepSeek MUST use its own API key - never fall back to gateway token
    if (!isValidApiKey(apiKey)) {
        if (provider === 'deepseek') {
            throw new Error('DEEPSEEK_API_KEY is required and must be a valid DeepSeek API key. DeepSeek does not support Cloudflare AI Gateway tokens.');
        }
        apiKey = runtimeOverrides?.aiGatewayOverride?.token ?? env.CLOUDFLARE_AI_GATEWAY_TOKEN;
    }
    return apiKey;
}

export async function getConfigurationForModel(
    modelConfig: AIModelConfig,
    env: Env, 
    userId: string,
    runtimeOverrides?: InferenceRuntimeOverrides,
): Promise<{
    baseURL: string,
    apiKey: string,
    defaultHeaders?: Record<string, string>,
}> {
    let providerForcedOverride: AIGatewayProviders | undefined;
    if (modelConfig.directOverride) {
        switch(modelConfig.provider) {
            case 'openrouter':
                return {
                    baseURL: 'https://openrouter.ai/api/v1',
                    apiKey: env.OPENROUTER_API_KEY,
                };
            case 'anthropic':
                return {
                    baseURL: 'https://api.anthropic.com/v1/',
                    apiKey: env.ANTHROPIC_API_KEY,
                };
            case 'grok':
                return {
                    baseURL: 'https://api.x.ai/v1',
                    apiKey: env.GROQ_API_KEY,
                };
            case 'openai':
                return {
                    baseURL: 'https://api.openai.com/v1',
                    apiKey: env.OPENAI_API_KEY,
                };
            case 'deepseek':
                // DeepSeek MUST use its own API key - never gateway
                const deepseekKey = env.DEEPSEEK_API_KEY;
                if (!deepseekKey || !isValidApiKey(deepseekKey)) {
                    throw new Error('DEEPSEEK_API_KEY is required and must be a valid DeepSeek API key. DeepSeek does not support Cloudflare AI Gateway.');
                }
                return {
                    baseURL: 'https://api.deepseek.com/v1',
                    apiKey: deepseekKey,
                };
            default:
                providerForcedOverride = modelConfig.provider as AIGatewayProviders;
                break;
        }
    }

    const gatewayOverride = runtimeOverrides?.aiGatewayOverride;
    const baseURL = await buildGatewayUrl(env, providerForcedOverride, gatewayOverride);

    const gatewayToken = gatewayOverride?.token ?? env.CLOUDFLARE_AI_GATEWAY_TOKEN;

    // Try to find API key of type <PROVIDER>_API_KEY else default to gateway token
    const apiKey = await getApiKey(modelConfig.provider, env, userId, runtimeOverrides);

    // AI Gateway wholesaling: when using BYOK provider key + platform gateway token
    const defaultHeaders = gatewayToken && apiKey !== gatewayToken ? {
        'cf-aig-authorization': `Bearer ${gatewayToken}`,
    } : undefined;
    return {
        baseURL,
        apiKey,
        defaultHeaders
    };
}

type InferArgsBase = {
    env: Env;
    metadata: InferenceMetadata;
    actionKey: AgentActionKey  | 'testModelConfig';
    messages: Message[];
    maxTokens?: number;
    modelName: AIModels | string;
    reasoning_effort?: ReasoningEffort;
    temperature?: number;
    frequency_penalty?: number;
    stream?: {
        chunk_size: number;
        onChunk: (chunk: string) => void;
    };
    tools?: ToolDefinition<any, any>[];
    providerOverride?: 'cloudflare' | 'direct';
    runtimeOverrides?: InferenceRuntimeOverrides;
    abortSignal?: AbortSignal;
    onAssistantMessage?: (message: Message) => Promise<void>;
    completionConfig?: CompletionConfig;
};

type InferArgsStructured = InferArgsBase & {
    schema: z.AnyZodObject;
    schemaName: string;
};

type InferWithCustomFormatArgs = InferArgsStructured & {
    format?: SchemaFormat;
    formatOptions?: FormatterOptions;
};

export interface ToolCallContext {
    messages: Message[];
    depth: number;
    completionSignal?: CompletionSignal;
    warningInjected?: boolean;
}

/**
 * Configuration for completion signal detection and auto-warning injection.
 */
export interface CompletionConfig {
    detector?: CompletionDetector;
    operationalMode?: 'initial' | 'followup';
    allowWarningInjection?: boolean;
}

export function serializeCallChain(context: ToolCallContext, finalResponse: string): string {
    // Build a transcript of the tool call messages, and append the final response
    let transcript = '**Request terminated by user, partial response transcript (last 5 messages):**\n\n<call_chain_transcript>';
    for (const message of context.messages.slice(-5)) {
        let content = message.content;
        
        // Truncate tool messages to 100 chars
        if (message.role === 'tool' || message.role === 'function') {
            content = (content || '').slice(0, 100);
        }
        
        transcript += `<message role="${message.role}">${content}</message>`;
    }
    transcript += `<final_response>${finalResponse || '**cancelled**'}</final_response>`;
    transcript += '</call_chain_transcript>';
    return transcript;
}

export class InferError extends Error {
    constructor(
        message: string,
        public response: string,
        public toolCallContext?: ToolCallContext
    ) {
        super(message);
        this.name = 'InferError';
    }

    partialResponseTranscript(): string {
        if (!this.toolCallContext) {
            return this.response;
        }
        return serializeCallChain(this.toolCallContext, this.response);
    }

    partialResponse(): InferResponseString {
        return {
            string: this.response,
            toolCallContext: this.toolCallContext
        };
    }
}

export class AbortError extends InferError {
    constructor(response: string, toolCallContext?: ToolCallContext) {
        super(response, response, toolCallContext);
        this.name = 'AbortError';
    }
}

const claude_thinking_budget_tokens = {
    medium: 8000,
    high: 16000,
    low: 4000,
    minimal: 1000,
};

export type InferResponseObject<OutputSchema extends z.AnyZodObject> = {
    object: z.infer<OutputSchema>;
    toolCallContext?: ToolCallContext;
};

export type InferResponseString = {
    string: string;
    toolCallContext?: ToolCallContext;
};

/**
 * Execute all tool calls from OpenAI response
 */
async function executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[], originalDefinitions: ToolDefinition[]): Promise<ToolCallResult[]> {
    // Use dependency-aware execution engine
    return executeToolCallsWithDependencies(openAiToolCalls, originalDefinitions);
}

function updateToolCallContext(
    toolCallContext: ToolCallContext | undefined,
    assistantMessage: Message,
    executedToolCalls: ToolCallResult[],
    completionDetector?: CompletionDetector
) {
    const newMessages = [
        ...(toolCallContext?.messages || []),
        assistantMessage,
        ...executedToolCalls
            .filter(result => result.name && result.name.trim() !== '')
            .map((result, _) => ({
                role: "tool" as MessageRole,
                content: result.result ? JSON.stringify(result.result) : 'done',
                name: result.name,
                tool_call_id: result.id,
            })),
        ];

    const newDepth = (toolCallContext?.depth ?? 0) + 1;

    // Detect completion signal from executed tool calls
    let completionSignal = toolCallContext?.completionSignal;
    if (completionDetector && !completionSignal) {
        completionSignal = completionDetector.detectCompletion(executedToolCalls);
    }

    const newToolCallContext: ToolCallContext = {
        messages: newMessages,
        depth: newDepth,
        completionSignal,
        warningInjected: toolCallContext?.warningInjected || false
    };
    return newToolCallContext;
}

/**
 * Normalizes blueprint data structures that may be returned as objects
 * instead of arrays by LLMs. Converts object maps to arrays by extracting values.
 * 
 * This handles cases where models return:
 * - views: { "MainView": {...} } instead of [{ name: "...", description: "..." }]
 * - implementationRoadmap: { "Phase1": {...} } instead of [{ phase: "...", description: "..." }]
 * - initialPhase.files: { "File1": {...} } instead of [{ path: "...", purpose: "..." }]
 * - pitfalls: { "Pitfall1": "..." } instead of ["...", "..."]
 * - frameworks: { "Framework1": "..." } instead of ["...", "..."]
 * - colorPalette: { "Color1": "..." } instead of ["...", "..."]
 */
function normalizeBlueprintData(raw: any): any {
    if (!raw || typeof raw !== 'object') {
        return raw;
    }

    // Handle arrays - recursively normalize items
    if (Array.isArray(raw)) {
        return raw.map(item => normalizeBlueprintData(item));
    }

    const normalized = { ...raw };

    // Normalize views: object -> array, preserving key as 'name' if missing
    if (normalized.views && typeof normalized.views === 'object' && !Array.isArray(normalized.views)) {
        normalized.views = Object.entries(normalized.views).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Preserve key as 'name' if it's missing from the value
                return !('name' in value) ? { name: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
            }
            return normalizeBlueprintData(value);
        });
    } else if (Array.isArray(normalized.views)) {
        // Recursively normalize array items
        normalized.views = normalized.views.map((item: any) => normalizeBlueprintData(item));
    }

    // Normalize implementationRoadmap: object -> array, preserving key as 'phase' if missing
    if (normalized.implementationRoadmap && typeof normalized.implementationRoadmap === 'object' && !Array.isArray(normalized.implementationRoadmap)) {
        normalized.implementationRoadmap = Object.entries(normalized.implementationRoadmap).map(([key, value]) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Preserve key as 'phase' if it's missing from the value
                return !('phase' in value) ? { phase: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
            }
            return normalizeBlueprintData(value);
        });
    } else if (Array.isArray(normalized.implementationRoadmap)) {
        // Recursively normalize array items
        normalized.implementationRoadmap = normalized.implementationRoadmap.map((item: any) => normalizeBlueprintData(item));
    }

    // Normalize initialPhase: recursively normalize nested structure
    if (normalized.initialPhase && typeof normalized.initialPhase === 'object' && !Array.isArray(normalized.initialPhase)) {
        normalized.initialPhase = normalizeBlueprintData(normalized.initialPhase);
        // Ensure files is normalized
        if (normalized.initialPhase.files && typeof normalized.initialPhase.files === 'object' && !Array.isArray(normalized.initialPhase.files)) {
            normalized.initialPhase.files = Object.entries(normalized.initialPhase.files).map(([key, value]) => {
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Preserve key as 'path' if it's missing from the value
                    // The key might be "File1" or a filename, so use it as path if path is missing
                    return !('path' in value) ? { path: key, ...normalizeBlueprintData(value) } : normalizeBlueprintData(value);
                }
                return normalizeBlueprintData(value);
            });
        }
    }

    // Normalize pitfalls: object -> array (simple string array)
    if (normalized.pitfalls && typeof normalized.pitfalls === 'object' && !Array.isArray(normalized.pitfalls)) {
        normalized.pitfalls = Object.values(normalized.pitfalls).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.pitfalls)) {
        // Ensure all items are strings
        normalized.pitfalls = normalized.pitfalls.filter((v: any): v is string => typeof v === 'string');
    }

    // Normalize frameworks: object -> array (simple string array)
    if (normalized.frameworks && typeof normalized.frameworks === 'object' && !Array.isArray(normalized.frameworks)) {
        normalized.frameworks = Object.values(normalized.frameworks).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.frameworks)) {
        // Ensure all items are strings
        normalized.frameworks = normalized.frameworks.filter((v: any): v is string => typeof v === 'string');
    }

    // Normalize colorPalette: object -> array (simple string array)
    if (normalized.colorPalette && typeof normalized.colorPalette === 'object' && !Array.isArray(normalized.colorPalette)) {
        normalized.colorPalette = Object.values(normalized.colorPalette).filter((v): v is string => typeof v === 'string');
    } else if (Array.isArray(normalized.colorPalette)) {
        // Ensure all items are strings
        normalized.colorPalette = normalized.colorPalette.filter((v: any): v is string => typeof v === 'string');
    }

    return normalized;
}

export function infer<OutputSchema extends z.AnyZodObject>(
    args: InferArgsStructured,
    toolCallContext?: ToolCallContext,
): Promise<InferResponseObject<OutputSchema>>;

export function infer(args: InferArgsBase, toolCallContext?: ToolCallContext): Promise<InferResponseString>;

export function infer<OutputSchema extends z.AnyZodObject>(
    args: InferWithCustomFormatArgs,
    toolCallContext?: ToolCallContext,
): Promise<InferResponseObject<OutputSchema>>;

/**
 * Perform an inference using OpenAI's structured output with JSON schema
 * This uses the response_format.schema parameter to ensure the model returns
 * a response that matches the provided schema.
 */
export async function infer<OutputSchema extends z.AnyZodObject>({
    env,
    metadata,
    messages,
    schema,
    schemaName,
    actionKey,
    format,
    formatOptions,
    modelName,
    reasoning_effort,
    temperature,
    frequency_penalty,
    maxTokens,
    stream,
    tools,
    runtimeOverrides,
    abortSignal,
    onAssistantMessage,
    completionConfig,
}: InferArgsBase & {
    schema?: OutputSchema;
    schemaName?: string;
    format?: SchemaFormat;
    formatOptions?: FormatterOptions;
}, toolCallContext?: ToolCallContext): Promise<InferResponseObject<OutputSchema> | InferResponseString> {
    if (messages.length > MAX_LLM_MESSAGES) {
        throw new RateLimitExceededError(`Message limit exceeded: ${messages.length} messages (max: ${MAX_LLM_MESSAGES}). Please use context compactification.`, RateLimitType.LLM_CALLS);
    }
    
    // Check tool calling depth to prevent infinite recursion
    const currentDepth = toolCallContext?.depth ?? 0;
    if (currentDepth >= getMaxToolCallingDepth(actionKey)) {
        console.warn(`Tool calling depth limit reached (${currentDepth}/${getMaxToolCallingDepth(actionKey)}). Stopping recursion.`);
        // Return a response indicating max depth reached
        if (schema) {
            throw new AbortError(`Maximum tool calling depth (${getMaxToolCallingDepth(actionKey)}) exceeded. Tools may be calling each other recursively.`, toolCallContext);
        }
        return { 
            string: `[System: Maximum tool calling depth reached.]`,
            toolCallContext 
        };
    }
    
    // Get model config to check provider (early check for routing)
    const modelConfig = AI_MODEL_CONFIG[modelName as AIModels];
    if (!modelConfig) {
        throw new Error(`Unknown model: ${modelName}`);
    }

    // Route Gemini to native inference path (using capability matrix)
    if (requiresNativeInference(modelConfig.provider)) {
        return inferGeminiNative({
            env,
            metadata,
            messages,
            schema,
            schemaName,
            format,
            formatOptions,
            actionKey,
            modelName,
            reasoning_effort,
            temperature,
            frequency_penalty,
            maxTokens,
            stream,
            tools,
            runtimeOverrides,
            abortSignal,
            onAssistantMessage,
            completionConfig,
        }, toolCallContext);
    }
    
    try {
        const userConfig = await getUserConfigurableSettings(env, metadata.userId)
        // Maybe in the future can expand using config object for other stuff like global model configs?
        await RateLimitService.enforceLLMCallsRateLimit(env, userConfig.security.rateLimit, metadata.userId, modelName)

        const { apiKey, baseURL, defaultHeaders } = await getConfigurationForModel(
            modelConfig,
            env,
            metadata.userId,
            runtimeOverrides,
        );
        console.log(`baseUrl: ${baseURL}, modelName: ${modelName}`);

        // Remove [*.] from model name
        modelName = modelName.replace(/\[.*?\]/, '');
        
        // Fix DeepSeek model names - DeepSeek API expects exact model IDs without provider prefix
        if (modelConfig.provider === 'deepseek') {
            // DeepSeek expects 'deepseek-chat' or 'deepseek-reasoner', not 'deepseek/deepseek-chat'
            if (modelName.startsWith('deepseek/')) {
                modelName = modelName.replace('deepseek/', '');
            }
        }
        
        // Fix Grok model names - x.ai API uses different format
        // Map our internal model names to actual Grok API model names
        if (modelConfig.provider === 'grok') {
            // x.ai API uses 'grok-2-1212' or 'grok-2' as model names
            // Our config uses 'grok-2-1212' already, but if it has 'grok/' prefix, remove it
            if (modelName.startsWith('grok/')) {
                modelName = modelName.replace('grok/', '');
            }
            // If model name doesn't match known Grok models, use grok-2-1212 as fallback
            if (!modelName.match(/^grok-2/)) {
                modelName = 'grok-2-1212';
            }
        }

        const client = new OpenAI({ apiKey, baseURL: baseURL, defaultHeaders });
        
        // For Claude models with structured output, we can't use response_format with extra_body
        // Cloudflare AI Gateway rejects this combination with "output_config: Extra inputs are not permitted"
        // Solution: Use format-based approach (prompt instructions) instead of response_format for Claude
        // DeepSeek uses json_object mode (not json_schema) but still needs prompt instructions
        const isClaudeModel = modelName.includes('claude');
        const isDeepSeekModel = modelConfig.provider === 'deepseek';
        const needsStructuredOutput = schema && schemaName && !format;
        const shouldUseFormatForClaude = isClaudeModel && needsStructuredOutput;
        const shouldUseJsonObjectForDeepSeek = isDeepSeekModel && needsStructuredOutput;
        
        const schemaObj =
            schema && schemaName && !format && !shouldUseFormatForClaude && !shouldUseJsonObjectForDeepSeek
                ? { response_format: zodResponseFormat(schema, schemaName) } // OpenAI json_schema
                : shouldUseJsonObjectForDeepSeek
                ? { response_format: { type: "json_object" as const } } // DeepSeek json_object
                : {};
        
        // If Claude needs structured output, force format to 'markdown' to avoid response_format conflict
        // DeepSeek needs both json_object mode AND prompt instructions (markdown format)
        // 'markdown' format adds instructions to the prompt instead of using response_format
        const forcedFormat = shouldUseFormatForClaude 
            ? 'markdown' 
            : shouldUseJsonObjectForDeepSeek 
            ? 'markdown' // Use markdown format to add prompt instructions
            : format;
        
        const extraBody = isClaudeModel ? {
                    extra_body: {
                        thinking: {
                            type: 'enabled',
                            budget_tokens: claude_thinking_budget_tokens[reasoning_effort ?? 'medium'],
                        },
                    },
                }
            : {};

        // Optimize messages to reduce token count
        const optimizedMessages = optimizeInputs(messages);
        console.log(`Token optimization: Original messages size ~${JSON.stringify(messages).length} chars, optimized size ~${JSON.stringify(optimizedMessages).length} chars`);

        let messagesToPass = [...optimizedMessages];
        if (toolCallContext && toolCallContext.messages) {
            const ctxMessages = toolCallContext.messages;
            let validToolCallIds = new Set<string>();

            let filtered = ctxMessages.filter(msg => {
                // Update valid IDs when we see assistant with tool_calls
                if (msg.role === 'assistant' && msg.tool_calls) {
                    validToolCallIds = new Set(msg.tool_calls.map(tc => tc.id));
                    return true;
                }

                // Filter tool messages
                if (msg.role === 'tool') {
                    if (!msg.name?.trim()) {
                        console.warn('[TOOL_ORPHAN] Dropping tool message with empty name:', msg.tool_call_id);
                        return false;
                    }
                    if (!msg.tool_call_id || !validToolCallIds.has(msg.tool_call_id)) {
                        console.warn('[TOOL_ORPHAN] Dropping orphaned tool message:', msg.name, msg.tool_call_id);
                        return false;
                    }
                }

                return true;
            });

            // Remove empty tool call arrays from assistant messages
            filtered = filtered.map(msg => {
                if (msg.role === 'assistant' && msg.tool_calls) {
                    msg.tool_calls = msg.tool_calls.filter(tc => tc.id);
                    if (msg.tool_calls.length === 0) {
                        msg.tool_calls = undefined;
                    }
                }
                return msg;
            });

            messagesToPass.push(...filtered);
        }

        if (forcedFormat) {
            if (!schema || !schemaName) {
                throw new Error('Schema and schemaName are required when using a custom format');
            }
            const formatInstructions = generateTemplateForSchema(
                schema,
                forcedFormat,
                formatOptions,
            );
            const lastMessage = messagesToPass[messagesToPass.length - 1];

            // Handle multi-modal content properly
            if (typeof lastMessage.content === 'string') {
                // Simple string content - append format instructions
                messagesToPass = [
                    ...messagesToPass.slice(0, -1),
                    {
                        role: lastMessage.role,
                        content: `${lastMessage.content}\n\n${formatInstructions}`,
                    },
                ];
            } else if (Array.isArray(lastMessage.content)) {
                // Multi-modal content - append format instructions to the text part
                const updatedContent = lastMessage.content.map((item) => {
                    if (item.type === 'text') {
                        return {
                            ...item,
                            text: `${item.text}\n\n${formatInstructions}`,
                        };
                    }
                    return item;
                });
                messagesToPass = [
                    ...messagesToPass.slice(0, -1),
                    {
                        role: lastMessage.role,
                        content: updatedContent,
                    },
                ];
            }
        }

        const formatType = shouldUseJsonObjectForDeepSeek 
            ? 'json_object (DeepSeek)' 
            : schemaObj.response_format 
            ? 'response_format' 
            : 'none';
        console.log(`Running inference with ${modelName} using structured output with ${forcedFormat || formatType} format, reasoning effort: ${reasoning_effort}, max tokens: ${maxTokens}, temperature: ${temperature}, frequency_penalty: ${frequency_penalty}, baseURL: ${baseURL}`);

        const toolsOpts = tools ? {
            tools: tools.map(t => {
                return toOpenAITool(t);
            }),
            tool_choice: 'auto' as const
        } : {};
        let response: OpenAI.ChatCompletion | OpenAI.ChatCompletionChunk | Stream<OpenAI.ChatCompletionChunk>;
        try {
            // Call OpenAI API with proper structured output format
            response = await client.chat.completions.create({
                ...schemaObj,
                ...extraBody,
                ...toolsOpts,
                model: modelName,
                messages: messagesToPass as OpenAI.ChatCompletionMessageParam[],
                max_completion_tokens: maxTokens || 150000,
                stream: stream ? true : false,
                reasoning_effort: modelConfig.nonReasoning ? undefined : reasoning_effort,
                temperature,
                frequency_penalty,
            }, {
                signal: abortSignal,
                headers: {
                    "cf-aig-metadata": JSON.stringify({
                        chatId: metadata.agentId,
                        userId: metadata.userId,
                        schemaName,
                        actionKey,
                    })
                }
            });
            console.log(`Inference response received`);
        } catch (error) {
            // Check if error is due to abort
            if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('abort'))) {
                console.log('Inference cancelled by user');
                throw new AbortError('**User cancelled inference**', toolCallContext);
            }
            
            // Handle rate limit errors from OpenAI/Anthropic/OpenRouter providers
            // OpenAI SDK throws APIError with status property, Anthropic also uses 429
            if (error && typeof error === 'object') {
                const errorStatus = (error as any).status || (error as any).response?.status || (error as any).statusCode;
                
                if (errorStatus === 429) {
                    // Try to extract retry-after from multiple possible locations
                    // OpenAI SDK: error.headers or error.response?.headers
                    // Anthropic: response headers
                    // OpenRouter: similar structure
                    const headers = (error as any).headers || (error as any).response?.headers || {};
                    const retryAfterHeader = headers['retry-after'] || headers['Retry-After'] || 
                                           (error as any).retryAfter || (error as any).retry_after;
                    
                    let retryDelayMs = 60000; // Default 60s for OpenAI/Anthropic/OpenRouter
                    
                    if (retryAfterHeader) {
                        // Handle both string (seconds) and number formats
                        const retryAfterSeconds = typeof retryAfterHeader === 'string' 
                            ? parseFloat(retryAfterHeader) 
                            : retryAfterHeader;
                        
                        if (!isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
                            retryDelayMs = Math.ceil(retryAfterSeconds * 1000);
                        }
                    }
                    
                    throw new RateLimitExceededError(
                        `API rate limit exceeded. Retry after ${retryDelayMs / 1000}s`,
                        RateLimitType.LLM_CALLS,
                        undefined,
                        retryDelayMs
                    );
                }
            }
            
            console.error(`Failed to get inference response from AI Gateway: ${error}`);
            throw error;
        }
        let toolCalls: ChatCompletionMessageFunctionToolCall[] = [];

        /*
        * Handle LLM response
        */

        let content = '';
        if (stream) {
            // If streaming is enabled, handle the stream response
            if (response instanceof Stream) {
                let streamIndex = 0;
                // Accumulators for tool calls: by index (preferred) and by id (fallback when index is missing)
                const byIndex = new Map<number, ToolAccumulatorEntry>();
                const byId = new Map<string, ToolAccumulatorEntry>();
                const orderCounterRef = { value: 0 };
                
                for await (const event of response) {
                    const delta = (event as ChatCompletionChunk).choices[0]?.delta;
                    
                    // Provider-specific logging
                    const provider = modelName.split('/')[0];
                    if (delta?.tool_calls && (provider === 'google-ai-studio' || provider === 'gemini')) {
                        console.log(`[PROVIDER_DEBUG] ${provider} tool_calls delta:`, JSON.stringify(delta.tool_calls, null, 2));
                    }
                    
                    if (delta?.tool_calls) {
                        try {
                            for (const deltaToolCall of delta.tool_calls as ToolCallsArray) {
                                accumulateToolCallDelta(byIndex, byId, deltaToolCall, orderCounterRef);
                            }
                        } catch (error) {
                            console.error('Error processing tool calls in streaming:', error);
                        }
                    }
                    
                    // Process content
                    content += delta?.content || '';
                    const slice = content.slice(streamIndex);
                    const finishReason = (event as ChatCompletionChunk).choices[0]?.finish_reason;
                    if (slice.length >= stream.chunk_size || finishReason != null) {
                        stream.onChunk(slice);
                        streamIndex += slice.length;
                    }
                }
                
                // Assemble toolCalls with preference for index ordering, else first-seen order
                const assembled = assembleToolCalls(byIndex, byId);
                const dropped = assembled.filter(tc => !tc.function.name || tc.function.name.trim() === '');
                if (dropped.length) {
                    console.warn(`[TOOL_CALL_WARNING] Dropping ${dropped.length} streamed tool_call(s) without function name`, dropped);
                }
                toolCalls = assembled.filter(tc => tc.function.name && tc.function.name.trim() !== '');
                
                // Validate accumulated tool calls (do not mutate arguments)
                for (const toolCall of toolCalls) {
                    if (!toolCall.function.name) {
                        console.warn('Tool call missing function name:', toolCall);
                    }
                    if (toolCall.function.arguments) {
                        try {
                            // Validate JSON arguments early for visibility
                            const parsed = JSON.parse(toolCall.function.arguments);
                            console.log(`[TOOL_CALL_VALIDATION] Successfully parsed arguments for ${toolCall.function.name}:`, parsed);
                        } catch (error) {
                            console.error(`[TOOL_CALL_VALIDATION] Invalid JSON in tool call arguments for ${toolCall.function.name}:`, {
                                error: error instanceof Error ? error.message : String(error),
                                arguments_length: toolCall.function.arguments.length,
                                arguments_content: toolCall.function.arguments,
                                arguments_hex: Buffer.from(toolCall.function.arguments).toString('hex')
                            });
                        }
                    }
                }
                // Do not drop tool calls without id; we used a synthetic id and will update if a real id arrives in later deltas
            } else {
                // Handle the case where stream was requested but a non-stream response was received
                console.error('Expected a stream response but received a ChatCompletion object.');
                // Properly extract both content and tool calls from non-stream response
                const completion = response as OpenAI.ChatCompletion;
                const message = completion.choices[0]?.message;
                if (message) {
                    content = message.content || '';
                    toolCalls = (message.tool_calls as ChatCompletionMessageFunctionToolCall[]) || [];
                }
            }
        } else {
            // If not streaming, get the full response content (response is ChatCompletion)
            content = (response as OpenAI.ChatCompletion).choices[0]?.message?.content || '';
            const allToolCalls = ((response as OpenAI.ChatCompletion).choices[0]?.message?.tool_calls as ChatCompletionMessageFunctionToolCall[] || []);
            const droppedNonStream = allToolCalls.filter(tc => !tc.function.name || tc.function.name.trim() === '');
            if (droppedNonStream.length) {
                console.warn(`[TOOL_CALL_WARNING] Dropping ${droppedNonStream.length} non-stream tool_call(s) without function name`, droppedNonStream);
            }
            toolCalls = allToolCalls.filter(tc => tc.function.name && tc.function.name.trim() !== '');
            // Also print the total number of tokens used in the prompt
            const totalTokens = (response as OpenAI.ChatCompletion).usage?.total_tokens;
            console.log(`Total tokens used in prompt: ${totalTokens}`);
        }

        const assistantMessage = { role: "assistant" as MessageRole, content, tool_calls: toolCalls };

        if (onAssistantMessage) {
            await onAssistantMessage(assistantMessage);
        }

        /*
        * Handle tool calls
        */

        if (!content && !stream && !toolCalls.length) {
            // // Only error if not streaming and no content
            // console.error('No content received from OpenAI', JSON.stringify(response, null, 2));
            // throw new Error('No content received from OpenAI');
            console.warn('No content received from OpenAI', JSON.stringify(response, null, 2));
            return { string: "", toolCallContext };
        }
        let executedToolCalls: ToolCallResult[] = [];
        if (tools) {
            // console.log(`Tool calls:`, JSON.stringify(toolCalls, null, 2), 'definition:', JSON.stringify(tools, null, 2));
            try {
                executedToolCalls = await executeToolCalls(toolCalls, tools);
            } catch (error) {
                console.error(`Tool execution failed${toolCalls.length > 0 ? ` for ${toolCalls[0].function.name}` : ''}:`, error);
                // Check if error is an abort error
                if (error instanceof AbortError) {
                    console.warn(`Tool call was aborted, ending tool call chain with the latest tool call result`);

                    const newToolCallContext = updateToolCallContext(toolCallContext, assistantMessage, executedToolCalls, completionConfig?.detector);
                    return { string: content, toolCallContext: newToolCallContext };
                }
                // Otherwise, continue
            }
        }

        /*
        * Handle tool call results
        */

        if (executedToolCalls.length) {
            console.log(`Tool calls executed:`, JSON.stringify(executedToolCalls, null, 2));

            const newToolCallContext = updateToolCallContext(toolCallContext, assistantMessage, executedToolCalls, completionConfig?.detector);

            // Stop recursion if completion signal detected
            if (newToolCallContext.completionSignal?.signaled) {
                console.log(`[COMPLETION] ${newToolCallContext.completionSignal.toolName} called, stopping recursion`);

                if (schema && schemaName) {
                    throw new AbortError(
                        `Completion signaled: ${newToolCallContext.completionSignal.summary || 'Task complete'}`,
                        newToolCallContext
                    );
                }
                return {
                    string: content || newToolCallContext.completionSignal.summary || 'Task complete',
                    toolCallContext: newToolCallContext
                };
            }

            // Filter completion tools from recursion trigger
            const executedCallsWithResults = executedToolCalls.filter(result =>
                result.result !== undefined &&
                !(completionConfig?.detector?.isCompletionTool(result.name))
            );
            console.log(`${actionKey}: Tool depth ${newToolCallContext.depth}/${getMaxToolCallingDepth(actionKey)}`);
            
            if (executedCallsWithResults.length) {
                if (schema && schemaName) {
                    const output = await infer<OutputSchema>({
                        env,
                        metadata,
                        messages,
                        schema,
                        schemaName,
                        format,
                        formatOptions,
                        actionKey,
                        modelName,
                        maxTokens,
                        stream,
                        tools,
                        reasoning_effort,
                        temperature,
                        frequency_penalty,
                        abortSignal,
                        onAssistantMessage,
                        completionConfig,
                    }, newToolCallContext);
                    return output;
                } else {
                    const output = await infer({
                        env,
                        metadata,
                        messages,
                        modelName,
                        maxTokens,
                        actionKey,
                        stream,
                        tools,
                        reasoning_effort,
                        temperature,
                        frequency_penalty,
                        abortSignal,
                        onAssistantMessage,
                        completionConfig,
                    }, newToolCallContext);
                    return output;
                }
            } else {
                console.log('No tool calls with results');
                return { string: content, toolCallContext: newToolCallContext };
            }
        }

        if (!schema) {
            return { string: content, toolCallContext };
        }

        try {
            // Parse the response
            const parsedContent = format
                ? parseContentForSchema(content, format, schema, formatOptions)
                : JSON.parse(content);

            // Normalize blueprint data structures before validation
            // This handles cases where models return objects instead of arrays
            const normalizedContent = normalizeBlueprintData(parsedContent);

            // Use Zod's safeParse for proper error handling
            const result = schema.safeParse(normalizedContent);

            if (!result.success) {
                console.log('Raw content:', content);
                console.log('Parsed data:', parsedContent);
                console.log('Normalized data:', normalizedContent);
                console.error('Schema validation errors:', result.error.format());
                throw new Error(`Failed to validate AI response against schema: ${result.error.message}`);
            }

            return { object: result.data, toolCallContext };
        } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new InferError('Failed to parse response', content, toolCallContext);
        }
    } catch (error) {
        if (error instanceof RateLimitExceededError || error instanceof SecurityError) {
            throw error;
        }
        console.error('Error in inferWithSchemaOutput:', error);
        throw error;
    }
}

/**
 * Native Gemini inference using direct API calls.
 * Uses prompt-enforced JSON (no response_format) and tool intent protocol.
 */
async function inferGeminiNative<OutputSchema extends z.AnyZodObject>(
  args: InferArgsBase & {
    schema?: OutputSchema;
    schemaName?: string;
    format?: SchemaFormat;
    formatOptions?: FormatterOptions;
  },
  toolCallContext?: ToolCallContext
): Promise<InferResponseObject<OutputSchema> | InferResponseString> {
  const {
    env,
    messages,
    schema,
    schemaName,
    format,
    formatOptions,
    modelName,
    temperature,
    maxTokens,
    tools,
    abortSignal,
    actionKey,
    completionConfig,
  } = args;

  // Check tool calling depth (same as main infer function)
  const currentDepth = toolCallContext?.depth ?? 0;
  if (currentDepth >= getMaxToolCallingDepth(actionKey)) {
    console.warn(`Tool calling depth limit reached (${currentDepth}/${getMaxToolCallingDepth(actionKey)}). Stopping recursion.`);
    if (schema) {
      throw new AbortError(`Maximum tool calling depth (${getMaxToolCallingDepth(actionKey)}) exceeded.`, toolCallContext);
    }
    return { 
      string: `[System: Maximum tool calling depth reached.]`,
      toolCallContext 
    };
  }

  const apiKey = env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
  }

  // Extract model name (remove provider prefix if present)
  let geminiModelName = modelName.replace(/^google-ai-studio\//, '').replace(/^gemini\//, '');
  
  // Build prompt with enforced JSON format instructions
  const formatInstructions =
    schema && schemaName
      ? generateTemplateForSchema(schema, format ?? 'markdown', formatOptions)
      : '';

  // Convert messages to text format (simplified - no need for structured Gemini format since we use single prompt)
  const conversationText = messages.map(msg => {
    // Handle content (string or array)
    const content = typeof msg.content === 'string' 
      ? msg.content 
      : Array.isArray(msg.content)
        ? msg.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n')
        : JSON.stringify(msg.content);
    
    if (msg.role === 'tool') {
      return `TOOL (${msg.name}): ${content}`;
    }
    return `${msg.role.toUpperCase()}: ${content}`;
  }).join('\n');

  // Add system prompt with JSON enforcement
  const systemPrompt = `You are an autonomous agent.
You MUST output valid JSON only.
${formatInstructions}
${tools ? 'When you need to use a tool, output JSON with this structure: {"thought": "...", "action": {"tool": "tool_name", "args": {...}}}. Otherwise, output your final response in the "final" field.' : ''}`;

  const prompt = `${systemPrompt}\n\nConversation:\n${conversationText}`;

  // Call Gemini native API
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:generateContent`,
    {
      method: 'POST',
      signal: abortSignal,
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: temperature ?? 0.2,
          maxOutputTokens: maxTokens ?? 8192,
        },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    
    // Handle 429 rate limit errors with retry delay parsing
    if (res.status === 429) {
      try {
        const errorJson = JSON.parse(errorText);
        
        // First, check for retry-after header (some Gemini endpoints may include it)
        const retryAfterHeader = res.headers.get('retry-after') || res.headers.get('Retry-After');
        let retryDelaySeconds = 34; // Default fallback
        
        if (retryAfterHeader) {
          const parsed = parseFloat(retryAfterHeader);
          if (!isNaN(parsed) && parsed > 0) {
            retryDelaySeconds = parsed;
          }
        } else {
          // Extract retry delay from RetryInfo detail in error JSON
          const retryInfo = errorJson?.error?.details?.find(
            (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
          );
          
          if (retryInfo?.retryDelay) {
            // Handle both number and string formats (e.g., "34.179532308s" or 34.179532308)
            const delayValue = retryInfo.retryDelay.seconds || retryInfo.retryDelay;
            if (typeof delayValue === 'string') {
              // Remove 's' suffix if present and parse
              retryDelaySeconds = parseFloat(delayValue.replace(/s$/, ''));
            } else {
              retryDelaySeconds = parseFloat(delayValue);
            }
            
            // Validate parsed value
            if (isNaN(retryDelaySeconds) || retryDelaySeconds <= 0) {
              retryDelaySeconds = 34; // Fallback to default
            }
          }
        }
        
        throw new RateLimitExceededError(
          `Gemini API rate limit exceeded. Retry after ${retryDelaySeconds}s`,
          RateLimitType.LLM_CALLS,
          undefined,
          Math.ceil(retryDelaySeconds * 1000) // Convert to milliseconds, round up
        );
      } catch (parseError) {
        // If parsing fails, throw generic error with default delay
        throw new RateLimitExceededError(
          `Gemini API rate limit exceeded`,
          RateLimitType.LLM_CALLS,
          undefined,
          34000 // Default 34s
        );
      }
    }
    
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }

  const json = await res.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new InferError('Empty response from Gemini', '', toolCallContext);
  }

  // Parse JSON response
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new InferError('Invalid JSON from Gemini', text, toolCallContext);
  }

  // Handle tool intent protocol
  if (parsed.action && tools) {
    // Find matching tool definition
    const toolDef = tools.find(t => t.name === parsed.action.tool);
    if (!toolDef) {
      throw new InferError(`Unknown tool: ${parsed.action.tool}`, text, toolCallContext);
    }

    // Create tool call in OpenAI format for compatibility
    const toolCall: ChatCompletionMessageFunctionToolCall = {
      id: `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'function',
      function: {
        name: parsed.action.tool,
        arguments: JSON.stringify(parsed.action.args ?? {}),
      },
    };

    const assistantMessage: Message = {
      role: 'assistant',
      content: parsed.thought || '',
      tool_calls: [toolCall],
    };

    // Execute tool calls
    const executed = await executeToolCalls([toolCall], tools);
    const newContext = updateToolCallContext(
      toolCallContext,
      assistantMessage,
      executed,
      completionConfig?.detector
    );

    // Check for completion signal
    if (newContext.completionSignal?.signaled) {
      if (schema) {
        throw new AbortError(
          `Completion signaled: ${newContext.completionSignal.summary || 'Task complete'}`,
          newContext
        );
      }
      return {
        string: newContext.completionSignal.summary || 'Task complete',
        toolCallContext: newContext
      };
    }

    // Recurse with tool results (preserve abortSignal for cancellation)
    return inferGeminiNative(
      { ...args, abortSignal },
      newContext
    );
  }

  // Final output - validate with schema if provided
  if (schema) {
    const result = schema.safeParse(parsed.final ?? parsed);
    if (!result.success) {
      throw new InferError('Schema validation failed', text, toolCallContext);
    }
    return { object: result.data, toolCallContext };
  }

  return { string: parsed.final ?? text, toolCallContext };
}
