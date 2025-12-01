import { ToolDefinition } from '../types';
import { StructuredLogger } from '../../../logger';
type WaitArgs = {
    seconds: number;
    reason?: string;
};
type WaitResult = {
    message: string;
};
export declare function createWaitTool(logger: StructuredLogger): ToolDefinition<WaitArgs, WaitResult>;
export {};
