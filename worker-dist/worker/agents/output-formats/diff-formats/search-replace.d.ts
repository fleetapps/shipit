/**
 * Search/Replace Diff Format Implementation
 *
 * This format is designed to be simple and reliable for LLM-generated diffs.
 * Each edit is specified as a search block followed by a replace block.
 *
 * Format:
 * ```
 * <<<<<<< SEARCH
 * content to find
 * =======
 * content to replace with
 * >>>>>>> REPLACE
 * ```
 */
export declare enum MatchingStrategy {
    EXACT = "exact",
    WHITESPACE_INSENSITIVE = "whitespace-insensitive",
    INDENTATION_PRESERVING = "indentation-preserving",
    FUZZY = "fuzzy"
}
export interface FailedBlock {
    search: string;
    replace: string;
    error: string;
    lineNumber?: number;
}
export interface ApplyResult {
    content: string;
    results: {
        blocksTotal: number;
        blocksApplied: number;
        blocksFailed: number;
        errors: string[];
        warnings: string[];
        failedBlocks: FailedBlock[];
    };
}
/**
 * Apply search/replace diff with enhanced error handling and telemetry
 */
export declare function applyDiff(originalContent: string, diffContent: string, options?: {
    strict?: boolean;
    enableTelemetry?: boolean;
    matchingStrategies?: MatchingStrategy[];
    fuzzyThreshold?: number;
}): ApplyResult;
/**
 * Utility to create a search/replace diff from before/after content
 */
export declare function createSearchReplaceDiff(beforeContent: string, afterContent: string, options?: {
    contextLines?: number;
    maxSearchSize?: number;
}): string;
/**
 * Validate a search/replace diff without applying it
 */
export declare function validateDiff(content: string, diffContent: string): {
    valid: boolean;
    errors: string[];
};
/**
 * Test cases for the enhanced search/replace parser
 * These tests cover all the edge cases mentioned in the requirements
 */
export declare function runParserTests(): {
    passed: number;
    failed: number;
    details: string[];
};
