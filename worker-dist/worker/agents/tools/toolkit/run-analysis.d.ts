import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { StaticAnalysisResponse } from '../../../services/sandbox/sandboxTypes';
export type RunAnalysisArgs = {
    files?: string[];
};
export type RunAnalysisResult = StaticAnalysisResponse;
export declare function createRunAnalysisTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<RunAnalysisArgs, RunAnalysisResult>;
