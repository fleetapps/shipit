import Assistant from './assistant';
import { ConversationMessage } from '../inferutils/common';
import { InferenceContext, ModelConfig } from '../inferutils/config.types';
import { CodingAgentInterface } from '../services/implementations/CodingAgent';
import { RenderToolCall } from '../operations/UserConversationProcessor';
import { RuntimeError } from '../../services/sandbox/sandboxTypes';
import { FileState } from '../core/state';
export type DebugSession = {
    filesIndex: FileState[];
    agent: CodingAgentInterface;
    runtimeErrors?: RuntimeError[];
};
export type DebugInputs = {
    issue: string;
    previousTranscript?: string;
};
export declare class DeepCodeDebugger extends Assistant<Env> {
    logger: import("../../logger").StructuredLogger;
    modelConfigOverride?: ModelConfig;
    private loopDetection;
    constructor(env: Env, inferenceContext: InferenceContext, modelConfigOverride?: ModelConfig);
    private detectRepetition;
    private injectLoopWarning;
    run(inputs: DebugInputs, session: DebugSession, streamCb?: (chunk: string) => void, toolRenderer?: RenderToolCall): Promise<string>;
    getTranscript(): ConversationMessage[];
}
