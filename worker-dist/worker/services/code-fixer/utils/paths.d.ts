/**
 * Path resolution utilities for import specifiers
 * Extracted from working ImportExportAnalyzer to preserve exact functionality
 */
import { FileMap } from '../types';
/**
 * Resolve path aliases like @/components/ui/button to src/components/ui/button
 * Preserves exact logic from working implementation
 */
export declare function resolvePathAlias(importSpecifier: string): string;
/**
 * Resolve relative import paths to absolute paths within the project
 * Preserves exact logic from working implementation
 */
export declare function resolveImportPath(importSpecifier: string, currentFilePath: string, files: FileMap): string;
/**
 * Find a module file using fuzzy matching and file fetching
 * Preserves exact logic from working ImportExportAnalyzer.findModuleFile
 */
export declare function findModuleFile(importSpecifier: string, currentFilePath: string, files: FileMap): string | null;
/**
 * Create a relative import path from one file to another
 * Preserves exact logic from working implementation
 */
export declare function makeRelativeImport(fromFile: string, toFile: string): string;
/**
 * Resolve an import specifier to a target file path for stub creation
 * Preserves exact logic from working implementation
 */
export declare function resolveImportToFilePath(importSpecifier: string, currentFilePath: string): string;
/**
 * Check if a path is a valid script file path
 */
export declare function isValidScriptPath(filePath: string): boolean;
/**
 * Normalize a file path by removing redundant parts
 */
export declare function normalizePath(filePath: string): string;
/**
 * Get the directory part of a file path
 */
export declare function getDirectory(filePath: string): string;
/**
 * Get the filename part of a file path (without extension)
 */
export declare function getFilename(filePath: string): string;
/**
 * Get the file extension
 */
export declare function getExtension(filePath: string): string;
