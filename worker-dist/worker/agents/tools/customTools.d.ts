import type { ToolDefinition } from './types';
import { StructuredLogger } from '../../logger';
import { RenderToolCall } from '../operations/UserConversationProcessor';
import { CodingAgentInterface } from '../../agents/services/implementations/CodingAgent';
import { DebugSession } from '../assistants/codeDebugger';
export declare function executeToolWithDefinition<TArgs, TResult>(toolDef: ToolDefinition<TArgs, TResult>, args: TArgs): Promise<TResult>;
/**
 * Build all available tools for the agent
 * Add new tools here - they're automatically included in the conversation
 */
export declare function buildTools(agent: CodingAgentInterface, logger: StructuredLogger, toolRenderer: RenderToolCall, streamCb: (chunk: string) => void): ToolDefinition<any, any>[];
export declare function buildDebugTools(session: DebugSession, logger: StructuredLogger, toolRenderer?: RenderToolCall): ToolDefinition<any, any>[];
