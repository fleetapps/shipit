/**
 * Common helper utilities for all fixers
 * Implements DRY principles by centralizing repeated patterns
 */
import * as t from '@babel/types';
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, UnfixableIssue } from '../types';
/**
 * Standard pattern: Get source file AST and import info
 * Used by TS2305, TS2613, TS2614 fixers
 */
export declare function getSourceFileAndImport(issue: CodeIssue, context: FixerContext): {
    sourceAST: t.File;
    importInfo: {
        moduleSpecifier: string;
        defaultImport?: string;
        namedImports: string[];
        specifier?: string;
    };
} | null;
/**
 * Standard pattern: Get target file for a module specifier
 * Used by TS2305, TS2613, TS2614 fixers
 */
export declare function getTargetFileAndAST(moduleSpecifier: string, fromFilePath: string, context: FixerContext): {
    targetFilePath: string;
    targetAST: t.File;
} | null;
/**
 * Combined pattern: Get both source and target files
 * Used by import/export fixers that need both files
 */
export declare function getSourceAndTargetFiles(issue: CodeIssue, context: FixerContext): {
    sourceAST: t.File;
    importInfo: {
        moduleSpecifier: string;
        defaultImport?: string;
        namedImports: string[];
        specifier?: string;
    };
    targetFilePath: string;
    targetAST: t.File;
} | null;
/**
 * Create a standardized unfixable issue with consistent format
 */
export declare function createUnfixableIssue(issue: CodeIssue, reason: string): UnfixableIssue;
/**
 * Handle common fixer errors with standardized messages
 */
export declare function handleFixerError(issue: CodeIssue, error: Error, fixerName: string): UnfixableIssue;
/**
 * Create unfixable issue for source file parsing failures
 */
export declare function createSourceFileParseError(issue: CodeIssue): UnfixableIssue;
/**
 * Create unfixable issue for missing import at location
 */
export declare function createMissingImportError(issue: CodeIssue): UnfixableIssue;
/**
 * Create unfixable issue for external module operations
 */
export declare function createExternalModuleError(issue: CodeIssue, moduleSpecifier: string): UnfixableIssue;
/**
 * Create unfixable issue for target file not found
 */
export declare function createTargetFileNotFoundError(issue: CodeIssue, moduleSpecifier: string): UnfixableIssue;
/**
 * Create unfixable issue for target file parsing failures
 */
export declare function createTargetFileParseError(issue: CodeIssue, targetFilePath: string): UnfixableIssue;
/**
 * Validate a fixer operation and return appropriate error if invalid
 */
export declare function validateFixerOperation(issue: CodeIssue, moduleSpecifier?: string, targetFilePath?: string): UnfixableIssue | null;
/**
 * Create consistent log messages for fixer operations
 */
export declare function createFixerLogMessages(fixerName: string, issueCount: number): {
    start: string;
    processing: (issue: CodeIssue) => string;
    success: (issue: CodeIssue) => string;
    completed: (fixed: number, unfixable: number, modified: number, newFiles: number) => string;
};
