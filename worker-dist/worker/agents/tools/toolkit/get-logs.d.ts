import { ErrorResult, ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
type GetLogsArgs = {
    reset?: boolean;
    durationSeconds?: number;
    maxLines?: number;
};
type GetLogsResult = {
    logs: string;
} | ErrorResult;
export declare function createGetLogsTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<GetLogsArgs, GetLogsResult>;
export {};
