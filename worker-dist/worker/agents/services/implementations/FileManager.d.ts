import { IFileManager } from '../interfaces/IFileManager';
import { IStateManager } from '../interfaces/IStateManager';
import { FileOutputType } from '../../schemas';
import { FileState } from '../../../agents/core/state';
import { TemplateDetails } from '../../../services/sandbox/sandboxTypes';
import { GitVersionControl } from '../../../agents/git';
/**
 * Manages file operations for code generation
 * Handles both template and generated files
 */
export declare class FileManager implements IFileManager {
    private stateManager;
    private getTemplateDetailsFunc;
    private git;
    constructor(stateManager: IStateManager, getTemplateDetailsFunc: () => TemplateDetails, git: GitVersionControl);
    /**
     * Sync generatedFilesMap from git HEAD
     * TODO: Remove in the future by making git fs the single source of truth
     */
    private syncGeneratedFilesMapFromGit;
    getGeneratedFile(path: string): FileOutputType | null;
    /**
     * Get all files combining template and generated files
     * Template files are overridden by generated files with same path
     * @returns Array of all files. Only returns important template files, not all!
     */
    getAllRelevantFiles(): FileOutputType[];
    getAllFiles(): FileOutputType[];
    saveGeneratedFile(file: FileOutputType, commitMessage?: string): Promise<FileState>;
    saveGeneratedFiles(files: FileOutputType[], commitMessage?: string): Promise<FileState[]>;
    deleteFiles(filePaths: string[]): void;
    fileExists(path: string): boolean;
    getGeneratedFilePaths(): string[];
    getGeneratedFilesMap(): Record<string, FileOutputType>;
    getGeneratedFiles(): FileOutputType[];
    getTemplateFile(filePath: string): FileOutputType | null;
    getFile(filePath: string): FileOutputType | null;
}
