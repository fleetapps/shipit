import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
export declare function createWaitForGenerationTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<Record<string, never>, {
    status: string;
} | {
    error: string;
}>;
