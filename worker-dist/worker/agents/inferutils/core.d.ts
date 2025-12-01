import { z } from 'zod';
import { type SchemaFormat, type FormatterOptions } from './schemaFormatters';
import { type ReasoningEffort } from 'openai/resources.mjs';
import { Message } from './common';
import { ToolDefinition } from '../tools/types';
import { AgentActionKey, AIModels, InferenceMetadata } from './config.types';
export declare function buildGatewayUrl(env: Env, providerOverride?: AIGatewayProviders): Promise<string>;
export declare function getConfigurationForModel(model: AIModels | string, env: Env, userId: string): Promise<{
    baseURL: string;
    apiKey: string;
    defaultHeaders?: Record<string, string>;
}>;
type InferArgsBase = {
    env: Env;
    metadata: InferenceMetadata;
    actionKey: AgentActionKey | 'testModelConfig';
    messages: Message[];
    maxTokens?: number;
    modelName: AIModels | string;
    reasoning_effort?: ReasoningEffort;
    temperature?: number;
    stream?: {
        chunk_size: number;
        onChunk: (chunk: string) => void;
    };
    tools?: ToolDefinition<any, any>[];
    providerOverride?: 'cloudflare' | 'direct';
    userApiKeys?: Record<string, string>;
    abortSignal?: AbortSignal;
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
}
export declare function serializeCallChain(context: ToolCallContext, finalResponse: string): string;
export declare class InferError extends Error {
    response: string;
    toolCallContext?: ToolCallContext | undefined;
    constructor(message: string, response: string, toolCallContext?: ToolCallContext | undefined);
    partialResponseTranscript(): string;
    partialResponse(): InferResponseString;
}
export declare class AbortError extends InferError {
    constructor(response: string, toolCallContext?: ToolCallContext);
}
export type InferResponseObject<OutputSchema extends z.AnyZodObject> = {
    object: z.infer<OutputSchema>;
    toolCallContext?: ToolCallContext;
};
export type InferResponseString = {
    string: string;
    toolCallContext?: ToolCallContext;
};
export declare function infer<OutputSchema extends z.AnyZodObject>(args: InferArgsStructured, toolCallContext?: ToolCallContext): Promise<InferResponseObject<OutputSchema>>;
export declare function infer(args: InferArgsBase, toolCallContext?: ToolCallContext): Promise<InferResponseString>;
export declare function infer<OutputSchema extends z.AnyZodObject>(args: InferWithCustomFormatArgs, toolCallContext?: ToolCallContext): Promise<InferResponseObject<OutputSchema>>;
export {};
