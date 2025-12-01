import { Agent, AgentContext, Connection, ConnectionContext } from 'agents';
import { Blueprint, PhaseConceptGenerationSchemaType, PhaseConceptType, FileConceptType, FileOutputType, PhaseImplementationSchemaType } from '../schemas';
import { ExecuteCommandsResponse, GitHubPushRequest, PreviewType, StaticAnalysisResponse, TemplateDetails } from '../../services/sandbox/sandboxTypes';
import { GitHubExportResult } from '../../services/github/types';
import { CodeGenState, CurrentDevState } from './state';
import { AllIssues, AgentSummary, AgentInitArgs, PhaseExecutionResult, UserContext } from './types';
import { StructuredLogger } from '../../logger';
import { ProjectSetupAssistant } from '../assistants/projectsetup';
import { UserConversationProcessor, RenderToolCall } from '../operations/UserConversationProcessor';
import { FileManager } from '../services/implementations/FileManager';
import { StateManager } from '../services/implementations/StateManager';
import { DeploymentManager } from '../services/implementations/DeploymentManager';
import { PhaseImplementationOperation } from '../operations/PhaseImplementation';
import { FileRegenerationOperation } from '../operations/FileRegeneration';
import { PhaseGenerationOperation } from '../operations/PhaseGeneration';
import { ScreenshotAnalysisOperation } from '../operations/ScreenshotAnalysis';
import { BaseSandboxService } from '../../services/sandbox/BaseSandboxService';
import { WebSocketMessageData, WebSocketMessageType } from '../../api/websocketTypes';
import { InferenceContext } from '../inferutils/config.types';
import { GitVersionControl } from '../git';
import { FastCodeFixerOperation } from '../operations/PostPhaseCodeFixer';
import { ImageAttachment, type ProcessedImageAttachment } from '../../types/image-attachment';
import { OperationOptions } from '../operations/common';
import { CodingAgentInterface } from '../services/implementations/CodingAgent';
import { ConversationMessage, ConversationState } from '../inferutils/common';
import { DeepDebugResult } from './types';
interface Operations {
    regenerateFile: FileRegenerationOperation;
    generateNextPhase: PhaseGenerationOperation;
    analyzeScreenshot: ScreenshotAnalysisOperation;
    implementPhase: PhaseImplementationOperation;
    fastCodeFixer: FastCodeFixerOperation;
    processUserMessage: UserConversationProcessor;
}
/**
 * SimpleCodeGeneratorAgent - Deterministically orchestrated agent
 *
 * Manages the lifecycle of code generation including:
 * - Blueprint, phase generation, phase implementation, review cycles orchestrations
 * - File streaming with WebSocket updates
 * - Code validation and error correction
 * - Deployment to sandbox service
 */
