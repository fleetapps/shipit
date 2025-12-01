import { AssetManifest, UploadAssetSession, WorkerMetadata } from '../types';
/**
 * Cloudflare API client for Worker deployment operations
 */
export declare class CloudflareAPI {
    private readonly accountId;
    private readonly apiToken;
    private readonly baseUrl;
    constructor(accountId: string, apiToken: string);
    /**
     * Generate request headers with authorization
     */
    private getHeaders;
    /**
     * Create an asset upload session with Cloudflare
     * Returns JWT token and list of files that need uploading
     */
    createAssetUploadSession(scriptName: string, manifest: AssetManifest, dispatchNamespace?: string): Promise<UploadAssetSession>;
    /**
     * Upload a batch of assets to Cloudflare
     * Returns completion token if this is the last batch
     */
    uploadAssetBatch(uploadToken: string, fileHashesToUpload: string[], fileContents: Map<string, Buffer>, hashToPath: Map<string, string>): Promise<string | null>;
    /**
     * Deploy a Worker script to Cloudflare
     * Includes metadata, bindings, and assets configuration
     */
    deployWorker(scriptName: string, metadata: WorkerMetadata, workerContent: string, dispatchNamespace?: string, additionalModules?: Map<string, string>, durableObjectClasses?: string[]): Promise<void>;
    /**
     * Test a deployed Worker by making a request to its endpoint
     */
    testWorkerEndpoint(workerUrl: string): Promise<void>;
}
