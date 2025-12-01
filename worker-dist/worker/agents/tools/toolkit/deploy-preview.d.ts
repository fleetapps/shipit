import { ErrorResult, ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
type DeployPreviewArgs = Record<string, never>;
type DeployPreviewResult = {
    message: string;
} | ErrorResult;
export declare function createDeployPreviewTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<DeployPreviewArgs, DeployPreviewResult>;
export {};
