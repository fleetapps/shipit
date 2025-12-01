import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
type QueueRequestArgs = {
    modificationRequest: string;
};
export declare function createQueueRequestTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<QueueRequestArgs, null>;
export {};
