export declare function extractCommands(rawOutput: string, onlyInstallCommands?: boolean): string[];
/**
 * Maximum number of commands to keep in bootstrap history
 * Prevents unbounded growth while allowing sufficient dependency management
 */
export declare const MAX_BOOTSTRAP_COMMANDS = 50;
/**
 * Check if a command is valid for bootstrap script.
 * WHITELIST approach: Only allows package management commands with specific package names.
 *
 * @returns true if command is valid for bootstrap, false otherwise
 *
 * Valid examples:
 * - "bun add react"
 * - "npm install lodash@^4.17.21"
 * - "bun add @cloudflare/workers@1.0.0"
 * - "bun remove @types/node"
 * - "npm update react-dom@~18.2.0"
 * - "npm install package@>=1.0.0"
 *
 * Invalid (rejected):
 * - File operations: "rm -rf src/file.tsx", "mv file.txt", "cp -r dir"
 * - Plain installs: "bun install", "npm install"
 * - Run commands: "bun run build", "npm run dev"
 * - Any non-package-manager commands
 */
export declare function isValidBootstrapCommand(command: string): boolean;
/**
 * Check if a command should NOT be saved to bootstrap.
 * Inverse of isValidBootstrapCommand
 */
export declare function isBootstrapRuntimeCommand(command: string): boolean;
/**
 * Extract package operation key for deduplication.
 * Assumes command has already been validated by isValidBootstrapCommand.
 *
 * @example
 * getPackageOperationKey("bun add react") -> "add:react"
 * getPackageOperationKey("npm install lodash@^4.0.0") -> "install:lodash@^4.0.0"
 * getPackageOperationKey("bun add @cloudflare/workers") -> "add:@cloudflare/workers"
 */
export declare function getPackageOperationKey(command: string): string | null;
/**
 * Validate and clean bootstrap commands in a single pass.
 * Validates, deduplicates, and limits size.
 *
 * @param commands - Raw command list
 * @param maxCommands - Maximum number of commands to keep (defaults to MAX_BOOTSTRAP_COMMANDS)
 * @returns Cleaned command list with metadata about what was removed
 */
export declare function validateAndCleanBootstrapCommands(commands: string[], maxCommands?: number): {
    validCommands: string[];
    invalidCommands: string[];
    deduplicated: number;
};
export declare function looksLikeCommand(text: string): boolean;
