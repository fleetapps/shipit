/**
 * Module detection and validation utilities
 * Centralized logic for determining external vs internal modules
 */
import { FixerContext } from '../types';
/**
 * Determine if a module specifier is an external package (npm module)
 * that we should NOT attempt to modify
 */
export declare function isExternalModule(moduleSpecifier: string): boolean;
/**
 * Check if a file path is within the project boundaries and can be modified
 */
export declare function canModifyFile(filePath: string): boolean;
/**
 * Resolve a module specifier to an actual file path within the project
 * Unified resolution logic used by all fixers
 */
export declare function resolveModuleFile(moduleSpecifier: string, fromFilePath: string, context: FixerContext): string | null;
/**
 * Check if a target file exists and can be modified
 */
export declare function canModifyTargetFile(targetFilePath: string, context: FixerContext): boolean;
/**
 * Validate that a module operation is safe and allowed
 */
export declare function validateModuleOperation(moduleSpecifier: string, targetFilePath: string | null): {
    valid: boolean;
    reason?: string;
};
/**
 * Get module type for logging and error reporting
 */
export declare function getModuleType(moduleSpecifier: string): 'external' | 'relative' | 'alias' | 'absolute';
