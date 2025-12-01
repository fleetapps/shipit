import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
type RenameArgs = {
    newName: string;
};
type RenameResult = {
    projectName: string;
};
export declare function createRenameProjectTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<RenameArgs, RenameResult>;
export {};
