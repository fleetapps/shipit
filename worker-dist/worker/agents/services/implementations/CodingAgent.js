import { WebSocketMessageResponses } from "worker/agents/constants";
/*
* CodingAgentInterface - stub for passing to tool calls
*/
export class CodingAgentInterface {
    agentStub;
    constructor(agentStub) {
        this.agentStub = agentStub;
    }
    getLogs(reset, durationSeconds) {
        return this.agentStub.getLogs(reset, durationSeconds);
    }
    fetchRuntimeErrors(clear) {
        return this.agentStub.fetchRuntimeErrors(clear);
    }
    async deployPreview(clearLogs = true, forceRedeploy = false) {
        const response = await this.agentStub.deployToSandbox([], forceRedeploy, undefined, clearLogs);
        // Send a message to refresh the preview
        if (response && response.previewURL) {
            this.agentStub.broadcast(WebSocketMessageResponses.PREVIEW_FORCE_REFRESH, {});
            return `Deployment successful: ${response.previewURL}`;
        }
        else {
            return `Failed to deploy: ${response?.tunnelURL}`;
        }
    }
    async deployToCloudflare() {
        const response = await this.agentStub.deployToCloudflare();
        if (response && response.deploymentUrl) {
            return `Deployment successful: ${response.deploymentUrl}`;
        }
        else {
            return `Failed to deploy: ${response?.workersUrl}`;
        }
    }
    queueRequest(request, images) {
        this.agentStub.queueUserRequest(request, images);
    }
    clearConversation() {
        this.agentStub.clearConversation();
    }
    getOperationOptions() {
        return this.agentStub.getOperationOptions();
    }
    getGit() {
        return this.agentStub.getGit();
    }
    updateProjectName(newName) {
        return this.agentStub.updateProjectName(newName);
    }
    updateBlueprint(patch) {
        return this.agentStub.updateBlueprint(patch);
    }
    // Generic debugging helpers — delegate to underlying agent
    readFiles(paths) {
        return this.agentStub.readFiles(paths);
    }
    runStaticAnalysisCode(files) {
        return this.agentStub.runStaticAnalysisCode(files);
    }
    execCommands(commands, shouldSave, timeout) {
        return this.agentStub.execCommands(commands, shouldSave, timeout);
    }
    // Exposes a simplified regenerate API for tools
    regenerateFile(path, issues) {
        return this.agentStub.regenerateFileByPath(path, issues);
    }
    // Exposes file generation via phase implementation
    generateFiles(phaseName, phaseDescription, requirements, files) {
        return this.agentStub.generateFiles(phaseName, phaseDescription, requirements, files);
    }
    isCodeGenerating() {
        return this.agentStub.isCodeGenerating();
    }
    waitForGeneration() {
        return this.agentStub.waitForGeneration();
    }
    isDeepDebugging() {
        return this.agentStub.isDeepDebugging();
    }
    waitForDeepDebug() {
        return this.agentStub.waitForDeepDebug();
    }
    executeDeepDebug(issue, toolRenderer, streamCb, focusPaths) {
        return this.agentStub.executeDeepDebug(issue, toolRenderer, streamCb, focusPaths);
    }
}
