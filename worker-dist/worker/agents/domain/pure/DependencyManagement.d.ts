/**
 * Pure functions for dependency management
 * No side effects, handles package.json and dependency merging
 */
import type { StructuredLogger } from '../../../logger';
export declare class DependencyManagement {
    /**
     * Merge dependencies from template and package.json
     * Preserves exact behavior from original implementation
     */
    static mergeDependencies(templateDeps?: Record<string, string>, lastPackageJson?: string, logger?: Pick<StructuredLogger, 'info' | 'warn'>): Record<string, string>;
    /**
     * Extract dependencies from package.json string
     */
    static extractDependenciesFromPackageJson(packageJson: string): Record<string, string>;
    /**
     * Format dependency list for display
     */
    static formatDependencyList(deps: Record<string, string>): string;
}
