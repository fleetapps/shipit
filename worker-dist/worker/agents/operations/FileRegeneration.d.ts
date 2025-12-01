import { FileGenerationOutputType } from '../schemas';
import { AgentOperation, OperationOptions } from '../operations/common';
import { FileOutputType } from '../schemas';
export interface FileRegenerationInputs {
    file: FileOutputType;
    issues: string[];
    retryIndex: number;
}
export declare class FileRegenerationOperation extends AgentOperation<FileRegenerationInputs, FileGenerationOutputType> {
    execute(inputs: FileRegenerationInputs, options: OperationOptions): Promise<FileGenerationOutputType>;
}
