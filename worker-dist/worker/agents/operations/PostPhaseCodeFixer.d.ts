import { AgentOperation, OperationOptions } from './common';
import { FileOutputType, PhaseConceptType } from '../schemas';
import { CodeIssue } from '../../services/sandbox/sandboxTypes';
export interface FastCodeFixerInputs {
    query: string;
    issues: CodeIssue[];
    allFiles: FileOutputType[];
    allPhases?: PhaseConceptType[];
}
export declare class FastCodeFixerOperation extends AgentOperation<FastCodeFixerInputs, FileOutputType[]> {
    execute(inputs: FastCodeFixerInputs, options: OperationOptions): Promise<FileOutputType[]>;
}
