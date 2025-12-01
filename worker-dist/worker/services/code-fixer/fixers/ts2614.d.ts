/**
 * TS2614: Module has no exported member (import/export mismatch) fixer
 * Handles cases where imports use wrong syntax (named vs default)
 */
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
/**
 * Fix TS2614 "Module has no exported member" errors (import/export mismatch)
 * Corrects import statements to match actual export types
 */
export declare function fixImportExportTypeMismatch(context: FixerContext, issues: CodeIssue[]): FixResult;
