import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
import { CodingAgentInterface } from '../../../agents/services/implementations/CodingAgent';
import { Blueprint } from '../../../agents/schemas';
type AlterBlueprintArgs = {
    patch: Partial<Blueprint> & {
        projectName?: string;
    };
};
export declare function createAlterBlueprintTool(agent: CodingAgentInterface, logger: StructuredLogger): ToolDefinition<AlterBlueprintArgs, Blueprint>;
export {};
