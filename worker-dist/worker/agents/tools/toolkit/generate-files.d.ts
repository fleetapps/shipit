import { ToolDefinition, ErrorResult } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { FileConceptType } from '../../../agents/schemas';
export type GenerateFilesArgs = {
    phase_name: string;
    phase_description: string;
    requirements: string[];
    files: FileConceptType[];
};
export type GenerateFilesResult = {
    files: Array<{
        path: string;
        purpose: string;
        diff: string;
    }>;
    summary: string;
} | ErrorResult;
export declare function createGenerateFilesTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<GenerateFilesArgs, GenerateFilesResult>;
