import type { FileTreeNode } from './sandboxTypes';
export declare class FileTreeBuilder {
    /**
     * Default directories to exclude from file trees
     */
    static readonly DEFAULT_EXCLUDED_DIRS: string[];
    /**
     * Default file patterns to exclude from file trees
     */
    static readonly DEFAULT_EXCLUDED_FILES: string[];
    /**
     * Build a hierarchical file tree from a flat list of file paths
     * @param filePaths - Array of file paths (e.g., ['src/App.tsx', 'package.json'])
     * @param options - Optional configuration
     * @returns Root node of the file tree
     */
    static buildFromPaths(filePaths: string[], options?: {
        excludeDirs?: string[];
        excludeFiles?: string[];
        rootPath?: string;
    }): FileTreeNode;
    /**
     * Build a file tree from TemplateFile objects
     * @param files - Array of template files with filePath and fileContents
     * @param options - Optional configuration
     * @returns Root node of the file tree
     */
    static buildFromTemplateFiles<T extends {
        filePath: string;
    }>(files: T[], options?: {
        excludeDirs?: string[];
        excludeFiles?: string[];
        rootPath?: string;
    }): FileTreeNode;
    /**
     * Generate find command exclusions for sandbox execution
     * Used when building file trees from sandbox filesystem
     */
    static generateFindExclusions(options?: {
        excludeDirs?: string[];
        excludeFiles?: string[];
    }): {
        dirExclusions: string;
        fileExclusions: string;
    };
    /**
     * Parse sandbox find command output and build tree
     * Delegates to buildFromPathsWithTypes after parsing
     * @param findOutput - Raw output from sandbox find command
     * @returns Root node of the file tree, or undefined if parsing fails
     */
    static buildFromFindOutput(findOutput: string): FileTreeNode | undefined;
    /**
     * Internal method: Build tree from paths with explicit file/dir marking
     * This is the single source of truth for tree construction
     * @param paths - All paths (files and directories)
     * @param filePaths - Set of paths that are files (not directories)
     * @param rootPath - Path for the root node (default: '')
     * @returns Root node of the file tree
     */
    private static buildFromPathsWithTypes;
}
