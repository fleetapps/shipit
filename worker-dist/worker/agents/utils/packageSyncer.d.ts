/**
 * Merges sandbox package.json dependencies into agent's package.json
 * Only updates dependencies and devDependencies, preserving all other fields
 *
 * @param oldPackageJson - Agent's current package.json (from state)
 * @param newPackageJson - Sandbox's package.json (after npm install/add/remove)
 * @returns Object with updated flag and merged package.json string
 */
export declare function updatePackageJson(oldPackageJson: string | undefined, newPackageJson: string): {
    updated: boolean;
    packageJson: string;
};
