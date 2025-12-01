import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { RenderToolCall } from '../../../agents/operations/UserConversationProcessor';
export declare function createDeepDebuggerTool(agent: CodingAgentInterface, logger: StructuredLogger, toolRenderer: RenderToolCall, streamCb: (chunk: string) => void): ToolDefinition<{
    issue: string;
    focus_paths?: string[];
}, {
    transcript: string;
} | {
    error: string;
}>;
