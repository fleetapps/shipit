import { createObjectLogger } from '../../logger';
import { CloudflareAPI } from './api/cloudflare-api';
import { mergeMigrations, extractDurableObjectClasses } from './utils/index';
const logger = createObjectLogger('WorkerDeployer');
/**
 * Main deployment orchestrator for Cloudflare Workers
 * Handles both simple deployments and deployments with static assets
 */
export class WorkerDeployer {
    api;
    constructor(accountId, apiToken) {
        this.api = new CloudflareAPI(accountId, apiToken);
    }
    /**
     * Deploy a Worker with static assets
     * Handles asset upload session, batch uploads, and final deployment
     * @param fileContents Map of file paths to their contents as Buffer
     */
    async deployWithAssets(scriptName, workerContent, compatibilityDate, assetsManifest, fileContents, bindings, vars, dispatchNamespace, assetsConfig, additionalModules, compatibilityFlags, migrations) {
        logger.info('🚀 Starting deployment process...');
        logger.info(`📦 Worker: ${scriptName}`);
        if (dispatchNamespace) {
            logger.info(`🎯 Dispatch Namespace: ${dispatchNamespace}`);
        }
        // Step 1: Create asset upload session
        logger.info('\n📤 Creating asset upload session...');
        const uploadSession = await this.api.createAssetUploadSession(scriptName, assetsManifest, dispatchNamespace);
        logger.info(`✅ Upload session created with JWT token`);
        // Build maps for hash -> path and hash -> content
        const hashToPath = new Map();
        const hashToContent = new Map();
        for (const [path, info] of Object.entries(assetsManifest)) {
            hashToPath.set(info.hash, path);
            const content = fileContents.get(path);
            if (!content) {
                throw new Error(`File content not found for path: ${path}`);
            }
            hashToContent.set(info.hash, content);
        }
        // Step 2: Upload assets in batches as specified by Cloudflare
        let completionToken = uploadSession.jwt;
        if (uploadSession.buckets && uploadSession.buckets.length > 0) {
            const totalFiles = uploadSession.buckets.flat().length;
            logger.info(`\n📁 Uploading ${totalFiles} assets in ${uploadSession.buckets.length} batch(es)...`);
            for (let i = 0; i < uploadSession.buckets.length; i++) {
                const bucket = uploadSession.buckets[i];
                logger.info(`  Batch ${i + 1}/${uploadSession.buckets.length}: ${bucket.length} file(s)`);
                // Upload batch and get completion token (on last batch)
                const token = await this.api.uploadAssetBatch(uploadSession.jwt, bucket, hashToContent, hashToPath);
                if (token) {
                    completionToken = token;
                }
            }
            logger.info('✅ All assets uploaded');
        }
        else {
            logger.info('ℹ️  No new assets to upload (using cached assets)');
        }
        // Step 3: Deploy worker with assets and configuration
        logger.info('\n🔧 Deploying worker script...');
        const metadata = {
            main_module: 'index.js',
            compatibility_date: compatibilityDate,
            compatibility_flags: compatibilityFlags,
            assets: {
                jwt: completionToken,
                config: {
                    not_found_handling: assetsConfig?.not_found_handling,
                    run_worker_first: assetsConfig?.run_worker_first,
                    binding: assetsConfig?.binding,
                },
            },
            bindings: bindings || [],
        };
        // Add migrations for Durable Objects
        const mergedMigration = mergeMigrations(migrations);
        if (mergedMigration) {
            metadata.migrations = mergedMigration;
            // Extract all DO classes for exported_handlers
            const doClasses = extractDurableObjectClasses(mergedMigration);
            if (doClasses.length > 0) {
                metadata.exported_handlers = doClasses;
            }
        }
        if (vars && Object.keys(vars).length > 0) {
            metadata.vars = vars;
        }
        // Extract Durable Object class names from bindings
        const durableObjectClasses = bindings
            ?.filter((b) => b.type === 'durable_object_namespace' && b.class_name)
            .map((b) => b.class_name);
        await this.api.deployWorker(scriptName, metadata, workerContent, dispatchNamespace, additionalModules, durableObjectClasses);
    }
    /**
     * Deploy a Worker without static assets
     * Simple deployment with just the worker script
     */
    async deploySimple(scriptName, workerContent, compatibilityDate, bindings, vars, dispatchNamespace, additionalModules, compatibilityFlags, migrations) {
        logger.info('🚀 Starting simple deployment (no assets)...');
        logger.info(`📦 Worker: ${scriptName}`);
        if (dispatchNamespace) {
            logger.info(`🎯 Dispatch Namespace: ${dispatchNamespace}`);
        }
        const metadata = {
            main_module: 'index.js',
            compatibility_date: compatibilityDate,
            compatibility_flags: compatibilityFlags,
            bindings: bindings || [],
        };
        // Add migrations for Durable Objects
        const mergedMigration = mergeMigrations(migrations);
        if (mergedMigration) {
            metadata.migrations = mergedMigration;
            // Extract all DO classes for exported_handlers
            const doClasses = extractDurableObjectClasses(mergedMigration);
            if (doClasses.length > 0) {
                metadata.exported_handlers = doClasses;
            }
        }
        if (vars && Object.keys(vars).length > 0) {
            metadata.vars = vars;
        }
        // Extract Durable Object class names from bindings
        const durableObjectClasses = bindings
            ?.filter((b) => b.type === 'durable_object_namespace' && b.class_name)
            .map((b) => b.class_name);
        await this.api.deployWorker(scriptName, metadata, workerContent, dispatchNamespace, additionalModules, durableObjectClasses);
    }
}
