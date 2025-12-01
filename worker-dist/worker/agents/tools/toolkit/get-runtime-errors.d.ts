import { ErrorResult, ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { RuntimeError } from '../../../services/sandbox/sandboxTypes';
type GetRuntimeErrorsArgs = Record<string, never>;
type GetRuntimeErrorsResult = {
    errors: RuntimeError[];
} | ErrorResult;
export declare function createGetRuntimeErrorsTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<GetRuntimeErrorsArgs, GetRuntimeErrorsResult>;
export {};
