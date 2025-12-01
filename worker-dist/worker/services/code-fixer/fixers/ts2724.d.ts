/**
 * TS2724: Incorrect named import fixer
 * Handles cases where a named import doesn't exist but TypeScript suggests alternatives
 * Example: "'@/components/ui/sonner' has no exported member named 'toast'. Did you mean 'Toaster'?"
 */
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
import * as t from '@babel/types';
/**
 * Fix TS2724 "Incorrect named import" errors
 * Replaces incorrect named imports with the suggested correct ones from TypeScript
 */
export declare function fixIncorrectNamedImport(context: FixerContext, issues: CodeIssue[]): FixResult;
/**
 * Parse TS2724 error message to extract module specifier, incorrect import, and suggested import
 *
 * Examples:
 * - "'@/components/ui/sonner' has no exported member named 'toast'. Did you mean 'Toaster'?"
 * - "Module './utils' has no exported member 'utilFunction'. Did you mean 'utilityFunction'?"
 * - "'react' has no exported member named 'useCallback'. Did you mean 'useCallBack'?"
 */
export declare function parseTS2724ErrorMessage(errorMessage: string): {
    moduleSpecifier: string;
    incorrectImport: string;
    suggestedImport: string;
} | null;
/**
 * Replace a named import in the AST with a different named import
 */
export declare function replaceNamedImport(ast: t.File, moduleSpecifier: string, oldImportName: string, newImportName: string): t.File | null;
/**
 * Apply multiple named import replacements to handle multiple corrections in the same statement
 */
export declare function applyMultipleNamedImportReplacements(ast: t.File, replacementsByImport: Map<string, Map<string, string>>): t.File | null;
