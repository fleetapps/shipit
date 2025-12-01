import { TemplateListResponse, TemplateDetailsResponse, GetInstanceResponse, BootstrapStatusResponse, ShutdownResponse, WriteFilesRequest, WriteFilesResponse, GetFilesResponse, ExecuteCommandsResponse, RuntimeErrorResponse, ClearErrorsResponse, StaticAnalysisResponse, DeploymentResult, BootstrapResponse, GetLogsResponse, ListInstancesResponse } from './sandboxTypes';
import { StructuredLogger } from '../../logger';
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
export interface TemplateInfo {
    name: string;
    language?: string;
    frameworks?: string[];
    description: {
        selection: string;
        usage: string;
    };
}
/**
 * Abstract base class providing complete RunnerService API compatibility
 * All implementations MUST support every method defined here
*/
export declare abstract class BaseSandboxService {
    protected logger: StructuredLogger;
    protected sandboxId: string;
    constructor(sandboxId: string);
    abstract initialize(): Promise<void>;
    /**
     * List all available templates
     * Returns: { success: boolean, templates: [...], count: number, error?: string }
     */
    static listTemplates(): Promise<TemplateListResponse>;
    /**
     * Get details for a specific template - fully in-memory, no sandbox operations
     * Downloads zip from R2, extracts in memory, and returns all files with metadata
     * Returns: { success: boolean, templateDetails?: {...}, error?: string }
     */
    static getTemplateDetails(templateName: string, downloadDir?: string): Promise<TemplateDetailsResponse>;
    /**
     * Create a new instance from a template
     * Returns: { success: boolean, instanceId?: string, error?: string }
     */
    abstract createInstance(templateName: string, projectName: string, webhookUrl?: string, localEnvVars?: Record<string, string>): Promise<BootstrapResponse>;
    /**
     * List all instances across all sessions
     * Returns: { success: boolean, instances: [...], count: number, error?: string }
     */
    abstract listAllInstances(): Promise<ListInstancesResponse>;
    /**
     * Get detailed information about an instance
     * Returns: { success: boolean, instance?: {...}, error?: string }
     */
    abstract getInstanceDetails(instanceId: string): Promise<GetInstanceResponse>;
    /**
     * Get current status of an instance
     * Returns: { success: boolean, pending: boolean, message?: string, previewURL?: string, error?: string }
     */
    abstract getInstanceStatus(instanceId: string): Promise<BootstrapStatusResponse>;
    /**
     * Shutdown and cleanup an instance
     * Returns: { success: boolean, message?: string, error?: string }
     */
    abstract shutdownInstance(instanceId: string): Promise<ShutdownResponse>;
    /**
     * Write multiple files to an instance
     * Returns: { success: boolean, message?: string, results: [...], error?: string }
     */
    abstract writeFiles(instanceId: string, files: WriteFilesRequest['files'], commitMessage?: string): Promise<WriteFilesResponse>;
    /**
     * Read specific files from an instance
     * Returns: { success: boolean, files: [...], errors?: [...], error?: string }
     */
    abstract getFiles(instanceId: string, filePaths?: string[]): Promise<GetFilesResponse>;
    abstract getLogs(instanceId: string, onlyRecent?: boolean, durationSeconds?: number): Promise<GetLogsResponse>;
    /**
     * Execute multiple commands sequentially with optional timeout
     * Returns: { success: boolean, results: [...], message?: string, error?: string }
     */
    abstract executeCommands(instanceId: string, commands: string[], timeout?: number): Promise<ExecuteCommandsResponse>;
    abstract updateProjectName(instanceId: string, projectName: string): Promise<boolean>;
    /**
     * Get all runtime errors from an instance
     * Returns: { success: boolean, errors: [...], hasErrors: boolean, error?: string }
     */
    abstract getInstanceErrors(instanceId: string, clear?: boolean): Promise<RuntimeErrorResponse>;
    /**
     * Clear all runtime errors from an instance
     * Returns: { success: boolean, message?: string, error?: string }
     */
    abstract clearInstanceErrors(instanceId: string): Promise<ClearErrorsResponse>;
    /**
     * Run static analysis (linting + type checking) on instance code
     * Returns: { success: boolean, lint: {...}, typecheck: {...}, error?: string }
     */
    abstract runStaticAnalysisCode(instanceId: string, lintFiles?: string[]): Promise<StaticAnalysisResponse>;
    /**
     * Deploy instance to Cloudflare Workers
     * Returns: { success: boolean, message: string, deployedUrl?: string, deploymentId?: string, error?: string }
     */
    abstract deployToCloudflareWorkers(instanceId: string): Promise<DeploymentResult>;
}
