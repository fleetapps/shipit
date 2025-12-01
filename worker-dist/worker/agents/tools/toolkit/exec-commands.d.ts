import { ToolDefinition, ErrorResult } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { ExecuteCommandsResponse } from '../../../services/sandbox/sandboxTypes';
export type ExecCommandsArgs = {
    commands: string[];
    shouldSave: boolean;
    timeout?: number;
};
export type ExecCommandsResult = ExecuteCommandsResponse | ErrorResult;
export declare function createExecCommandsTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<ExecCommandsArgs, ExecCommandsResult>;
