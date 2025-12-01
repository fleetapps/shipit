import { ToolDefinition, ErrorResult } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
export type RegenerateFileArgs = {
    path: string;
    issues: string[];
};
export type RegenerateFileResult = {
    path: string;
    diff: string;
} | ErrorResult;
export declare function createRegenerateFileTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<RegenerateFileArgs, RegenerateFileResult>;
