/**
 * SQLite filesystem adapter for isomorphic-git
 * One DO = one Git repo, stored directly in SQLite
 *
 * Limits:
 * - Cloudflare DO SQLite: 10GB total storage
 * - Max parameter size: ~1MB per SQL statement parameter
 * - Git objects are base64-encoded to safely store binary data
 */
export interface SqlExecutor {
    <T = unknown>(query: TemplateStringsArray, ...values: (string | number | boolean | null)[]): T[];
}
export declare class SqliteFS {
    private sql;
    promises: this;
    constructor(sql: SqlExecutor);
    /**
     * Get storage statistics for observability
     */
    getStorageStats(): {
        totalObjects: number;
        totalBytes: number;
        largestObject: {
            path: string;
            size: number;
        } | null;
    };
    init(): void;
    readFile(path: string, options?: {
        encoding?: 'utf8';
    }): Promise<Uint8Array | string>;
    writeFile(path: string, data: Uint8Array | string): Promise<void>;
    unlink(path: string): Promise<void>;
    readdir(path: string): Promise<string[]>;
    mkdir(path: string, _options?: any): Promise<void>;
    rmdir(path: string): Promise<void>;
    stat(path: string): Promise<{
        type: 'file' | 'dir';
        mode: number;
        size: number;
        mtimeMs: number;
    }>;
    lstat(path: string): Promise<{
        type: "file" | "dir";
        mode: number;
        size: number;
        mtimeMs: number;
    }>;
    symlink(target: string, path: string): Promise<void>;
    readlink(path: string): Promise<string>;
    /**
     * Check if a file or directory exists
     * Required by isomorphic-git's init check
     */
    exists(path: string): Promise<boolean>;
    /**
     * Alias for writeFile (isomorphic-git sometimes uses 'write')
     */
    write(path: string, data: Uint8Array | string): Promise<void>;
    /**
     * Export all git objects for cloning
     * Returns array of {path, data}
     */
    exportGitObjects(): Array<{
        path: string;
        data: Uint8Array;
    }>;
}
