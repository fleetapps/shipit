import { CodeGenerationFormat, CodeGenerationStreamingState, ParsingState } from './base';
import { FileGenerationOutputType } from "../../schemas";
export interface SCOFParsingState extends ParsingState {
}
/**
 * SCOF (Shell Command Output Format) implementation with robust chunk handling
 * Handles arbitrary chunk boundaries, mixed formats, and ensures single callback calls per file
 */
export declare class SCOFFormat extends CodeGenerationFormat {
    parseStreamingChunks(chunk: string, state: CodeGenerationStreamingState, onFileOpen: (filePath: string) => void, onFileChunk: (filePath: string, chunk: string, format: 'full_content' | 'unified_diff') => void, onFileClose: (filePath: string) => void): CodeGenerationStreamingState;
    private isValidSCOFState;
    private initializeSCOFState;
    private processAccumulatedContent;
    private processLine;
    private tryParseCommand;
    /**
     * ENHANCED: Normalize command string to handle specific LLM mistakes
     */
    private normalizeCommand;
    /**
     * ENHANCED: Parse file creation commands with LLM error resilience
     */
    private tryParseFileCreation;
    /**
     * ENHANCED: Parse diff patch commands with LLM error resilience
     */
    private tryParseDiffPatch;
    private handleCommand;
    private finalizeCurrentFile;
    private isEOFMarker;
    private looksLikeCommand;
    private isValidNestedCommand;
    private addContentLine;
    serialize(files: FileGenerationOutputType[]): string;
    deserialize(serialized: string): FileGenerationOutputType[];
    /**
     * Process accumulated content between SCOF file blocks to extract install commands
     */
    private processAccumulatedBetweenFilesContent;
    formatInstructions(): string;
}
