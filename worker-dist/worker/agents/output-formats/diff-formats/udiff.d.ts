/**
 * Production-grade unified diff application with comprehensive hardening
 * @param originalContent - The original file content
 * @param diffContent - The unified diff to apply
 * @param options - Optional configuration for debugging and telemetry
 * @returns The modified content after applying the diff
 * @throws Error with detailed diagnostics on failure
 */
export declare function applyDiff(originalContent: string, diffContent: string, options?: {
    enableTelemetry?: boolean;
    allowFallbackToRaw?: boolean;
}): string;
