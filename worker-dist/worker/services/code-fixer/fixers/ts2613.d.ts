/**
 * TS2613: Module is not a module fixer
 * Handles import/export mismatches by converting between default and named imports
 */
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
/**
 * Fix TS2613 "Module is not a module" errors
 * Preserves exact logic from working ImportExportFixer.fixModuleIsNotModule
 */
export declare function fixModuleIsNotModule(context: FixerContext, issues: CodeIssue[]): FixResult;
