/**
 * TS2307: Cannot find module fixer
 * Handles missing module imports by either finding existing files or creating stubs
 */
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
/**
 * Fix TS2307 "Cannot find module" errors
 * Preserves exact logic from working ImportExportFixer.fixModuleNotFound
 */
export declare function fixModuleNotFound(context: FixerContext, issues: CodeIssue[]): FixResult;
