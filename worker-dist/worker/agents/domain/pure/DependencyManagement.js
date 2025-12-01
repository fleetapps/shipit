/**
 * Pure functions for dependency management
 * No side effects, handles package.json and dependency merging
 */
export class DependencyManagement {
    /**
     * Merge dependencies from template and package.json
     * Preserves exact behavior from original implementation
     */
    static mergeDependencies(templateDeps = {}, lastPackageJson, logger) {
        const deps = { ...templateDeps };
        // Add additional dependencies from the last package.json
        if (lastPackageJson) {
            try {
                const parsedPackageJson = JSON.parse(lastPackageJson);
                const packageDeps = parsedPackageJson.dependencies;
                if (packageDeps) {
                    Object.assign(deps, packageDeps);
                    logger?.info(`Adding dependencies from last package.json: ${Object.keys(packageDeps).join(', ')}`);
                }
            }
            catch (error) {
                logger?.warn('Failed to parse lastPackageJson:', error);
            }
        }
        return deps;
    }
    /**
     * Extract dependencies from package.json string
     */
    static extractDependenciesFromPackageJson(packageJson) {
        try {
            const parsed = JSON.parse(packageJson);
            return parsed.dependencies || {};
        }
        catch {
            return {};
        }
    }
    /**
     * Format dependency list for display
     */
    static formatDependencyList(deps) {
        return Object.entries(deps)
            .map(([name, version]) => `${name}@${version}`)
            .join(', ');
    }
}
