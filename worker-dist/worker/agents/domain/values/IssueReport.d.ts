import { RuntimeError, StaticAnalysisResponse } from '../../../services/sandbox/sandboxTypes';
import { AllIssues } from '../../core/types';
/**
 * Immutable report of issues found during code generation
 * Includes runtime errors, static analysis results, and client errors
 */
export declare class IssueReport {
    readonly runtimeErrors: RuntimeError[];
    readonly staticAnalysis: StaticAnalysisResponse;
    constructor(runtimeErrors: RuntimeError[], staticAnalysis: StaticAnalysisResponse);
    /**
     * Create report from all issues
     */
    static from(issues: AllIssues): IssueReport;
    /**
     * Check if there are any issues
     */
    hasIssues(): boolean;
    /**
     * Check if there are runtime errors
     */
    hasRuntimeErrors(): boolean;
    /**
     * Check if there are static analysis issues
     */
    hasStaticAnalysisIssues(): boolean;
    /**
     * Get total issue count
     */
    getTotalIssueCount(): number;
    /**
     * Get a summary of all issues
     */
    getSummary(): string;
    /**
     * Create an empty issue report
     */
    static empty(): IssueReport;
}
