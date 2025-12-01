/**
 * Stub generation utilities using Babel AST construction
 * Extracted from working ImportExportAnalyzer to preserve exact functionality
 * Uses AST-based generation, not string templates, as requested
 */
import * as t from '@babel/types';
import { ImportInfo, ImportUsage, FileMap } from '../types';
/**
 * Analyze how imports are used to generate appropriate stubs
 * Preserves exact logic from working implementation
 */
export declare function analyzeImportUsageForStub(importInfo: ImportInfo, files: FileMap): ImportUsage[];
/**
 * Generate stub file AST based on import information and usage analysis
 * Preserves exact logic from working buildStubAST method
 */
export declare function generateStubFileAST(importInfo: ImportInfo, usages: ImportUsage[]): t.File;
/**
 * Generate stub file content as a string
 */
export declare function generateStubFileContent(importInfo: ImportInfo, files: FileMap): string;
/**
 * Determine appropriate file extension based on usage analysis
 */
export declare function getStubFileExtension(usageAnalysis: ImportUsage[]): string;
/**
 * Check if stub needs React import based on usage
 */
export declare function stubNeedsReactImport(usageAnalysis: ImportUsage[]): boolean;
/**
 * Validate generated stub content
 */
export declare function validateStubContent(content: string): boolean;
