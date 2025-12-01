import { PhaseConceptGenerationSchemaType } from '../schemas';
import { IssueReport } from '../domain/values/IssueReport';
import { AgentOperation, OperationOptions } from '../operations/common';
import type { UserContext } from '../core/types';
export interface PhaseGenerationInputs {
    issues: IssueReport;
    userContext?: UserContext;
    isUserSuggestedPhase?: boolean;
}
export declare class PhaseGenerationOperation extends AgentOperation<PhaseGenerationInputs, PhaseConceptGenerationSchemaType> {
    execute(inputs: PhaseGenerationInputs, options: OperationOptions): Promise<PhaseConceptGenerationSchemaType>;
}
