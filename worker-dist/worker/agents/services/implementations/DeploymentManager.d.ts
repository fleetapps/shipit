import { IDeploymentManager, DeploymentResult, SandboxDeploymentCallbacks, CloudflareDeploymentCallbacks } from '../interfaces/IDeploymentManager';
import { StaticAnalysisResponse, RuntimeError, PreviewType } from '../../../services/sandbox/sandboxTypes';
import { FileOutputType } from '../../schemas';
import { BaseAgentService } from './BaseAgentService';
import { ServiceOptions } from '../interfaces/IServiceOptions';
import { BaseSandboxService } from '../../../services/sandbox/BaseSandboxService';
/**
 * Manages deployment operations for sandbox instances
 * Handles instance creation, file deployment, analysis, and GitHub/Cloudflare export
 * Also manages sessionId and health check intervals
 */
export declare class DeploymentManager extends BaseAgentService implements IDeploymentManager {
    private maxCommandsHistory;
    private healthCheckInterval;
    private currentDeploymentPromise;
    private cachedSandboxClient;
    constructor(options: ServiceOptions, maxCommandsHistory: number);
    /**
     * Get current session ID from state
     */
    getSessionId(): string;
    /**
     * Cache is tied to current sessionId and invalidated on reset
     */
    getClient(): BaseSandboxService;
    /**
     * Reset session ID (called on timeout or specific errors)
     */
    resetSessionId(): void;
    static generateNewSessionId(): string;
    /**
     * Wait for preview to be ready
     */
    waitForPreview(): Promise<void>;
    /**
     * Execute setup commands (used during redeployment)
     * @param onAfterCommands Optional callback invoked after commands complete (e.g., for syncing package.json)
     */
    executeSetupCommands(sandboxInstanceId: string, timeoutMs?: number, onAfterCommands?: () => Promise<void>): Promise<void>;
    /**
     * Start health check interval for instance
     */
    private startHealthCheckInterval;
    private clearHealthCheckInterval;
    /**
     * Run static analysis (lint + typecheck) on code
     */
    runStaticAnalysis(files?: string[]): Promise<StaticAnalysisResponse>;
    /**
     * Fetch runtime errors from sandbox instance
     */
    fetchRuntimeErrors(clear?: boolean): Promise<RuntimeError[]>;
    /**
     * Main deployment method
     * Callbacks allow agent to broadcast at the right times
     * All concurrent callers share the same promise and wait together
     * Retries indefinitely until success or master timeout (5 minutes)
     */
    deployToSandbox(files?: FileOutputType[], redeploy?: boolean, commitMessage?: string, clearLogs?: boolean, callbacks?: SandboxDeploymentCallbacks): Promise<PreviewType | null>;
    /**
     * Execute deployment with infinite retry until success
     * Each attempt has its own timeout
     * Resets sessionId after consecutive failures
     */
    private executeDeploymentWithRetry;
    /**
     * Deploy files to sandbox instance (core deployment)
     */
    private deploy;
    /**
     * Ensure sandbox instance exists and is healthy
     */
    ensureInstance(redeploy: boolean): Promise<DeploymentResult>;
    /**
     * Create new sandbox instance
     */
    private createNewInstance;
    /**
     * Determine which files to deploy
     */
    private getFilesToDeploy;
    /**
     * Deploy to Cloudflare Workers
     * Returns deployment URL and deployment ID for database updates
     */
    deployToCloudflare(callbacks?: CloudflareDeploymentCallbacks): Promise<{
        deploymentUrl: string | null;
        deploymentId?: string;
    }>;
}
