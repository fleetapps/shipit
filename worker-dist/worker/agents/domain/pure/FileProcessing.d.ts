import { FileGenerationOutputType, FileOutputType, PhaseConceptType } from '../../schemas';
import type { StructuredLogger } from '../../../logger';
import { TemplateDetails } from '../../../services/sandbox/sandboxTypes';
import { FileState } from '../../../agents/core/state';
/**
 * File processing utilities
 * Handles content cleaning, diff application, and file metadata
 */
export declare class FileProcessing {
    /**
     * Remove code block markers from file contents
     */
    static cleanFileContents(fileContents: string): string;
    /**
     * Process generated file contents
     * Applies diffs or returns cleaned content
     */
    static processGeneratedFileContents(generatedFile: FileGenerationOutputType, originalContents: string, logger?: Pick<StructuredLogger, 'info' | 'warn' | 'error'>): string;
    /**
     * Find file purpose from phase or generated files
     */
    static findFilePurpose(filePath: string, phase: PhaseConceptType, generatedFilesMap: Record<string, FileOutputType>): string;
    /**
     * Get all relevant files combining template (important) and generated files
     * Template files are overridden by generated files with same path
     */
    static getAllRelevantFiles(templateDetails: TemplateDetails | undefined, generatedFilesMap: Record<string, FileState>): FileState[];
    static getAllFiles(templateDetails: TemplateDetails | undefined, generatedFilesMap: Record<string, FileState>, onlyImportantFiles?: boolean): FileState[];
}
