/**
 * TS2304: Cannot find name fixer
 * Handles undefined names by creating placeholder declarations
 */
import type { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
/**
 * Fix TS2304 "Cannot find name" errors
 * Preserves exact logic from working DeclarationFixer.fixUndefinedName
 */
export declare function fixUndefinedName(context: FixerContext, issues: CodeIssue[]): FixResult;
