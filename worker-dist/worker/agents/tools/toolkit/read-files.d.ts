import { ToolDefinition, ErrorResult } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
export type ReadFilesArgs = {
    paths: string[];
    timeout?: number;
};
export type ReadFilesResult = {
    files: {
        path: string;
        content: string;
    }[];
} | ErrorResult;
export declare function createReadFilesTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<ReadFilesArgs, ReadFilesResult>;
