/**
 * Common helper utilities for all fixers
 * Implements DRY principles by centralizing repeated patterns
 */
import { getFileAST, findImportAtLocation } from './imports';
import { resolveModuleFile, validateModuleOperation } from './modules';
// ============================================================================
// COMMON FIXER PATTERNS
// ============================================================================
/**
 * Standard pattern: Get source file AST and import info
 * Used by TS2305, TS2613, TS2614 fixers
 */
export function getSourceFileAndImport(issue, context) {
    // Get AST for the source file
    const sourceAST = getFileAST(issue.filePath, context.files);
    if (!sourceAST) {
        return null;
    }
    // Find the import at the error location
    const importInfo = findImportAtLocation(sourceAST, issue.line);
    if (!importInfo) {
        return null;
    }
    return { sourceAST, importInfo };
}
/**
 * Standard pattern: Get target file for a module specifier
 * Used by TS2305, TS2613, TS2614 fixers
 */
export function getTargetFileAndAST(moduleSpecifier, fromFilePath, context) {
    // Validate the module operation first
    const validation = validateModuleOperation(moduleSpecifier, null);
    if (!validation.valid) {
        return null;
    }
    // Resolve the target file
    const targetFilePath = resolveModuleFile(moduleSpecifier, fromFilePath, context);
    if (!targetFilePath) {
        return null;
    }
    // Validate the resolved file path
    const fileValidation = validateModuleOperation(moduleSpecifier, targetFilePath);
    if (!fileValidation.valid) {
        return null;
    }
    // Get AST for target file
    const targetAST = getFileAST(targetFilePath, context.files);
    if (!targetAST) {
        return null;
    }
    return { targetFilePath, targetAST };
}
/**
 * Combined pattern: Get both source and target files
 * Used by import/export fixers that need both files
 */
export function getSourceAndTargetFiles(issue, context) {
    // Get source file and import info
    const sourceResult = getSourceFileAndImport(issue, context);
    if (!sourceResult) {
        return null;
    }
    const { sourceAST, importInfo } = sourceResult;
    // Get target file and AST
    const targetResult = getTargetFileAndAST(importInfo.moduleSpecifier, issue.filePath, context);
    if (!targetResult) {
        return null;
    }
    const { targetFilePath, targetAST } = targetResult;
    return {
        sourceAST,
        importInfo,
        targetFilePath,
        targetAST
    };
}
// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================
/**
 * Create a standardized unfixable issue with consistent format
 */
export function createUnfixableIssue(issue, reason) {
    return {
        issueCode: issue.ruleId || 'UNKNOWN',
        filePath: issue.filePath,
        line: issue.line,
        column: issue.column,
        originalMessage: issue.message,
        reason
    };
}
/**
 * Handle common fixer errors with standardized messages
 */
export function handleFixerError(issue, error, fixerName) {
    return createUnfixableIssue(issue, `${fixerName} failed: ${error.message}`);
}
/**
 * Create unfixable issue for source file parsing failures
 */
export function createSourceFileParseError(issue) {
    return createUnfixableIssue(issue, 'Failed to parse source file AST');
}
/**
 * Create unfixable issue for missing import at location
 */
export function createMissingImportError(issue) {
    return createUnfixableIssue(issue, 'No import found at specified location');
}
/**
 * Create unfixable issue for external module operations
 */
export function createExternalModuleError(issue, moduleSpecifier) {
    return createUnfixableIssue(issue, `External package "${moduleSpecifier}" should be handled by package manager`);
}
/**
 * Create unfixable issue for target file not found
 */
export function createTargetFileNotFoundError(issue, moduleSpecifier) {
    return createUnfixableIssue(issue, `Target file not found for module: ${moduleSpecifier}`);
}
/**
 * Create unfixable issue for target file parsing failures
 */
export function createTargetFileParseError(issue, targetFilePath) {
    return createUnfixableIssue(issue, `Failed to parse target file: ${targetFilePath}`);
}
// ============================================================================
// VALIDATION HELPERS
// ============================================================================
/**
 * Validate a fixer operation and return appropriate error if invalid
 */
export function validateFixerOperation(issue, moduleSpecifier, targetFilePath) {
    if (moduleSpecifier) {
        const validation = validateModuleOperation(moduleSpecifier, targetFilePath || null);
        if (!validation.valid) {
            return createUnfixableIssue(issue, validation.reason);
        }
    }
    return null;
}
// ============================================================================
// LOGGING HELPERS
// ============================================================================
/**
 * Create consistent log messages for fixer operations
 */
export function createFixerLogMessages(fixerName, issueCount) {
    return {
        start: `Starting ${fixerName} with ${issueCount} issues`,
        processing: (issue) => `Processing ${issue.ruleId} issue: ${issue.message} at ${issue.filePath}:${issue.line}`,
        success: (issue) => `Successfully fixed ${issue.ruleId} issue for ${issue.filePath}`,
        completed: (fixed, unfixable, modified, newFiles) => `${fixerName} completed: ${fixed} fixed, ${unfixable} unfixable, ${modified} modified files, ${newFiles} new files`
    };
}
