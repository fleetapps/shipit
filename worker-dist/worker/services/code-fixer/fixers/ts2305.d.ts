/**
 * TS2305: Module has no exported member fixer
 * Handles missing named exports by adding stub exports to the target file
 */
import { CodeIssue } from '../../sandbox/sandboxTypes';
import { FixerContext, FixResult } from '../types';
/**
 * Fix TS2305 "Module has no exported member" errors
 * Adds missing exports as stubs to the target file
 */
export declare function fixMissingExportedMember(context: FixerContext, issues: CodeIssue[]): FixResult;
