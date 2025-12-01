import { AssetManifest, WorkerBinding, WranglerConfig } from './types';
/**
 * Main deployment orchestrator for Cloudflare Workers
 * Handles both simple deployments and deployments with static assets
 */
export declare class WorkerDeployer {
    private readonly api;
    constructor(accountId: string, apiToken: string);
    /**
     * Deploy a Worker with static assets
     * Handles asset upload session, batch uploads, and final deployment
     * @param fileContents Map of file paths to their contents as Buffer
     */
    deployWithAssets(scriptName: string, workerContent: string, compatibilityDate: string, assetsManifest: AssetManifest, fileContents: Map<string, Buffer>, bindings?: WorkerBinding[], vars?: Record<string, string>, dispatchNamespace?: string, assetsConfig?: WranglerConfig['assets'], additionalModules?: Map<string, string>, compatibilityFlags?: string[], migrations?: WranglerConfig['migrations']): Promise<void>;
    /**
     * Deploy a Worker without static assets
     * Simple deployment with just the worker script
     */
    deploySimple(scriptName: string, workerContent: string, compatibilityDate: string, bindings?: WorkerBinding[], vars?: Record<string, string>, dispatchNamespace?: string, additionalModules?: Map<string, string>, compatibilityFlags?: string[], migrations?: WranglerConfig['migrations']): Promise<void>;
}
