import { Blueprint } from '../../schemas';
import { FileTreeNode, TemplateDetails } from '../../../services/sandbox/sandboxTypes';
import { CodeGenState, FileState, PhaseState } from '../../core/state';
import type { StructuredLogger } from '../../../logger';
/**
 * Immutable context for code generation operations
 * Contains all necessary data for generating code
 */
export declare class GenerationContext {
    readonly query: string;
    readonly blueprint: Blueprint;
    readonly templateDetails: TemplateDetails;
    readonly dependencies: Record<string, string>;
    readonly allFiles: FileState[];
    readonly generatedPhases: PhaseState[];
    readonly commandsHistory: string[];
    constructor(query: string, blueprint: Blueprint, templateDetails: TemplateDetails, dependencies: Record<string, string>, allFiles: FileState[], generatedPhases: PhaseState[], commandsHistory: string[]);
    /**
     * Create context from current state
     */
    static from(state: CodeGenState, templateDetails: TemplateDetails, logger?: Pick<StructuredLogger, 'info' | 'warn'>): GenerationContext;
    /**
     * Get formatted phases for prompt generation
     */
    getCompletedPhases(): PhaseState[];
    getFileTree(): FileTreeNode;
}
