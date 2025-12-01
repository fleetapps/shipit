/**
 * Main functional entry point for the deterministic code fixer
 * Stateless, functional approach to fixing TypeScript compilation issues
 */
import { FileObject } from './types';
import { CodeIssue } from '../sandbox/sandboxTypes';
import { CodeFixResult } from './types';
/**
 * Fix TypeScript compilation issues across the entire project
 * Properly accumulates multiple fixes to the same file
 *
 * @param allFiles - Initial files to work with
 * @param issues - TypeScript compilation issues to fix
 * @returns Promise containing fix results with modified/new files
 */
export declare function fixProjectIssues(allFiles: FileObject[], issues: CodeIssue[]): CodeFixResult;
export type { CodeFixResult, FixedIssue, UnfixableIssue, FileObject, FixerContext, FileMap, ProjectFile } from './types';
export { isScriptFile } from './utils/ast';
export { resolvePathAlias, makeRelativeImport } from './utils/paths';
export { analyzeImportUsage } from './utils/imports';
export { generateStubFileContent } from './utils/stubs';
