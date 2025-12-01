import { WorkerDeployer } from './deployer';
import { validateConfig, buildWorkerBindings, } from './utils/index';
import { parse } from 'jsonc-parser';
/**
 * Pure deployment configuration builder
 * Transforms Wrangler config into deployment-ready configuration
 */
export function buildDeploymentConfig(config, workerContent, accountId, apiToken, assetsManifest, compatibilityFlags) {
    const hasAssets = assetsManifest && Object.keys(assetsManifest).length > 0;
    const bindings = buildWorkerBindings(config, hasAssets);
    return {
        accountId,
        apiToken,
        scriptName: config.name,
        compatibilityDate: config.compatibility_date,
        compatibilityFlags: compatibilityFlags || config.compatibility_flags,
        workerContent,
        assets: assetsManifest,
        bindings: bindings.length > 0 ? bindings : undefined,
        vars: config.vars,
    };
}
/**
 * Pure function to parse wrangler configuration from content string
 */
export function parseWranglerConfig(configContent) {
    const config = parse(configContent);
    validateConfig(config);
    return config;
}
/**
 * Deploy a Cloudflare Worker with the provided configuration and assets
 */
export async function deployWorker(deployConfig, fileContents, additionalModules, migrations, assetsConfig, dispatchNamespace) {
    const deployer = new WorkerDeployer(deployConfig.accountId, deployConfig.apiToken);
    if (deployConfig.assets && fileContents) {
        await deployer.deployWithAssets(deployConfig.scriptName, deployConfig.workerContent, deployConfig.compatibilityDate, deployConfig.assets, fileContents, deployConfig.bindings, deployConfig.vars, dispatchNamespace, assetsConfig, additionalModules, deployConfig.compatibilityFlags, migrations);
    }
    else {
        await deployer.deploySimple(deployConfig.scriptName, deployConfig.workerContent, deployConfig.compatibilityDate, deployConfig.bindings, deployConfig.vars, dispatchNamespace, additionalModules, deployConfig.compatibilityFlags, migrations);
    }
}
/**
 * Deploy to Workers for Platforms (Dispatch namespace)
 */
export async function deployToDispatch(deployConfig, fileContents, additionalModules, migrations, assetsConfig) {
    await deployWorker(deployConfig, fileContents, additionalModules, migrations, assetsConfig, deployConfig.dispatchNamespace);
}
