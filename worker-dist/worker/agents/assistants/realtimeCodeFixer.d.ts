import { TemplateDetails } from "../../services/sandbox/sandboxTypes";
import { FileOutputType, PhaseConceptType } from "../schemas";
import Assistant from "./assistant";
import { FailedBlock } from "../output-formats/diff-formats/search-replace";
import { AgentActionKey, InferenceContext } from "../inferutils/config.types";
export interface RealtimeCodeFixerContext {
    previousFiles?: FileOutputType[];
    query: string;
    template: TemplateDetails;
}
export declare class RealtimeCodeFixer extends Assistant<Env> {
    logger: import("../../logger").StructuredLogger;
    lightMode: boolean;
    altPassModelOverride?: string;
    userPrompt: string;
    systemPrompt: string;
    agentActionNameOverride?: AgentActionKey;
    constructor(env: Env, inferenceContext: InferenceContext, lightMode?: boolean, altPassModelOverride?: string, // = AIModels.GEMINI_2_5_FLASH,
    agentActionNameOverride?: AgentActionKey, systemPrompt?: string, userPrompt?: string);
    run(generatedFile: FileOutputType, context: RealtimeCodeFixerContext, currentPhase?: PhaseConceptType, issues?: string[], passes?: number): Promise<FileOutputType>;
    /**
     * Smart diff applier with automatic error correction
     * Simple approach: applies diff, if blocks fail, gives all failed blocks to LLM to fix
     */
    applyDiffSafely(originalContent: string, originalDiff: string, maxRetries?: number): Promise<string>;
    /**
     * Get corrected diff from LLM using the new simplified DIFF_FIXER prompt
     */
    getLLMCorrectedDiff(currentContent: string, failedBlocks: FailedBlock[], allErrors: string[], successfullyAppliedCount: number): Promise<string | null>;
}
export declare function IsRealtimeCodeFixerEnabled(inferenceContext: InferenceContext): boolean;