export declare class SimpleCodeGeneratorAgent extends Agent<Env, CodeGenState> {
    private static readonly MAX_COMMANDS_HISTORY;
    private static readonly PROJECT_NAME_PREFIX_MAX_LENGTH;
    protected projectSetupAssistant: ProjectSetupAssistant | undefined;
    protected stateManager: StateManager;
    protected fileManager: FileManager;
    protected codingAgent: CodingAgentInterface;
    protected deploymentManager: DeploymentManager;
    protected git: GitVersionControl;
    private previewUrlCache;
    private templateDetailsCache;
    private pendingUserImages;
    private generationPromise;
    private currentAbortController?;
    private deepDebugPromise;
    private deepDebugConversationId;
    private githubTokenCache;
    protected operations: Operations;
    _logger: StructuredLogger | undefined;
    private initLogger;
    logger(): StructuredLogger;
    getAgentId(): string;
    initialState: CodeGenState;
    constructor(ctx: AgentContext, env: Env);
    /**
     * Initialize the code generator with project blueprint and template
     * Sets up services and begins deployment process
     */
    initialize(initArgs: AgentInitArgs, ..._args: unknown[]): Promise<CodeGenState>;
    private initializeAsync;
    isInitialized(): Promise<boolean>;
    onStart(props?: Record<string, unknown> | undefined): Promise<void>;
    private gitInit;
    onStateUpdate(_state: CodeGenState, _source: "server" | Connection): void;
    setState(state: CodeGenState): void;
    onConnect(connection: Connection, ctx: ConnectionContext): void;
    ensureTemplateDetails(): Promise<{
        name: string;
        description: {
            selection: string;
            usage: string;
        };
        fileTree: import("../../services/sandbox/sandboxTypes").FileTreeNode;
        allFiles: Record<string, string>;
        deps: Record<string, string>;
        importantFiles: string[];
        dontTouchFiles: string[];
        redactedFiles: string[];
        frameworks?: string[] | undefined;
        language?: string | undefined;
    }>;
    private getTemplateDetails;
    /**
     * Update bootstrap script when commands history changes
     * Called after significant command executions
     */
    private updateBootstrapScript;
    getConversationState(id?: string): ConversationState;
    setConversationState(conversations: ConversationState): void;
    addConversationMessage(message: ConversationMessage): void;
    private saveToDatabase;
    getPreviewUrlCache(): string;
    getProjectSetupAssistant(): ProjectSetupAssistant;
    getSessionId(): string;
    getSandboxServiceClient(): BaseSandboxService;
    getGit(): GitVersionControl;
    isCodeGenerating(): boolean;
    rechargePhasesCounter(max_phases?: number): void;
    decrementPhasesCounter(): number;
    getPhasesCounter(): number;
    getOperationOptions(): OperationOptions;
    /**
     * Gets or creates an abort controller for the current operation
     * Reuses existing controller for nested operations (e.g., tool calling)
     */
    protected getOrCreateAbortController(): AbortController;
    /**
     * Cancels the current inference operation if any
     */
    cancelCurrentInference(): boolean;
    /**
     * Clears abort controller after successful completion
     */
    protected clearAbortController(): void;
    /**
     * Gets inference context with abort signal
     * Reuses existing abort controller for nested operations
     */
    protected getInferenceContext(): InferenceContext;
    private createNewIncompletePhase;
    private markPhaseComplete;
    private broadcastError;
    generateReadme(): Promise<void>;
    queueUserRequest(request: string, images?: ProcessedImageAttachment[]): Promise<void>;
    private fetchPendingUserRequests;
    /**
     * State machine controller for code generation with user interaction support
     * Executes phases sequentially with review cycles and proper state transitions
     */
    generateAllFiles(reviewCycles?: number): Promise<void>;
    private launchStateMachine;
    /**
     * Execute phase generation state - generate next phase with user suggestions
     */
    executePhaseGeneration(): Promise<PhaseExecutionResult>;
    /**
     * Execute phase implementation state - implement current phase
     */
    executePhaseImplementation(phaseConcept?: PhaseConceptType, staticAnalysis?: StaticAnalysisResponse, userContext?: UserContext): Promise<{
        currentDevState: CurrentDevState;
        staticAnalysis?: StaticAnalysisResponse;
    }>;
    /**
     * Execute review cycle state - review and cleanup
     */
    executeReviewCycle(): Promise<CurrentDevState>;
    /**
     * Execute finalizing state - final review and cleanup (runs only once)
     */
    executeFinalizing(): Promise<CurrentDevState>;
    executeDeepDebug(issue: string, toolRenderer: RenderToolCall, streamCb: (chunk: string) => void, focusPaths?: string[]): Promise<DeepDebugResult>;
    /**
     * Generate next phase with user context (suggestions and images)
     */
    generateNextPhase(currentIssues: AllIssues, userContext?: UserContext): Promise<PhaseConceptGenerationSchemaType | undefined>;
    /**
     * Implement a single phase of code generation
     * Streams file generation with real-time updates and incorporates technical instructions
     */
    implementPhase(phase: PhaseConceptType, currentIssues: AllIssues, userContext?: UserContext, streamChunks?: boolean, postPhaseFixing?: boolean): Promise<PhaseImplementationSchemaType>;
    /**
     * Get current model configurations (defaults + user overrides)
     * Used by WebSocket to provide configuration info to frontend
     */
    getModelConfigsInfo(): Promise<{
        agents: {
            key: string;
            name: any;
            description: any;
        }[];
        userConfigs: Record<string, any>;
        defaultConfigs: Record<string, any>;
    }>;
    getTotalFiles(): number;
    getSummary(): Promise<AgentSummary>;
    getFullState(): Promise<CodeGenState>;
    private migrateStateIfNeeded;
    getFileGenerated(filePath: string): {
        filePath: string;
        fileContents: string;
        filePurpose: string;
    } | null;
    getWebSockets(): WebSocket[];
    fetchRuntimeErrors(clear?: boolean): Promise<{
        level: number;
        message: string;
        timestamp: string;
        rawOutput: string;
    }[]>;
    /**
     * Perform static code analysis on the generated files
     * This helps catch potential issues early in the development process
     */
    runStaticAnalysisCode(files?: string[]): Promise<StaticAnalysisResponse>;
    private applyFastSmartCodeFixes;
    /**
     * Apply deterministic code fixes for common TypeScript errors
     */
    private applyDeterministicCodeFixes;
    fetchAllIssues(resetIssues?: boolean): Promise<AllIssues>;
    updateProjectName(newName: string): Promise<boolean>;
    updateBlueprint(patch: Partial<Blueprint>): Promise<Blueprint>;
    readFiles(paths: string[]): Promise<{
        files: {
            path: string;
            content: string;
        }[];
    }>;
    execCommands(commands: string[], shouldSave: boolean, timeout?: number): Promise<ExecuteCommandsResponse>;
    /**
     * Regenerate a file to fix identified issues
     * Retries up to 3 times before giving up
     */
    regenerateFile(file: FileOutputType, issues: string[], retryIndex?: number): Promise<import("./state").FileState>;
    regenerateFileByPath(path: string, issues: string[]): Promise<{
        path: string;
        diff: string;
    }>;
    generateFiles(phaseName: string, phaseDescription: string, requirements: string[], files: FileConceptType[]): Promise<{
        files: Array<{
            path: string;
            purpose: string;
            diff: string;
        }>;
    }>;
    deployToSandbox(files?: FileOutputType[], redeploy?: boolean, commitMessage?: string, clearLogs?: boolean): Promise<PreviewType | null>;
    /**
     * Deploy the generated code to Cloudflare Workers
     */
    deployToCloudflare(): Promise<{
        deploymentUrl?: string;
        workersUrl?: string;
    } | null>;
    waitForGeneration(): Promise<void>;
    isDeepDebugging(): boolean;
    getDeepDebugSessionState(): {
        conversationId: string;
    } | null;
    waitForDeepDebug(): Promise<void>;
    /**
     * Cache GitHub OAuth token in memory for subsequent exports
     * Token is ephemeral - lost on DO eviction
     */
    setGitHubToken(token: string, username: string, ttl?: number): void;
    /**
     * Get cached GitHub token if available and not expired
     */
    getGitHubToken(): {
        token: string;
        username: string;
    } | null;
    /**
     * Clear cached GitHub token
     */
    clearGitHubToken(): void;
    onMessage(connection: Connection, message: string): Promise<void>;
    onClose(connection: Connection): Promise<void>;
    private onProjectUpdate;
    private getAndResetProjectUpdates;
    broadcast<T extends WebSocketMessageType>(msg: T, data?: WebSocketMessageData<T>): void;
    private getBootstrapCommands;
    private saveExecutedCommands;
    /**
     * Execute commands with retry logic
     * Chunks commands and retries failed ones with AI assistance
     */
    private executeCommands;
    /**
     * Sync package.json from sandbox to agent's git repository
     * Called after install/add/remove commands to keep dependencies in sync
     */
    private syncPackageJsonFromSandbox;
    getLogs(_reset?: boolean, durationSeconds?: number): Promise<string>;
    /**
     * Delete files from the file manager
     */
    deleteFiles(filePaths: string[]): Promise<void>;
    /**
     * Export generated code to a GitHub repository
     */
    pushToGitHub(options: GitHubPushRequest): Promise<GitHubExportResult>;
    /**
     * Handle user input during conversational code generation
     * Processes user messages and updates pendingUserInputs state
     */
    handleUserInput(userMessage: string, images?: ImageAttachment[]): Promise<void>;
    /**
     * Clear conversation history
     */
    clearConversation(): void;
    /**
     * Capture screenshot of the given URL using Cloudflare Browser Rendering REST API
     */
    captureScreenshot(url: string, viewport?: {
        width: number;
        height: number;
    }): Promise<string>;
    /**
     * Export git objects
     * The route handler will build the repo with template rebasing
     */
    exportGitObjects(): Promise<{
        gitObjects: Array<{
            path: string;
            data: Uint8Array;
        }>;
        query: string;
        hasCommits: boolean;
        templateDetails: TemplateDetails | null;
    }>;
}
export {};
