import { BootstrapResponse, GetInstanceResponse, BootstrapStatusResponse, ShutdownResponse, WriteFilesRequest, WriteFilesResponse, GetFilesResponse, ExecuteCommandsResponse, RuntimeErrorResponse, ClearErrorsResponse, StaticAnalysisResponse, DeploymentResult, GetLogsResponse, ListInstancesResponse } from './sandboxTypes';
import { BaseSandboxService } from './BaseSandboxService';
export { Sandbox as UserAppSandboxService, Sandbox as DeployerService } from "@cloudflare/sandbox";
/**
 * Streaming event for enhanced command execution
 */
export interface StreamEvent {
    type: 'stdout' | 'stderr' | 'exit' | 'error';
    data?: string;
    code?: number;
    error?: string;
    timestamp: Date;
}
export declare enum AllocationStrategy {
    MANY_TO_ONE = "many_to_one",
    ONE_TO_ONE = "one_to_one"
}
export declare class SandboxSdkClient extends BaseSandboxService {
    private sandbox;
    private metadataCache;
    private sessionCache;
    constructor(sandboxId: string, agentId: string);
    initialize(): Promise<void>;
    private getWranglerKVKey;
    private getSandbox;
    /**
     * Generic session getter with caching and automatic recovery
     * Properly handles existing sessions and ensures correct cwd
     */
    private getOrCreateSession;
    /**
     * Get or create a session for an instance with automatic caching.
     * Environment variables should be set via .dev.vars file.
     */
    private getInstanceSession;
    /**
     * Get or create default session for anonymous sandbox operations
     */
    private getDefaultSession;
    private executeCommand;
    /**
     * Safe wrapper for direct sandbox exec calls using default session
     */
    private safeSandboxExec;
    /**
     * Invalidate session cache (call when instance is destroyed)
     */
    private invalidateSessionCache;
    /** Write a binary file to the sandbox using small base64 chunks to avoid large control messages. */
    private writeBinaryFileViaBase64;
    /**
     * Write multiple files efficiently using a single shell script
     * Reduces 2N requests to just 2 requests regardless of file count
     * Uses base64 encoding to handle all content safely
     */
    private writeFilesViaScript;
    updateProjectName(instanceId: string, projectName: string): Promise<boolean>;
    private getInstanceMetadataFile;
    private getInstanceMetadata;
    private storeInstanceMetadata;
    private invalidateMetadataCache;
    private allocateAvailablePort;
    private checkTemplateExists;
    downloadTemplate(templateName: string, downloadDir?: string): Promise<ArrayBuffer>;
    private ensureTemplateExists;
    private buildFileTree;
    listAllInstances(): Promise<ListInstancesResponse>;
    /**
     * Waits for the development server to be ready by monitoring logs for readiness indicators
     */
    private waitForServerReady;
    private startDevServer;
    /**
     * Provisions Cloudflare resources for template placeholders in wrangler.jsonc
     */
    private provisionTemplateResources;
    private startCloudflaredTunnel;
    /**
     * Updates project configuration files with the specified project name
     */
    private updateProjectConfiguration;
    private setLocalEnvVars;
    private setupInstance;
    private fetchDontTouchFiles;
    private fetchRedactedFiles;
    createInstance(templateName: string, projectName: string, webhookUrl?: string, localEnvVars?: Record<string, string>): Promise<BootstrapResponse>;
    getInstanceDetails(instanceId: string): Promise<GetInstanceResponse>;
    getInstanceStatus(instanceId: string): Promise<BootstrapStatusResponse>;
    shutdownInstance(instanceId: string): Promise<ShutdownResponse>;
    writeFiles(instanceId: string, files: WriteFilesRequest['files']): Promise<WriteFilesResponse>;
    getFiles(templateOrInstanceId: string, filePaths?: string[], applyFilter?: boolean, redactedFiles?: string[]): Promise<GetFilesResponse>;
    getLogs(instanceId: string, onlyRecent?: boolean, durationSeconds?: number): Promise<GetLogsResponse>;
    executeCommands(instanceId: string, commands: string[], timeout?: number): Promise<ExecuteCommandsResponse>;
    getInstanceErrors(instanceId: string, clear?: boolean): Promise<RuntimeErrorResponse>;
    clearInstanceErrors(instanceId: string): Promise<ClearErrorsResponse>;
    runStaticAnalysisCode(instanceId: string): Promise<StaticAnalysisResponse>;
    private mapESLintSeverity;
    deployToCloudflareWorkers(instanceId: string): Promise<DeploymentResult>;
    /**
     * Process static assets in sandbox and create manifest for deployment
     */
    private processAssetsInSandbox;
    /**
     * Read file from sandbox as base64 and convert to Buffer
     * Uses default session for deployment file operations with absolute paths
     */
    private readFileAsBase64Buffer;
    /**
     * Get protocol for host (utility method)
     */
    private getProtocolForHost;
}
