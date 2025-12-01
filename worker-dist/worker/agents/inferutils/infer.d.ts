import { InferResponseString, InferResponseObject } from './core';
import { Message } from './common';
import z from 'zod';
import { SchemaFormat } from './schemaFormatters';
import { ReasoningEffort } from 'openai/resources.mjs';
import { AgentActionKey, AIModels, InferenceContext, ModelConfig } from './config.types';
import { ToolDefinition } from '../tools/types';
/**
 * Helper function to execute AI inference with consistent error handling
 * @param params Parameters for the inference operation
 * @returns The inference result or null if error
 */
interface InferenceParamsBase {
    env: Env;
    messages: Message[];
    maxTokens?: number;
    temperature?: number;
    modelName?: AIModels | string;
    retryLimit?: number;
    agentActionName: AgentActionKey;
    tools?: ToolDefinition<any, any>[];
    stream?: {
        chunk_size: number;
        onChunk: (chunk: string) => void;
    };
    reasoning_effort?: ReasoningEffort;
    modelConfig?: ModelConfig;
    context: InferenceContext;
}
interface InferenceParamsStructured<T extends z.AnyZodObject> extends InferenceParamsBase {
    schema: T;
    format?: SchemaFormat;
}
export declare function executeInference<T extends z.AnyZodObject>(params: InferenceParamsStructured<T>): Promise<InferResponseObject<T>>;
export declare function executeInference(params: InferenceParamsBase): Promise<InferResponseString>;
/**
 * Creates a file enhancement request message
 * @param filePath Path to the file being enhanced
 * @param fileContents Contents of the file to enhance
 * @returns A message for the AI model to enhance the file
 */
export declare function createFileEnhancementRequestMessage(filePath: string, fileContents: string): Message;
/**
 * Creates a response message about a generated file
 */
export declare function createFileGenerationResponseMessage(filePath: string, fileContents: string, explanation: string, nextFile?: {
    path: string;
    purpose: string;
}): Message;
export {};
