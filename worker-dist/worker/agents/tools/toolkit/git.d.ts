import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
type GitCommand = 'commit' | 'log' | 'show' | 'reset';
interface GitToolArgs {
    command: GitCommand;
    message?: string;
    limit?: number;
    oid?: string;
    includeDiff?: boolean;
}
export declare function createGitTool(agent: CodingAgentInterface, logger: StructuredLogger, options?: {
    excludeCommands?: GitCommand[];
}): ToolDefinition<GitToolArgs, {
    success: boolean;
    data?: any;
    message?: string;
}>;
export {};
