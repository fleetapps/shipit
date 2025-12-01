import { DeployConfig, DispatchDeployConfig, WranglerConfig } from './types';
/**
 * Pure deployment configuration builder
 * Transforms Wrangler config into deployment-ready configuration
 */
export declare function buildDeploymentConfig(config: WranglerConfig, workerContent: string, accountId: string, apiToken: string, assetsManifest?: Record<string, {
    hash: string;
    size: number;
}>, compatibilityFlags?: string[]): DeployConfig;
/**
 * Pure function to parse wrangler configuration from content string
 */
export declare function parseWranglerConfig(configContent: string): WranglerConfig;
/**
 * Deploy a Cloudflare Worker with the provided configuration and assets
 */
export declare function deployWorker(deployConfig: DeployConfig, fileContents?: Map<string, Buffer>, additionalModules?: Map<string, string>, migrations?: WranglerConfig['migrations'], assetsConfig?: WranglerConfig['assets'], dispatchNamespace?: string): Promise<void>;
/**
 * Deploy to Workers for Platforms (Dispatch namespace)
 */
export declare function deployToDispatch(deployConfig: DispatchDeployConfig, fileContents?: Map<string, Buffer>, additionalModules?: Map<string, string>, migrations?: WranglerConfig['migrations'], assetsConfig?: WranglerConfig['assets']): Promise<void>;
