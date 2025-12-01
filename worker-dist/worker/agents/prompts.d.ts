import { FileTreeNode, RuntimeError, StaticAnalysisResponse, TemplateDetails } from "../services/sandbox/sandboxTypes";
import { Blueprint, FileOutputType, PhaseConceptType, TemplateSelection } from "./schemas";
import { IssueReport } from "./domain/values/IssueReport";
import { FileState } from "./core/state";
import { CodeSerializerType } from "./utils/codeSerializers";
export declare const PROMPT_UTILS: {
    /**
     * Replace template variables in a prompt string
     * @param template The template string with {{variable}} placeholders
     * @param variables Object with variable name -> value mappings
     */
    replaceTemplateVariables(template: string, variables: Record<string, string>): string;
    serializeTreeNodes(node: FileTreeNode): string;
    serializeTemplate(template?: TemplateDetails): string;
    serializeErrors(errors: RuntimeError[]): string;
    serializeStaticAnalysis(staticAnalysis: StaticAnalysisResponse): string;
    verifyPrompt(prompt: string): string;
    serializeFiles(files: FileOutputType[], serializerType: CodeSerializerType): string;
    REACT_RENDER_LOOP_PREVENTION: string;
    REACT_RENDER_LOOP_PREVENTION_LITE: string;
    COMMON_PITFALLS: string;
    COMMON_DEP_DOCUMENTATION: string;
    COMMANDS: string;
    CODE_CONTENT_FORMAT: string;
    UI_GUIDELINES: string;
    UI_NON_NEGOTIABLES_V3: string;
    PROJECT_CONTEXT: string;
};
export declare const STRATEGIES_UTILS: {
    INITIAL_PHASE_GUIDELINES: string;
    SUBSEQUENT_PHASE_GUIDELINES: string;
    CODING_GUIDELINES: string;
    CONSTRAINTS: string;
};
export declare const STRATEGIES: {
    FRONTEND_FIRST_PLANNING: string;
    FRONTEND_FIRST_CODING: string;
};
export interface GeneralSystemPromptBuilderParams {
    query: string;
    templateDetails: TemplateDetails;
    dependencies: Record<string, string>;
    blueprint?: Blueprint;
    language?: string;
    frameworks?: string[];
    templateMetaInfo?: TemplateSelection;
}
export declare function generalSystemPromptBuilder(prompt: string, params: GeneralSystemPromptBuilderParams): string;
export declare function issuesPromptFormatter(issues: IssueReport): string;
export declare const USER_PROMPT_FORMATTER: {
    PROJECT_CONTEXT: (phases: PhaseConceptType[], files: FileState[], fileTree: FileTreeNode, commandsHistory: string[], serializerType?: CodeSerializerType, recentPhasesCount?: number) => string;
};
export declare const getUsecaseSpecificInstructions: (selectedTemplate: TemplateSelection) => string;
