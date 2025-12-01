import { PhaseConceptType, FileOutputType } from '../schemas';
import { IssueReport } from '../domain/values/IssueReport';
import { AgentOperation, OperationOptions } from '../operations/common';
import type { UserContext } from '../core/types';
export interface PhaseImplementationInputs {
    phase: PhaseConceptType;
    issues: IssueReport;
    isFirstPhase: boolean;
    shouldAutoFix: boolean;
    userContext?: UserContext;
    fileGeneratingCallback: (filePath: string, filePurpose: string) => void;
    fileChunkGeneratedCallback: (filePath: string, chunk: string, format: 'full_content' | 'unified_diff') => void;
    fileClosedCallback: (file: FileOutputType, message: string) => void;
}
export interface PhaseImplementationOutputs {
    fixedFilePromises: Promise<FileOutputType>[];
    deploymentNeeded: boolean;
    commands: string[];
}
export declare const SYSTEM_PROMPT: string;
export declare class PhaseImplementationOperation extends AgentOperation<PhaseImplementationInputs, PhaseImplementationOutputs> {
    execute(inputs: PhaseImplementationInputs, options: OperationOptions): Promise<PhaseImplementationOutputs>;
    generateReadme(options: OperationOptions): Promise<FileOutputType>;
}
