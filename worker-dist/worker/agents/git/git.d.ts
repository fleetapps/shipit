/**
 * Git version control for Durable Objects using isomorphic-git
 */
import { SqliteFS, type SqlExecutor } from './fs-adapter';
import { FileOutputType } from '../schemas';
export interface CommitInfo {
    oid: string;
    message: string;
    author: string;
    timestamp: string;
}
export interface FileDiff {
    path: string;
    diff: string;
}
export interface GitShowResult {
    oid: string;
    message: string;
    author: string;
    timestamp: string;
    files: number;
    fileList: string[];
    diffs?: FileDiff[];
}
type FileSnapshot = Omit<FileOutputType, 'filePurpose'>;
export declare class GitVersionControl {
    private onFilesChangedCallback?;
    fs: SqliteFS;
    private author;
    private get gitConfig();
    constructor(sql: SqlExecutor, author?: {
        name: string;
        email: string;
    });
    setOnFilesChangedCallback(callback: () => void): void;
    getAllFilesFromHead(): Promise<Array<{
        filePath: string;
        fileContents: string;
    }>>;
    init(): Promise<void>;
    /**
     * Stage files without committing them
     * Useful for batching multiple operations before a single commit
     */
    stage(files: FileSnapshot[]): Promise<void>;
    private normalizePath;
    commit(files: FileSnapshot[], message?: string): Promise<string | null>;
    private hasChanges;
    log(limit?: number): Promise<CommitInfo[]>;
    private readFilesFromCommit;
    show(oid: string, options?: {
        includeDiff?: boolean;
    }): Promise<GitShowResult>;
    private findChangedFiles;
    private generateDiffs;
    private readBlobContent;
    private formatShowResult;
    private buildPath;
    /**
     * Efficiently collect file paths and their OIDs from a tree (no blob content read)
     */
    private collectTreeOids;
    reset(ref: string, options?: {
        hard?: boolean;
    }): Promise<{
        ref: string;
        filesReset: number;
    }>;
    private walkTree;
    private tryReadTextBlob;
    getHead(): Promise<string | null>;
    /**
     * Get storage statistics for monitoring and observability
     */
    getStorageStats(): {
        totalObjects: number;
        totalBytes: number;
        largestObject: {
            path: string;
            size: number;
        } | null;
    };
}
export {};
