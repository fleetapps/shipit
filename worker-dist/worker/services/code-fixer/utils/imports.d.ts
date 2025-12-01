/**
 * Import/export analysis utilities using Babel AST traversal
 * Extracted from working ImportExportAnalyzer to preserve exact functionality
 */
import * as t from '@babel/types';
import { ImportInfo, ExportInfo, ImportUsage, FileMap } from '../types';
/**
 * Find import information at a specific line number in the AST
 * Enhanced to support dynamic imports
 */
export declare function findImportAtLocation(ast: t.File, line: number): ImportInfo | null;
/**
 * Get all imports from a file AST
 */
export declare function getAllImports(ast: t.File): ImportInfo[];
/**
 * Get exports information from a file AST
 * Preserves exact logic from working implementation
 */
export declare function getFileExports(ast: t.File): ExportInfo;
/**
 * Analyze how imported names are used in the source file AST
 * Preserves exact logic from working implementation
 */
export declare function analyzeImportUsage(ast: t.File, importNames: string[]): ImportUsage[];
/**
 * Analyze how a specific imported name is used in the AST
 * Preserves exact logic from working implementation
 */
export declare function analyzeNameUsage(ast: t.File, name: string): ImportUsage | null;
/**
 * Get file content from FileMap or fetch it if not available
 */
export declare function getFileContent(filePath: string, files: FileMap): string | null;
/**
 * Get file AST from FileMap with caching, or parse it if needed
 */
export declare function getFileAST(filePath: string, files: FileMap): t.File | null;
/**
 * Update import path in AST by modifying the source value
 */
export declare function updateImportPath(ast: t.File, oldPath: string, newPath: string): t.File;
/**
 * Fix import/export mismatches by converting between default and named imports
 * Enhanced to handle complex partial matches while preserving valid imports
 */
export declare function fixImportExportMismatch(ast: t.File, moduleSpecifier: string, exports: ExportInfo): {
    fixed: boolean;
    changes: string[];
};
