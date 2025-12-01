/**
 * Calculate SHA256 hash of content (first 32 chars)
 * This matches Cloudflare's expected hash format
 */
export declare function calculateFileHash(content: ArrayBuffer): Promise<string>;
/**
 * Determine MIME type based on file extension
 * Critical for proper asset serving in browsers
 */
export declare function getMimeType(filePath: string): string;
/**
 * Validate required configuration fields
 */
export declare function validateConfig(config: any): void;
/**
 * Create an asset manifest from file data
 */
export declare function createAssetManifest(files: Map<string, ArrayBuffer>): Promise<Record<string, {
    hash: string;
    size: number;
}>>;
/**
 * Merge migration configurations
 */
export declare function mergeMigrations(migrations: any[] | undefined): any | null;
/**
 * Extract Durable Object class names from merged migration
 */
export declare function extractDurableObjectClasses(mergedMigration: any): string[];
/**
 * Build worker bindings from Wrangler configuration
 * DRY implementation to avoid code duplication
 */
export declare function buildWorkerBindings(config: any, hasAssets?: boolean): any[];
