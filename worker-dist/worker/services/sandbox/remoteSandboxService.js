import { BootstrapResponseSchema, GetInstanceResponseSchema, BootstrapStatusResponseSchema, WriteFilesResponseSchema, GetFilesResponseSchema, ExecuteCommandsResponseSchema, RuntimeErrorResponseSchema, ClearErrorsResponseSchema, DeploymentResultSchema, ShutdownResponseSchema, StaticAnalysisResponseSchema, GitHubPushResponseSchema, } from './sandboxTypes';
import { BaseSandboxService } from "./BaseSandboxService";
import { env } from 'cloudflare:workers';
export async function runnerFetch(url, method, headers, body) {
    // Use direct fetch for runner service communication
    return await fetch(url, { method, headers, body });
}
/**
 * Client for interacting with the Runner Service API.
 */
export class RemoteSandboxServiceClient extends BaseSandboxService {
    static sandboxServiceUrl;
    static token;
    static init(sandboxServiceUrl, token) {
        RemoteSandboxServiceClient.sandboxServiceUrl = sandboxServiceUrl;
        RemoteSandboxServiceClient.token = token;
    }
    constructor(sandboxId) {
        super(sandboxId);
        this.logger.info('RemoteSandboxServiceClient initialized', { sandboxId: this.sandboxId });
    }
    async makeRequest(endpoint, method, schema, body, resetPrevious = false) {
        const url = `${RemoteSandboxServiceClient.sandboxServiceUrl}${endpoint}`;
        try {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            headers.set('Authorization', `Bearer ${RemoteSandboxServiceClient.token}`);
            headers.set('x-session-id', this.sandboxId);
            if (resetPrevious) {
                headers.set('x-container-action', 'reset');
            }
            const response = await runnerFetch(url, method, headers, body ? JSON.stringify(body) : undefined);
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error('Runner service request failed', {
                    status: response.status,
                    statusText: response.statusText,
                    errorText,
                    url
                });
                return {
                    success: false,
                    error: errorText
                };
            }
            const responseData = await response.json();
            if (!schema)
                return responseData;
            const validation = schema.safeParse(responseData);
            if (!validation.success) {
                this.logger.error('Failed to validate response from runner service', validation.error.errors, { url, responseData });
                return {
                    success: false,
                    error: "Failed to validate response"
                };
            }
            // this.logger.info('Response validated', { url });
            return validation.data;
        }
        catch (error) {
            this.logger.error('Error making request to runner service', error, { url });
            return {
                success: false,
                error: "Failed to validate response"
            };
        }
    }
    /**
     * Create a new runner instance.
     */
    async createInstance(templateName, projectName, webhookUrl, localEnvVars) {
        const requestBody = {
            templateName,
            projectName,
            ...(webhookUrl && { webhookUrl }),
            ...(localEnvVars && { envVars: localEnvVars })
        };
        return this.makeRequest('/instances', 'POST', BootstrapResponseSchema, requestBody);
    }
    /**
     * Get details for a specific runner instance.
     */
    async getInstanceDetails(instanceId) {
        return this.makeRequest(`/instances/${instanceId}`, 'GET', GetInstanceResponseSchema);
    }
    /**
     * Get status for a specific runner instance.
     */
    async getInstanceStatus(instanceId) {
        return this.makeRequest(`/instances/${instanceId}/status`, 'GET', BootstrapStatusResponseSchema);
    }
    /**
     * Write files to a runner instance.
     */
    async writeFiles(instanceId, files, commitMessage) {
        const requestBody = { files, commitMessage };
        return this.makeRequest(`/instances/${instanceId}/files`, 'POST', WriteFilesResponseSchema, requestBody);
    }
    /**
     * Get specific files from a runner instance.
     * @param instanceId The ID of the runner instance.
     * @param filePaths An optional array of file paths to retrieve.
     */
    async getFiles(instanceId, filePaths) {
        // Build query params if filePaths are provided
        const queryParams = filePaths && filePaths.length > 0 ? `?filePaths=${encodeURIComponent(JSON.stringify(filePaths))}` : '';
        return this.makeRequest(`/instances/${instanceId}/files${queryParams}`, 'GET', GetFilesResponseSchema);
    }
    /**
     * Execute commands in a runner instance.
     */
    async executeCommands(instanceId, commands, timeout) {
        const requestBody = { commands, timeout };
        return this.makeRequest(`/instances/${instanceId}/commands`, 'POST', ExecuteCommandsResponseSchema, requestBody);
    }
    /**
     * Get runtime errors from a runner instance.
     */
    async getInstanceErrors(instanceId) {
        return this.makeRequest(`/instances/${instanceId}/errors`, 'GET', RuntimeErrorResponseSchema);
    }
    async clearInstanceErrors(instanceId) {
        return this.makeRequest(`/instances/${instanceId}/errors`, 'DELETE', ClearErrorsResponseSchema);
    }
    /**
     * Perform static code analysis on a runner instance to find potential issues.
     * @param instanceId The ID of the runner instance
     * @param files Optional comma-separated list of specific files to lint
     */
    async runStaticAnalysisCode(instanceId, lintFiles) {
        const queryParams = lintFiles?.length ? `?files=${lintFiles.join(',')}` : '';
        return this.makeRequest(`/instances/${instanceId}/analysis${queryParams}`, 'GET', StaticAnalysisResponseSchema);
    }
    /**
     * Deploy a runner instance to Cloudflare Workers.
     * @param instanceId The ID of the runner instance to deploy
     * @param credentials Optional Cloudflare deployment credentials
     */
    async deployToCloudflareWorkers(instanceId) {
        return this.makeRequest(`/instances/${instanceId}/deploy`, 'POST', DeploymentResultSchema);
    }
    /**
     * Shutdown a runner instance.
     */
    async shutdownInstance(instanceId) {
        return this.makeRequest(`/instances/${instanceId}`, 'DELETE', ShutdownResponseSchema);
    }
    /**
     * Push instance files to existing GitHub repository
     */
    async pushToGitHub(instanceId, request, files) {
        return this.makeRequest(`/instances/${instanceId}/github/push`, 'POST', GitHubPushResponseSchema, { request, files });
    }
    /**
     * Initialize the client (no-op for remote client)
     */
    async initialize() {
        // No initialization needed for remote client
        this.logger.info('Remote sandbox service client initialized', { sandboxId: this.sandboxId });
    }
    /**
     * List all instances across all sessions
     */
    async listAllInstances() {
        return this.makeRequest('/instances', 'GET');
    }
    async updateProjectName(instanceId, projectName) {
        return this.makeRequest(`/instances/${instanceId}/name`, 'POST', undefined, { projectName });
    }
    /**
     * Get logs from a runner instance
     */
    async getLogs(instanceId, onlyRecent, durationSeconds) {
        const params = new URLSearchParams();
        if (onlyRecent)
            params.append('reset', 'true');
        if (durationSeconds)
            params.append('duration', durationSeconds.toString());
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return this.makeRequest(`/instances/${instanceId}/logs${queryString}`, 'GET');
    }
    // temp, debug
    async writeFileLogs(logName, log) {
        return this.makeRequest('/logs', 'POST', undefined, { logName, log });
    }
}
RemoteSandboxServiceClient.init(env.SANDBOX_SERVICE_URL, env.SANDBOX_SERVICE_API_KEY);
