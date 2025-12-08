import { Agent, AgentContext, Connection, ConnectionContext } from 'agents';
import { 
    Blueprint, 
    PhaseConceptGenerationSchemaType, 
    PhaseConceptType,
    FileConceptType,
    FileOutputType,
    PhaseImplementationSchemaType,
} from '../schemas';
import { ExecuteCommandsResponse, GitHubPushRequest, PreviewType, StaticAnalysisResponse, TemplateDetails } from '../../services/sandbox/sandboxTypes';
import {  GitHubExportResult } from '../../services/github/types';
import { GitHubService } from '../../services/github/GitHubService';
import { CodeGenState, CurrentDevState, MAX_PHASES } from './state';
import { AllIssues, AgentSummary, AgentInitArgs, PhaseExecutionResult, UserContext } from './types';
import { PREVIEW_EXPIRED_ERROR, WebSocketMessageResponses } from '../constants';
import { broadcastToConnections, handleWebSocketClose, handleWebSocketMessage, sendToConnection } from './websocket';
import { createObjectLogger, StructuredLogger } from '../../logger';
import { ProjectSetupAssistant } from '../assistants/projectsetup';
import { UserConversationProcessor, RenderToolCall } from '../operations/UserConversationProcessor';
import { FileManager } from '../services/implementations/FileManager';
import { StateManager } from '../services/implementations/StateManager';
import { DeploymentManager } from '../services/implementations/DeploymentManager';
// import { WebSocketBroadcaster } from '../services/implementations/WebSocketBroadcaster';
import { GenerationContext } from '../domain/values/GenerationContext';
import { IssueReport } from '../domain/values/IssueReport';
import { PhaseImplementationOperation } from '../operations/PhaseImplementation';
import { FileRegenerationOperation } from '../operations/FileRegeneration';
import { PhaseGenerationOperation } from '../operations/PhaseGeneration';
import { ScreenshotAnalysisOperation } from '../operations/ScreenshotAnalysis';
// Database schema imports removed - using zero-storage OAuth flow
import { BaseSandboxService } from '../../services/sandbox/BaseSandboxService';
import { WebSocketMessageData, WebSocketMessageType } from '../../api/websocketTypes';
import { InferenceContext, AgentActionKey } from '../inferutils/config.types';
import { AGENT_CONFIG } from '../inferutils/config';
import { ModelConfigService } from '../../database/services/ModelConfigService';
import { fixProjectIssues } from '../../services/code-fixer';
import { GitVersionControl } from '../git';
import { FastCodeFixerOperation } from '../operations/PostPhaseCodeFixer';
import { looksLikeCommand, validateAndCleanBootstrapCommands } from '../utils/common';
import { customizePackageJson, customizeTemplateFiles, generateBootstrapScript, generateProjectName } from '../utils/templateCustomizer';
import { generateBlueprint } from '../planning/blueprint';
import { AppService } from '../../database';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';
import { RateLimitExceededError } from 'shared/types/errors';
import { ImageAttachment, type ProcessedImageAttachment } from '../../types/image-attachment';
import { OperationOptions } from '../operations/common';
import { CodingAgentInterface } from '../services/implementations/CodingAgent';
import { ImageType, uploadImage } from 'worker/utils/images';
import { ConversationMessage, ConversationState } from '../inferutils/common';
import { DeepCodeDebugger } from '../assistants/codeDebugger';
import { DeepDebugResult } from './types';
import { StateMigration } from './stateMigration';
import { generateNanoId } from 'worker/utils/idGenerator';
import { updatePackageJson } from '../utils/packageSyncer';
import { IdGenerator } from '../utils/idGenerator';

interface Operations {
    regenerateFile: FileRegenerationOperation;
    generateNextPhase: PhaseGenerationOperation;
    analyzeScreenshot: ScreenshotAnalysisOperation;
    implementPhase: PhaseImplementationOperation;
    fastCodeFixer: FastCodeFixerOperation;
    processUserMessage: UserConversationProcessor;
}

const DEFAULT_CONVERSATION_SESSION_ID = 'default';

/**
 * SimpleCodeGeneratorAgent - Deterministically orchestrated agent
 * 
 * Manages the lifecycle of code generation including:
 * - Blueprint, phase generation, phase implementation, review cycles orchestrations
 * - File streaming with WebSocket updates
 * - Code validation and error correction
 * - Deployment to sandbox service
 */
export class SimpleCodeGeneratorAgent extends Agent<Env, CodeGenState> {
    private static readonly MAX_COMMANDS_HISTORY = 10;
    private static readonly PROJECT_NAME_PREFIX_MAX_LENGTH = 20;

    protected projectSetupAssistant: ProjectSetupAssistant | undefined;
    protected stateManager!: StateManager;
    protected fileManager!: FileManager;
    protected codingAgent: CodingAgentInterface = new CodingAgentInterface(this);
    
    protected deploymentManager!: DeploymentManager;
    protected git: GitVersionControl;

    private previewUrlCache: string = '';
    private templateDetailsCache: TemplateDetails | null = null;
    
    // In-memory storage for user-uploaded images (not persisted in DO state)
    private pendingUserImages: ProcessedImageAttachment[] = []
    private generationPromise: Promise<void> | null = null;
    private currentAbortController?: AbortController;
    private deepDebugPromise: Promise<{ transcript: string } | { error: string }> | null = null;
    private deepDebugConversationId: string | null = null;
    
    // GitHub token cache (ephemeral, lost on DO eviction)
    private githubTokenCache: {
        token: string;
        username: string;
        expiresAt: number;
    } | null = null;
    
    
    protected operations: Operations = {
        regenerateFile: new FileRegenerationOperation(),
        generateNextPhase: new PhaseGenerationOperation(),
        analyzeScreenshot: new ScreenshotAnalysisOperation(),
        implementPhase: new PhaseImplementationOperation(),
        fastCodeFixer: new FastCodeFixerOperation(),
        processUserMessage: new UserConversationProcessor()
    };
    
    public _logger: StructuredLogger | undefined;

    private initLogger(agentId: string, sessionId: string, userId: string) {
        this._logger = createObjectLogger(this, 'CodeGeneratorAgent');
        this._logger.setObjectId(agentId);
        this._logger.setFields({
            sessionId,
            agentId,
            userId,
        });
        return this._logger;
    }

    logger(): StructuredLogger {
        if (!this._logger) {
            // Safe access during initialization - handle missing state gracefully
            const agentId = this.getAgentId() || 'uninitialized';
            const sessionId = this.state.sessionId || 'unknown';
            const userId = this.state.inferenceContext?.userId || 'unknown';
            this._logger = this.initLogger(agentId, sessionId, userId);
        }
        return this._logger;
    }

    getAgentId(): string {
        // CRITICAL: Durable Object ID name IS the agentId - this is the source of truth
        // The DO is created with agentId as the name via getAgentByName(env.CodeGenObject, agentId)
        // So we ALWAYS try DO ID first, even before checking state
        try {
            const doIdName = (this.ctx as any)?.id?.name;
            if (doIdName && typeof doIdName === 'string' && doIdName.trim() !== '') {
                return doIdName;
            }
        } catch (error) {
            // Ignore errors accessing ctx.id, but log for debugging
            this.logger().warn('Failed to access DO ID name', { error: error instanceof Error ? error.message : String(error) });
        }
        
        // Fallback: Try to get agentId from state (if initialized)
        if (this.state.inferenceContext?.agentId) {
            return this.state.inferenceContext.agentId;
        }
        
        // Last resort: return empty string (should never happen if DO is created correctly)
        this.logger().error('CRITICAL: Cannot determine agentId from DO ID or state', {
            hasDoId: !!(this.ctx as any)?.id,
            doIdName: (this.ctx as any)?.id?.name,
            hasState: !!this.state,
            hasInferenceContext: !!this.state?.inferenceContext,
        });
        return '';
    }

    initialState: CodeGenState = {
        blueprint: {} as Blueprint, 
        projectName: "",
        query: "",
        generatedPhases: [],
        generatedFilesMap: {},
        agentMode: 'deterministic',
        sandboxInstanceId: undefined,
        templateName: '',
        commandsHistory: [],
        lastPackageJson: '',
        pendingUserInputs: [],
        inferenceContext: {} as InferenceContext,
        sessionId: '',
        hostname: '',
        conversationMessages: [],
        currentDevState: CurrentDevState.IDLE,
        phasesCounter: MAX_PHASES,
        mvpGenerated: false,
        shouldBeGenerating: false,
        reviewingInitiated: false,
        projectUpdatesAccumulator: [],
        lastDeepDebugTranscript: null,
    };

    constructor(ctx: AgentContext, env: Env) {
        super(ctx, env);
        this.sql`CREATE TABLE IF NOT EXISTS full_conversations (id TEXT PRIMARY KEY, messages TEXT)`;
        this.sql`CREATE TABLE IF NOT EXISTS compact_conversations (id TEXT PRIMARY KEY, messages TEXT)`;
        
        // Initialize StateManager
        this.stateManager = new StateManager(
            () => this.state,
            (s) => this.setState(s)
        );

        // Initialize GitVersionControl (bind sql to preserve 'this' context)
        this.git = new GitVersionControl(this.sql.bind(this));

        // Initialize FileManager
        this.fileManager = new FileManager(this.stateManager, () => this.getTemplateDetails(), this.git);
        
        // Initialize DeploymentManager first (manages sandbox client caching)
        // DeploymentManager will use its own getClient() override for caching
        this.deploymentManager = new DeploymentManager(
            {
                stateManager: this.stateManager,
                fileManager: this.fileManager,
                getLogger: () => this.logger(),
                env: this.env
            },
            SimpleCodeGeneratorAgent.MAX_COMMANDS_HISTORY
        );
    }

    /**
     * Initialize the code generator with project blueprint and template
     * Sets up services and begins deployment process
     */
    async initialize(
        initArgs: AgentInitArgs,
        ..._args: unknown[]
    ): Promise<CodeGenState> {

        const { query, language, frameworks, hostname, inferenceContext, templateInfo } = initArgs;
        const sandboxSessionId = DeploymentManager.generateNewSessionId();
        this.initLogger(inferenceContext.agentId, sandboxSessionId, inferenceContext.userId);
        
        // Generate a blueprint
        console.log('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS: Starting blueprint generation in agent', { queryLength: query.length, imagesCount: initArgs.images?.length || 0 });
        this.logger().info('Generating blueprint', { query, queryLength: query.length, imagesCount: initArgs.images?.length || 0 });
        this.logger().info(`Using language: ${language}, frameworks: ${frameworks ? frameworks.join(", ") : "none"}`);
        
        const blueprint = await generateBlueprint({
            env: this.env,
            inferenceContext,
            query,
            language: language!,
            frameworks: frameworks!,
            templateDetails: templateInfo.templateDetails,
            templateMetaInfo: templateInfo.selection,
            images: initArgs.images,
            stream: {
                chunk_size: 256,
                onChunk: (chunk) => {
                    console.log(`[CALLBACK_CHAIN] stream.onChunk() called in simpleGeneratorAgent. Chunk length: ${chunk.length}, preview: ${chunk.substring(0, 100)}...`);
                    console.log(`[CALLBACK_CHAIN] About to call initArgs.onBlueprintChunk(chunk)...`);
                    try {
                        initArgs.onBlueprintChunk(chunk);
                        console.log(`[CALLBACK_CHAIN] ✅ initArgs.onBlueprintChunk(chunk) completed successfully`);
                    } catch (callbackError) {
                        console.error(`[CALLBACK_CHAIN] ❌ ERROR in initArgs.onBlueprintChunk(chunk):`, callbackError);
                        throw callbackError;
                    }
                }
            }
        })

        const packageJson = templateInfo.templateDetails?.allFiles['package.json'];

        this.templateDetailsCache = templateInfo.templateDetails;

        const projectName = generateProjectName(
            blueprint?.projectName || templateInfo.templateDetails.name,
            generateNanoId(),
            SimpleCodeGeneratorAgent.PROJECT_NAME_PREFIX_MAX_LENGTH
        );
        
        this.logger().info('Generated project name', { projectName });
        
        this.setState({
            ...this.initialState,
            projectName,
            query,
            blueprint,
            templateName: templateInfo.templateDetails.name,
            sandboxInstanceId: undefined,
            generatedPhases: [],
            commandsHistory: [],
            lastPackageJson: packageJson,
            sessionId: sandboxSessionId,
            hostname,
            inferenceContext,
        });

        await this.gitInit();
        
        // Customize template files (package.json, wrangler.jsonc, .bootstrap.js, .gitignore)
        const customizedFiles = customizeTemplateFiles(
            templateInfo.templateDetails.allFiles,
            {
                projectName,
                commandsHistory: [] // Empty initially, will be updated later
            }
        );
        
        this.logger().info('Customized template files', { 
            files: Object.keys(customizedFiles) 
        });
        
        // Save customized files to git
        const filesToSave = Object.entries(customizedFiles).map(([filePath, content]) => ({
            filePath,
            fileContents: content,
            filePurpose: 'Project configuration file'
        }));
        
        await this.fileManager.saveGeneratedFiles(
            filesToSave,
            'Initialize project configuration files'
        );
        
        this.logger().info('Committed customized template files to git');

        this.initializeAsync().catch((error: unknown) => {
            this.broadcastError("Initialization failed", error);
        });
        this.logger().info(`Agent ${this.getAgentId()} session: ${this.state.sessionId} initialized successfully`);
        await this.saveToDatabase();
        return this.state;
    }

    private async initializeAsync(): Promise<void> {
        try {
            const [, setupCommands] = await Promise.all([
                this.deployToSandbox(),
                this.getProjectSetupAssistant().generateSetupCommands(),
                this.generateReadme()
            ]);
            this.logger().info("Deployment to sandbox service and initial commands predictions completed successfully");
            await this.executeCommands(setupCommands.commands);
            this.logger().info("Initial commands executed successfully");
        } catch (error) {
            this.logger().error("Error during async initialization:", error);
            // throw error;
        }
    }

    async isInitialized() {
        // Check if agent is initialized by checking if we have both blueprint and query
        // Don't rely on getAgentId() as it might return empty string during initialization
        return !!(this.state.blueprint && this.state.query && this.state.inferenceContext?.agentId);
    }

    async onStart(props?: Record<string, unknown> | undefined): Promise<void> {
        this.logger().info(`Agent ${this.getAgentId()} session: ${this.state.sessionId} onStart`, { props });
        
        // Ignore if agent not initialized
        if (!this.state.query) {
            this.logger().warn(`Agent ${this.getAgentId()} session: ${this.state.sessionId} onStart ignored, agent not initialized`);
            return;
        }
        
        // Ensure state is migrated for any previous versions
        this.migrateStateIfNeeded();
        
        // Check if this is a read-only operation
        const readOnlyMode = props?.readOnlyMode === true;
        
        if (readOnlyMode) {
            this.logger().info(`Agent ${this.getAgentId()} starting in READ-ONLY mode - skipping expensive initialization`);
            return;
        }

        // migrate overwritten package.jsons
        const oldPackageJson = this.fileManager.getFile('package.json')?.fileContents || this.state.lastPackageJson;
        if (oldPackageJson) {
            const packageJson = customizePackageJson(oldPackageJson, this.state.projectName);
            this.fileManager.saveGeneratedFiles([
                {
                    filePath: 'package.json',
                    fileContents: packageJson,
                    filePurpose: 'Project configuration file'
                }
            ], 'chore: fix overwritten package.json');
        }
        
        // Full initialization for read-write operations
        await this.gitInit();
        this.logger().info(`Agent ${this.getAgentId()} session: ${this.state.sessionId} onStart being processed, template name: ${this.state.templateName}`);
        // Fill the template cache
        await this.ensureTemplateDetails();
        this.logger().info(`Agent ${this.getAgentId()} session: ${this.state.sessionId} onStart processed successfully`);
    }

    private async gitInit() {
        try {
            await this.git.init();
            this.logger().info("Git initialized successfully");
            // Check if there is any commit
            const head = await this.git.getHead();
            
            if (!head) {
                this.logger().info("No commits found, creating initial commit");
                // get all generated files and commit them
                const generatedFiles = this.fileManager.getGeneratedFiles();
                if (generatedFiles.length === 0) {
                    this.logger().info("No generated files found, skipping initial commit");
                    return;
                }
                await this.git.commit(generatedFiles, "Initial commit");
                this.logger().info("Initial commit created successfully");
            }
        } catch (error) {
            this.logger().error("Error during git init:", error);
        }
    }
    
    onStateUpdate(_state: CodeGenState, _source: "server" | Connection) {}

    setState(state: CodeGenState): void {
        try {
            super.setState(state);
        } catch (error) {
            this.broadcastError("Error setting state", error);
            this.logger().error("State details:", {
                originalState: JSON.stringify(this.state, null, 2),
                newState: JSON.stringify(state, null, 2)
            });
        }
    }

    async onConnect(connection: Connection, ctx: ConnectionContext) {
        // Original pattern: Simple logging, then send state
        // getAgentId() now prioritizes DO ID name (which IS the agentId)
        this.logger().info(`Agent connected for agent ${this.getAgentId()}`, { connection, ctx });
        
        // Ensure template details are loaded before sending them to the client
        // This will use state.templateName first, then fallback to DB if needed
        await this.ensureTemplateDetails();
        
        sendToConnection(connection, 'agent_connected', {
            state: this.state,
            templateDetails: this.getTemplateDetails()
        });
    }

    async ensureTemplateDetails() {
        if (!this.templateDetailsCache) {
            // Original pattern: Use templateName from state first (primary source)
            let templateName = this.state.templateName;
            
            // Fallback: If templateName is missing from state, try to get it from DB
            // This can happen if WebSocket connects before initialize() completes
            if (!templateName || templateName.trim() === '') {
                // Get agentId for DB query (DO ID name is the source of truth)
                const agentId = this.getAgentId();
                
                if (!agentId || agentId.trim() === '') {
                    throw new Error(`Cannot retrieve templateName from DB: agentId is empty. Agent state may not be initialized.`);
                }
                
                this.logger().warn(`Template name is empty in agent state, attempting to retrieve from app record...`, {
                    agentId,
                    hasBlueprint: !!this.state.blueprint,
                    hasQuery: !!this.state.query,
                    hasInferenceContext: !!this.state.inferenceContext,
                });
                
                // Fallback: Try to get templateName from app record
                // This is the PRIMARY source of truth if state hasn't been persisted yet
                try {
                    
                    const userId = this.state.inferenceContext?.userId;
                    
                    this.logger().info(`Attempting to retrieve templateName from app record...`, {
                        agentId,
                        agentIdLength: agentId.length,
                        userId: userId || 'null',
                        doIdName: (this.ctx as any)?.id?.name || 'N/A',
                        queryColumn: 'id', // We're querying by 'id' column (primary key), not 'agentId'
                    });
                    
                    // Try getAppDetails first (includes stats)
                    // Query by 'id' column (not 'agentId') - the table uses 'id' as primary key
                    const appService = new AppService(this.env);
                    let app = await appService.getAppDetails(agentId, userId);
                    let templateNameFromApp: string | null = null;
                    
                    if (app?.templateName && app.templateName.trim() !== '') {
                        templateNameFromApp = app.templateName;
                    } else {
                        // Fallback: Direct database query if getAppDetails doesn't return templateName
                        // This can happen if there's a schema mismatch or query issue
                        this.logger().warn(`getAppDetails didn't return templateName, trying direct DB query...`, {
                            agentId,
                            appExists: !!app,
                            templateNameFromGetAppDetails: app?.templateName || 'null/undefined',
                        });
                        
                        try {
                            // CRITICAL: Validate agentId again before direct DB query
                            if (!agentId || agentId.trim() === '') {
                                this.logger().error(`Cannot execute direct DB query: agentId is empty`, {
                                    agentId,
                                    doIdName: (this.ctx as any)?.id?.name || 'N/A',
                                });
                                throw new Error(`agentId is empty, cannot query database`);
                            }
                            
                            this.logger().info(`Executing direct DB query for templateName...`, {
                                agentId,
                                agentIdLength: agentId.length,
                                queryColumn: 'id', // We're querying by 'id' column, not 'agentId'
                            });
                            
                            const directQuery = await appService['database']
                                .select({ templateName: schema.apps.templateName })
                                .from(schema.apps)
                                .where(eq(schema.apps.id, agentId)) // Query by 'id' column (primary key)
                                .get();
                            
                            if (directQuery?.templateName && directQuery.templateName.trim() !== '') {
                                templateNameFromApp = directQuery.templateName;
                                this.logger().info(`✅ Retrieved templateName via direct DB query: ${templateNameFromApp}`, {
                                    agentId,
                                });
                            }
                        } catch (dbError) {
                            this.logger().error(`Direct DB query failed:`, {
                                agentId,
                                error: dbError instanceof Error ? dbError.message : String(dbError),
                            });
                        }
                    }
                    
                    this.logger().info(`App record lookup result:`, {
                        agentId,
                        appExists: !!app,
                        templateName: templateNameFromApp || app?.templateName || 'null/undefined',
                        templateNameType: typeof (templateNameFromApp || app?.templateName),
                        templateNameLength: (templateNameFromApp || app?.templateName)?.length || 0,
                        hasBlueprint: !!this.state.blueprint,
                        hasQuery: !!this.state.query,
                        appKeys: app ? Object.keys(app).join(', ') : 'N/A',
                    });
                    
                    // Check if we found templateName (from either source)
                    if (templateNameFromApp && templateNameFromApp.trim() !== '') {
                        this.logger().info(`✅ Retrieved templateName from app record: ${templateNameFromApp}`, {
                            agentId,
                        });
                        // Update state with templateName from app record
                        this.setState({
                            ...this.state,
                            templateName: templateNameFromApp,
                        });
                        // Use the templateName from app record
                        const appTemplateName = templateNameFromApp;
                        this.logger().info(`Loading template details for: ${appTemplateName} (from app record)`);
                        const results = await BaseSandboxService.getTemplateDetails(appTemplateName);
                        if (!results.success || !results.templateDetails) {
                            throw new Error(`Failed to get template details for: ${appTemplateName}`);
                        }
                        
                        const templateDetails = results.templateDetails;
                        const customizedAllFiles = { ...templateDetails.allFiles };
                        
                        this.logger().info('Customizing template files for older app');
                        const customizedFiles = customizeTemplateFiles(
                            templateDetails.allFiles,
                            {
                                projectName: this.state.projectName,
                                commandsHistory: this.getBootstrapCommands()
                            }
                        );
                        Object.assign(customizedAllFiles, customizedFiles);
                        
                        this.templateDetailsCache = {
                            ...templateDetails,
                            allFiles: customizedAllFiles
                        };
                        this.logger().info('Template details loaded and customized (from app record fallback)');
                        return this.templateDetailsCache;
                    } else {
                        // App record doesn't have templateName - check if agent is initialized
                        const isInitialized = !!(this.state.blueprint && this.state.query);
                        
                        if (!isInitialized) {
                            this.logger().error(`Agent not initialized and app record has no templateName. Agent ID: ${agentId}, app exists: ${!!app}, app.templateName: ${app?.templateName || 'null'}`);
                            throw new Error(`Agent not initialized. Template name is missing and agent state is incomplete. Please wait for agent initialization to complete before connecting via WebSocket.`);
                        }
                        
                        // Agent appears initialized but templateName is missing from both state and app record
                        this.logger().error(`Template name is missing from both agent state and app record. This indicates the agent state was not properly persisted. Agent ID: ${agentId}, has blueprint: ${!!this.state.blueprint}, has query: ${!!this.state.query}, app exists: ${!!app}`);
                        throw new Error(`Template name is missing from agent state and app record. The agent appears initialized but the template name was not persisted. This may indicate the agent initialization was interrupted before state could be saved. Please try creating a new agent session.`);
                    }
                } catch (error) {
                    // If app record lookup fails, log the error and check if agent is initialized
                    this.logger().error(`Failed to retrieve templateName from app record`, {
                        agentId,
                        error: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                        hasBlueprint: !!this.state.blueprint,
                        hasQuery: !!this.state.query,
                        hasInferenceContext: !!this.state.inferenceContext,
                    });
                    
                    // Check if agent is initialized
                    const isInitialized = !!(this.state.blueprint && this.state.query);
                    
                    if (!isInitialized) {
                        throw new Error(`Agent not initialized. Template name is missing and agent state is incomplete. Please wait for agent initialization to complete before connecting via WebSocket.`);
                    }
                    
                    // Agent is initialized but we couldn't get templateName from app record
                    throw new Error(`Template name is missing from agent state and could not be retrieved from app record. The agent appears initialized but the template name was not persisted. This may indicate the agent initialization was interrupted before state could be saved. Please try creating a new agent session.`);
                }
            }
            
            this.logger().info(`Loading template details for: ${templateName}`);
            const results = await BaseSandboxService.getTemplateDetails(templateName);
            if (!results.success || !results.templateDetails) {
                throw new Error(`Failed to get template details for: ${templateName}`);
            }
            
            const templateDetails = results.templateDetails;
            
            const customizedAllFiles = { ...templateDetails.allFiles };
            
            this.logger().info('Customizing template files for older app');
            const customizedFiles = customizeTemplateFiles(
                templateDetails.allFiles,
                {
                    projectName: this.state.projectName,
                    commandsHistory: this.getBootstrapCommands()
                }
            );
            Object.assign(customizedAllFiles, customizedFiles);
            
            this.templateDetailsCache = {
                ...templateDetails,
                allFiles: customizedAllFiles
            };
            this.logger().info('Template details loaded and customized');
        }
        return this.templateDetailsCache;
    }

    private getTemplateDetails(): TemplateDetails {
        if (!this.templateDetailsCache) {
            this.ensureTemplateDetails();
            throw new Error('Template details not loaded. Call ensureTemplateDetails() first.');
        }
        return this.templateDetailsCache;
    }

    /**
     * Update bootstrap script when commands history changes
     * Called after significant command executions
     */
    private async updateBootstrapScript(commandsHistory: string[]): Promise<void> {
        if (!commandsHistory || commandsHistory.length === 0) {
            return;
        }
        
        // Use only validated commands
        const bootstrapScript = generateBootstrapScript(
            this.state.projectName,
            commandsHistory
        );
        
        await this.fileManager.saveGeneratedFile(
            {
                filePath: '.bootstrap.js',
                fileContents: bootstrapScript,
                filePurpose: 'Updated bootstrap script for first-time clone setup'
            },
            'chore: Update bootstrap script with latest commands'
        );
        
        this.logger().info('Updated bootstrap script with commands', {
            commandCount: commandsHistory.length,
            commands: commandsHistory
        });
    }

    /*
    * Each DO has 10 gb of sqlite storage. However, the way agents sdk works, it stores the 'state' object of the agent as a single row
    * in the cf_agents_state table. And row size has a much smaller limit in sqlite. Thus, we only keep current compactified conversation
    * in the agent's core state and store the full conversation in a separate DO table.
    */
    getConversationState(id: string = DEFAULT_CONVERSATION_SESSION_ID): ConversationState {
        const currentConversation = this.state.conversationMessages;
        const rows = this.sql<{ messages: string, id: string }>`SELECT * FROM full_conversations WHERE id = ${id}`;
        let fullHistory: ConversationMessage[] = [];
        if (rows.length > 0 && rows[0].messages) {
            try {
                const parsed = JSON.parse(rows[0].messages);
                if (Array.isArray(parsed)) {
                    fullHistory = parsed as ConversationMessage[];
                }
            } catch (_e) {}
        }
        if (fullHistory.length === 0) {
            fullHistory = currentConversation;
        }
        // Load compact (running) history from sqlite with fallback to in-memory state for migration
        const compactRows = this.sql<{ messages: string, id: string }>`SELECT * FROM compact_conversations WHERE id = ${id}`;
        let runningHistory: ConversationMessage[] = [];
        if (compactRows.length > 0 && compactRows[0].messages) {
            try {
                const parsed = JSON.parse(compactRows[0].messages);
                if (Array.isArray(parsed)) {
                    runningHistory = parsed as ConversationMessage[];
                }
            } catch (_e) {}
        }
        if (runningHistory.length === 0) {
            runningHistory = currentConversation;
        }

        // Remove duplicates
        const deduplicateMessages = (messages: ConversationMessage[]): ConversationMessage[] => {
            const seen = new Set<string>();
            return messages.filter(msg => {
                if (seen.has(msg.conversationId)) {
                    return false;
                }
                seen.add(msg.conversationId);
                return true;
            });
        };

        runningHistory = deduplicateMessages(runningHistory);
        fullHistory = deduplicateMessages(fullHistory);
        
        return {
            id: id,
            runningHistory,
            fullHistory,
        };
    }

    setConversationState(conversations: ConversationState) {
        const serializedFull = JSON.stringify(conversations.fullHistory);
        const serializedCompact = JSON.stringify(conversations.runningHistory);
        try {
            this.logger().info(`Saving conversation state ${conversations.id}, full_length: ${serializedFull.length}, compact_length: ${serializedCompact.length}`);
            this.sql`INSERT OR REPLACE INTO compact_conversations (id, messages) VALUES (${conversations.id}, ${serializedCompact})`;
            this.sql`INSERT OR REPLACE INTO full_conversations (id, messages) VALUES (${conversations.id}, ${serializedFull})`;
        } catch (error) {
            this.logger().error(`Failed to save conversation state ${conversations.id}`, error);
        }
    }

    addConversationMessage(message: ConversationMessage) {
        const conversationState = this.getConversationState();
        if (!conversationState.runningHistory.find(msg => msg.conversationId === message.conversationId)) {
            conversationState.runningHistory.push(message);
        } else  {
            conversationState.runningHistory = conversationState.runningHistory.map(msg => {
                if (msg.conversationId === message.conversationId) {
                    return message;
                }
                return msg;
            });
        }
        if (!conversationState.fullHistory.find(msg => msg.conversationId === message.conversationId)) {
            conversationState.fullHistory.push(message);
        } else {
            conversationState.fullHistory = conversationState.fullHistory.map(msg => {
                if (msg.conversationId === message.conversationId) {
                    return message;
                }
                return msg;
            });
        }
        this.setConversationState(conversationState);
    }

    private async saveToDatabase() {
        const startTime = Date.now();
        const agentId = this.getAgentId();
        const userId = this.state.inferenceContext.userId || null;
        
        // Entry log
        this.logger().info(`Blueprint generated successfully for agent ${agentId}`);
        this.logger().info('[saveToDatabase] Starting database save operation', {
            operation: 'saveToDatabase',
            agentId,
            userId: userId ? `${userId.substring(0, 8)}...` : 'null',
            blueprintTitle: this.state.blueprint?.title?.substring(0, 50) || 'undefined',
            blueprintDescription: this.state.blueprint?.description?.substring(0, 50) || 'undefined',
            queryLength: this.state.query?.length || 0,
            framework: this.state.blueprint?.frameworks?.[0] || 'undefined',
            timestamp: new Date().toISOString(),
        });
        
        // Context validation
        this.logger().debug('[saveToDatabase] Validating agent context', {
            agentId,
            userId: userId ? `${userId.substring(0, 8)}...` : 'null',
            validation: {
                hasAgentId: !!agentId,
                hasInferenceContext: !!this.state.inferenceContext,
                hasBlueprint: !!this.state.blueprint,
                hasQuery: !!this.state.query,
                blueprintTitleLength: this.state.blueprint?.title?.length || 0,
                blueprintDescriptionLength: this.state.blueprint?.description?.length || 0,
            }
        });
        
        // Prepare app data
        const appData = {
            id: this.state.inferenceContext.agentId,
            userId: this.state.inferenceContext.userId,
            sessionToken: null,
            title: this.state.blueprint.title || this.state.query.substring(0, 100),
            description: this.state.blueprint.description || null,
            originalPrompt: this.state.query,
            finalPrompt: this.state.query,
            framework: this.state.blueprint.frameworks?.[0],
            visibility: 'private' as const,
            status: 'generating' as const,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.logger().debug('[saveToDatabase] Prepared app data', {
            agentId,
            userId: userId ? `${userId.substring(0, 8)}...` : 'null',
            appData: {
                id: appData.id,
                title: appData.title?.substring(0, 50),
                description: appData.description?.substring(0, 50),
                status: appData.status,
                visibility: appData.visibility,
                framework: appData.framework,
                hasOriginalPrompt: !!appData.originalPrompt,
                originalPromptLength: appData.originalPrompt?.length || 0,
            }
        });
        
        // Update the app record with blueprint data (app should already exist from early creation)
        try {
            const appService = new AppService(this.env);
            
            this.logger().debug('[saveToDatabase] AppService created, updating app with blueprint data', {
                agentId,
                userId: userId ? `${userId.substring(0, 8)}...` : 'null',
                timestamp: new Date().toISOString(),
            });
            
            // Try to update first (app should exist from early creation)
            // Preserve templateName if it was already set (from immediate storage after template selection)
            const existingApp = await appService.getAppDetails(agentId, userId || undefined);
            const updateData: Partial<schema.App> = {
                title: appData.title,
                description: appData.description,
                framework: appData.framework,
                finalPrompt: appData.finalPrompt,
                // Preserve templateName if it already exists, otherwise use state templateName
                templateName: existingApp?.templateName || this.state.templateName || undefined,
                // Keep status as 'generating' - it will be updated when code generation completes
            };
            const updateSuccess = await appService.updateApp(agentId, updateData);
            
            if (!updateSuccess) {
                // If update failed, app might not exist (early creation failed), so try create
                this.logger().warn('[saveToDatabase] Update failed, app record may not exist, attempting create', {
                    agentId,
                    userId: userId ? `${userId.substring(0, 8)}...` : 'null',
                });
                await appService.createApp(appData);
                this.logger().info('[saveToDatabase] App record created (fallback after update failed)', {
                    agentId,
                });
            }
            
            const duration = Date.now() - startTime;
            
            // Success log
            this.logger().info(`App updated successfully in database for agent ${agentId}`, { 
                agentId: agentId, 
                userId: userId,
                visibility: 'private'
            });
            this.logger().info('[saveToDatabase] App updated successfully in database', {
                operation: 'saveToDatabase',
                agentId,
                userId: userId ? `${userId.substring(0, 8)}...` : 'null',
                title: appData.title?.substring(0, 50),
                status: appData.status,
                visibility: appData.visibility,
                duration,
            });
            this.logger().info(`Agent initialized successfully for agent ${agentId}`);
            
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            const errorName = error instanceof Error ? error.name : 'UnknownError';
            
            // Comprehensive error log
            this.logger().error('[saveToDatabase] Failed to save app to database', {
                operation: 'saveToDatabase',
                agentId,
                userId: userId ? `${userId.substring(0, 8)}...` : 'null',
                error: {
                    type: errorName,
                    message: errorMessage,
                    stack: errorStack?.split('\n').slice(0, 10).join('\n'), // First 10 lines
                },
                context: {
                    blueprintTitle: this.state.blueprint?.title?.substring(0, 50),
                    queryLength: this.state.query?.length || 0,
                    framework: this.state.blueprint?.frameworks?.[0],
                    hasBlueprint: !!this.state.blueprint,
                },
                appData: {
                    id: appData.id,
                    title: appData.title?.substring(0, 50),
                    status: appData.status,
                    visibility: appData.visibility,
                },
                duration,
                timestamp: new Date().toISOString(),
                fatal: false, // Not fatal - agent can continue
            });
            
            // Re-throw to maintain existing error propagation behavior
            throw error;
        }
    }

    getPreviewUrlCache() {
        return this.previewUrlCache;
    }

    getProjectSetupAssistant(): ProjectSetupAssistant {
        if (this.projectSetupAssistant === undefined) {
            this.projectSetupAssistant = new ProjectSetupAssistant({
                env: this.env,
                agentId: this.getAgentId(),
                query: this.state.query,
                blueprint: this.state.blueprint,
                template: this.getTemplateDetails(),
                inferenceContext: this.state.inferenceContext
            });
        }
        return this.projectSetupAssistant;
    }

    getSessionId() {
        return this.deploymentManager.getSessionId();
    }

    getSandboxServiceClient(): BaseSandboxService {
        return this.deploymentManager.getClient();
    }

    getGit(): GitVersionControl {
        return this.git;
    }

    isCodeGenerating(): boolean {
        return this.generationPromise !== null;
    }

    rechargePhasesCounter(max_phases: number = MAX_PHASES): void {
        if (this.getPhasesCounter() <= max_phases) {
            this.setState({
                ...this.state,
                phasesCounter: max_phases
            });
        }
    }

    decrementPhasesCounter(): number {
        const counter = this.getPhasesCounter() - 1;
        this.setState({
            ...this.state,
            phasesCounter: counter
        });
        return counter;
    }

    getPhasesCounter(): number {
        return this.state.phasesCounter;
    }

    getOperationOptions(): OperationOptions {
        return {
            env: this.env,
            agentId: this.getAgentId(),
            context: GenerationContext.from(this.state, this.getTemplateDetails(), this.logger()),
            logger: this.logger(),
            inferenceContext: this.getInferenceContext(),
            agent: this.codingAgent
        };
    }

    /**
     * Gets or creates an abort controller for the current operation
     * Reuses existing controller for nested operations (e.g., tool calling)
     */
    protected getOrCreateAbortController(): AbortController {
        // Don't reuse aborted controllers
        if (this.currentAbortController && !this.currentAbortController.signal.aborted) {
            return this.currentAbortController;
        }
        
        // Create new controller in memory for new operation
        this.currentAbortController = new AbortController();
        
        return this.currentAbortController;
    }
    
    /**
     * Cancels the current inference operation if any
     */
    public cancelCurrentInference(): boolean {
        if (this.currentAbortController) {
            this.logger().info('Cancelling current inference operation');
            this.currentAbortController.abort();
            this.currentAbortController = undefined;
            return true;
        }
        return false;
    }
    
    /**
     * Clears abort controller after successful completion
     */
    protected clearAbortController(): void {
        this.currentAbortController = undefined;
    }
    
    /**
     * Gets inference context with abort signal
     * Reuses existing abort controller for nested operations
     */
    protected getInferenceContext(): InferenceContext {
        const controller = this.getOrCreateAbortController();
        
        return {
            ...this.state.inferenceContext,
            abortSignal: controller.signal,
        };
    }

    private createNewIncompletePhase(phaseConcept: PhaseConceptType) {
        this.setState({
            ...this.state,
            generatedPhases: [...this.state.generatedPhases, {
                ...phaseConcept,
                completed: false
            }]
        })

        this.logger().info("Created new incomplete phase:", JSON.stringify(this.state.generatedPhases, null, 2));
    }

    private markPhaseComplete(phaseName: string) {
        // First find the phase
        const phases = this.state.generatedPhases;
        if (!phases.some(p => p.name === phaseName)) {
            this.logger().warn(`Phase ${phaseName} not found in generatedPhases array, skipping save`);
            return;
        }
        
        // Update the phase
        this.setState({
            ...this.state,
            generatedPhases: phases.map(p => p.name === phaseName ? { ...p, completed: true } : p)
        });

        this.logger().info("Completed phases:", JSON.stringify(phases, null, 2));
    }

    private broadcastError(context: string, error: unknown): void {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger().error(`${context}:`, error);
        this.broadcast(WebSocketMessageResponses.ERROR, {
            error: `${context}: ${errorMessage}`
        });
    }

    async generateReadme() {
        this.logger().info('Generating README.md');
        // Only generate if it doesn't exist
        if (this.fileManager.fileExists('README.md')) {
            this.logger().info('README.md already exists');
            return;
        }

        this.broadcast(WebSocketMessageResponses.FILE_GENERATING, {
            message: 'Generating README.md',
            filePath: 'README.md',
            filePurpose: 'Project documentation and setup instructions'
        });

        const readme = await this.operations.implementPhase.generateReadme(this.getOperationOptions());

        await this.fileManager.saveGeneratedFile(readme, "feat: README.md");

        this.broadcast(WebSocketMessageResponses.FILE_GENERATED, {
            message: 'README.md generated successfully',
            file: readme
        });
        this.logger().info('README.md generated successfully');
    }

    async queueUserRequest(request: string, images?: ProcessedImageAttachment[]): Promise<void> {
        this.rechargePhasesCounter(3);
        this.setState({
            ...this.state,
            pendingUserInputs: [...this.state.pendingUserInputs, request]
        });
        if (images && images.length > 0) {
            this.logger().info('Storing user images in-memory for phase generation', {
                imageCount: images.length,
            });
            this.pendingUserImages = [...this.pendingUserImages, ...images];
        }
    }

    private fetchPendingUserRequests(): string[] {
        const inputs = this.state.pendingUserInputs;
        if (inputs.length > 0) {
            this.setState({
                ...this.state,
                pendingUserInputs: []
            });
        }
        return inputs;
    }

    /**
     * State machine controller for code generation with user interaction support
     * Executes phases sequentially with review cycles and proper state transitions
     */
    async generateAllFiles(reviewCycles: number = 5): Promise<void> {
        if (this.state.mvpGenerated && this.state.pendingUserInputs.length === 0) {
            this.logger().info("Code generation already completed and no user inputs pending");
            return;
        }
        if (this.isCodeGenerating()) {
            this.logger().info("Code generation already in progress");
            return;
        }
        this.generationPromise = this.launchStateMachine(reviewCycles);
        await this.generationPromise;
    }

    private async launchStateMachine(reviewCycles: number) {
        this.broadcast(WebSocketMessageResponses.GENERATION_STARTED, {
            message: 'Starting code generation',
            totalFiles: this.getTotalFiles()
        });
        this.logger().info('Starting code generation', {
            totalFiles: this.getTotalFiles()
        });
        await this.ensureTemplateDetails();

        let currentDevState = CurrentDevState.PHASE_IMPLEMENTING;
        const generatedPhases = this.state.generatedPhases;
        const incompletedPhases = generatedPhases.filter(phase => !phase.completed);
        let phaseConcept : PhaseConceptType | undefined;
        if (incompletedPhases.length > 0) {
            phaseConcept = incompletedPhases[incompletedPhases.length - 1];
            this.logger().info('Resuming code generation from incompleted phase', {
                phase: phaseConcept
            });
        } else if (generatedPhases.length > 0) {
            currentDevState = CurrentDevState.PHASE_GENERATING;
            this.logger().info('Resuming code generation after generating all phases', {
                phase: generatedPhases[generatedPhases.length - 1]
            });
        } else {
            phaseConcept = this.state.blueprint.initialPhase;
            this.logger().info('Starting code generation from initial phase', {
                phase: phaseConcept
            });
            this.createNewIncompletePhase(phaseConcept);
        }

        let staticAnalysisCache: StaticAnalysisResponse | undefined;
        let userContext: UserContext | undefined;

        // Store review cycles for later use
        this.setState({
            ...this.state,
            reviewCycles: reviewCycles
        });

        try {
            let executionResults: PhaseExecutionResult;
            // State machine loop - continues until IDLE state
            while (currentDevState !== CurrentDevState.IDLE) {
                this.logger().info(`[generateAllFiles] Executing state: ${currentDevState}`);
                switch (currentDevState) {
                    case CurrentDevState.PHASE_GENERATING:
                        executionResults = await this.executePhaseGeneration();
                        currentDevState = executionResults.currentDevState;
                        phaseConcept = executionResults.result;
                        staticAnalysisCache = executionResults.staticAnalysis;
                        userContext = executionResults.userContext;
                        break;
                    case CurrentDevState.PHASE_IMPLEMENTING:
                        executionResults = await this.executePhaseImplementation(phaseConcept, staticAnalysisCache, userContext);
                        currentDevState = executionResults.currentDevState;
                        staticAnalysisCache = executionResults.staticAnalysis;
                        userContext = undefined;
                        break;
                    case CurrentDevState.REVIEWING:
                        currentDevState = await this.executeReviewCycle();
                        break;
                    case CurrentDevState.FINALIZING:
                        currentDevState = await this.executeFinalizing();
                        break;
                    default:
                        break;
                }
            }

            this.logger().info("State machine completed successfully");
        } catch (error) {
            if (error instanceof RateLimitExceededError) {
                this.logger().error("Error in state machine:", error);
                this.broadcast(WebSocketMessageResponses.RATE_LIMIT_ERROR, { error });
            } else {
                this.broadcastError("Error during generation", error);
            }
        } finally {
            // Clear abort controller after generation completes
            this.clearAbortController();
            
            // Ensure preview is deployed if we have files but no preview URL
            if (this.state.generatedFilesMap && Object.keys(this.state.generatedFilesMap).length > 0) {
                if (!this.previewUrlCache) {
                    if (this.state.sandboxInstanceId) {
                        // Sandbox exists but no preview URL cached - redeploy to get preview URL
                        this.logger().info('Code generation completed, sandbox exists but no preview URL cached, redeploying to get preview URL...');
                    } else {
                        // No sandbox instance - deploy initial preview
                        this.logger().info('Code generation completed but no preview exists, deploying preview...');
                    }
                    try {
                        const previewResult = await this.deployToSandbox([], false, 'Final preview deployment', true);
                        if (previewResult?.previewURL) {
                            this.previewUrlCache = previewResult.previewURL;
                        }
                    } catch (error) {
                        this.logger().error('Failed to deploy preview after generation:', error);
                    }
                }
            }
            
            const appService = new AppService(this.env);
            await appService.updateApp(
                this.getAgentId(),
                {
                    status: 'completed',
                }
            );
            this.generationPromise = null;
            this.broadcast(WebSocketMessageResponses.GENERATION_COMPLETE, {
                message: "Code generation and review process completed.",
                instanceId: this.state.sandboxInstanceId,
                previewURL: this.previewUrlCache || undefined,
            });
        }
    }

    /**
     * Execute phase generation state - generate next phase with user suggestions
     */
    async executePhaseGeneration(): Promise<PhaseExecutionResult> {
        this.logger().info("Executing PHASE_GENERATING state");
        try {
            const currentIssues = await this.fetchAllIssues();
            
            // Generate next phase with user suggestions if available
            
            // Get stored images if user suggestions are present
            const pendingUserInputs = this.fetchPendingUserRequests();
            const userContext = (pendingUserInputs.length > 0) 
                ? {
                    suggestions: pendingUserInputs,
                    images: this.pendingUserImages
                } as UserContext
                : undefined;

            if (userContext && userContext?.suggestions && userContext.suggestions.length > 0) {
                // Only reset pending user inputs if user suggestions were read
                this.logger().info("Resetting pending user inputs", { 
                    userSuggestions: userContext.suggestions,
                    hasImages: !!userContext.images,
                    imageCount: userContext.images?.length || 0
                });
                
                // Clear images after they're passed to phase generation
                if (userContext?.images && userContext.images.length > 0) {
                    this.logger().info('Clearing stored user images after passing to phase generation');
                    this.pendingUserImages = [];
                }
            }
            
            const nextPhase = await this.generateNextPhase(currentIssues, userContext);
                
            if (!nextPhase) {
                this.logger().info("No more phases to implement, transitioning to FINALIZING");
                return {
                    currentDevState: CurrentDevState.FINALIZING,
                };
            }
    
            // Store current phase and transition to implementation
            this.setState({
                ...this.state,
                currentPhase: nextPhase
            });
            
            return {
                currentDevState: CurrentDevState.PHASE_IMPLEMENTING,
                result: nextPhase,
                staticAnalysis: currentIssues.staticAnalysis,
                userContext: userContext,
            };
        } catch (error) {
            if (error instanceof RateLimitExceededError) {
                throw error;
            }
            this.broadcastError("Error generating phase", error);
            return {
                currentDevState: CurrentDevState.IDLE,
            };
        }
    }

    /**
     * Execute phase implementation state - implement current phase
     */
    async executePhaseImplementation(phaseConcept?: PhaseConceptType, staticAnalysis?: StaticAnalysisResponse, userContext?: UserContext): Promise<{currentDevState: CurrentDevState, staticAnalysis?: StaticAnalysisResponse}> {
        try {
            this.logger().info("Executing PHASE_IMPLEMENTING state");
    
            if (phaseConcept === undefined) {
                phaseConcept = this.state.currentPhase;
                if (phaseConcept === undefined) {
                    this.logger().error("No phase concept provided to implement, will call phase generation");
                    const results = await this.executePhaseGeneration();
                    phaseConcept = results.result;
                    if (phaseConcept === undefined) {
                        this.logger().error("No phase concept provided to implement, will return");
                        return {currentDevState: CurrentDevState.FINALIZING};
                    }
                }
            }
    
            this.setState({
                ...this.state,
                currentPhase: undefined // reset current phase
            });
    
            let currentIssues : AllIssues;
            if (this.state.sandboxInstanceId) {
                if (staticAnalysis) {
                    // If have cached static analysis, fetch everything else fresh
                    currentIssues = {
                        runtimeErrors: await this.fetchRuntimeErrors(true),
                        staticAnalysis: staticAnalysis,
                    };
                } else {
                    currentIssues = await this.fetchAllIssues(true)
                }
            } else {
                currentIssues = {
                    runtimeErrors: [],
                    staticAnalysis: { success: true, lint: { issues: [] }, typecheck: { issues: [] } },
                }
            }
            // Implement the phase with user context (suggestions and images)
            await this.implementPhase(phaseConcept, currentIssues, userContext);
    
            this.logger().info(`Phase ${phaseConcept.name} completed, generating next phase`);

            const phasesCounter = this.decrementPhasesCounter();

            if ((phaseConcept.lastPhase || phasesCounter <= 0) && this.state.pendingUserInputs.length === 0) return {currentDevState: CurrentDevState.FINALIZING, staticAnalysis: staticAnalysis};
            return {currentDevState: CurrentDevState.PHASE_GENERATING, staticAnalysis: staticAnalysis};
        } catch (error) {
            this.logger().error("Error implementing phase", error);
            if (error instanceof RateLimitExceededError) {
                throw error;
            }
            return {currentDevState: CurrentDevState.IDLE};
        }
    }

    /**
     * Execute review cycle state - review and cleanup
     */
    async executeReviewCycle(): Promise<CurrentDevState> {
        this.logger().info("Executing REVIEWING state - review and cleanup");
        if (this.state.reviewingInitiated) {
            this.logger().info("Reviewing already initiated, skipping");
            return CurrentDevState.IDLE;
        }
        this.setState({
            ...this.state,
            reviewingInitiated: true
        });

        // If issues/errors found, prompt user if they want to review and cleanup
        const issues = await this.fetchAllIssues(false);
        if (issues.runtimeErrors.length > 0 || issues.staticAnalysis.typecheck.issues.length > 0) {
            this.logger().info("Reviewing stage - issues found, prompting user to review and cleanup");
            const message : ConversationMessage = {
                role: "assistant",
                content: `<system_context>If the user responds with yes, launch the 'deep_debug' tool with the prompt to fix all the issues in the app</system_context>\nThere might be some bugs in the app. Do you want me to try to fix them?`,
                conversationId: IdGenerator.generateConversationId(),
            }
            // Store the message in the conversation history so user's response can trigger the deep debug tool
            this.addConversationMessage(message);
            
            this.broadcast(WebSocketMessageResponses.CONVERSATION_RESPONSE, {
                message: message.content,
                conversationId: message.conversationId,
                isStreaming: false,
            });
        }

        return CurrentDevState.IDLE;
    }

    /**
     * Execute finalizing state - final review and cleanup (runs only once)
     */
    async executeFinalizing(): Promise<CurrentDevState> {
        this.logger().info("Executing FINALIZING state - final review and cleanup");

        // Only do finalizing stage if it wasn't done before
        if (this.state.mvpGenerated) {
            this.logger().info("Finalizing stage already done");
            return CurrentDevState.REVIEWING;
        }
        this.setState({
            ...this.state,
            mvpGenerated: true
        });

        const phaseConcept: PhaseConceptType = {
            name: "Finalization and Review",
            description: "Full polishing and final review of the application",
            files: [],
            lastPhase: true
        }
        
        this.createNewIncompletePhase(phaseConcept);

        const currentIssues = await this.fetchAllIssues(true);
        
        // Run final review and cleanup phase
        await this.implementPhase(phaseConcept, currentIssues);

        const numFilesGenerated = this.fileManager.getGeneratedFilePaths().length;
        this.logger().info(`Finalization complete. Generated ${numFilesGenerated}/${this.getTotalFiles()} files.`);

        // Transition to IDLE - generation complete
        return CurrentDevState.REVIEWING;
    }

    async executeDeepDebug(
        issue: string,
        toolRenderer: RenderToolCall,
        streamCb: (chunk: string) => void,
        focusPaths?: string[],
    ): Promise<DeepDebugResult> {
        
        const debugPromise = (async () => {
            try {
                const previousTranscript = this.state.lastDeepDebugTranscript ?? undefined;
                const operationOptions = this.getOperationOptions();
                const filesIndex = operationOptions.context.allFiles
                    .filter((f) =>
                        !focusPaths?.length ||
                        focusPaths.some((p) => f.filePath.includes(p)),
                    );

                const runtimeErrors = await this.fetchRuntimeErrors(true);

                const dbg = new DeepCodeDebugger(
                    operationOptions.env,
                    operationOptions.inferenceContext,
                );

                const out = await dbg.run(
                    { issue, previousTranscript },
                    { filesIndex, agent: this.codingAgent, runtimeErrors },
                    streamCb,
                    toolRenderer,
                );

                // Save transcript for next session
                this.setState({
                    ...this.state,
                    lastDeepDebugTranscript: out,
                });

                return { success: true as const, transcript: out };
            } catch (e) {
                this.logger().error('Deep debugger failed', e);
                return { success: false as const, error: `Deep debugger failed: ${String(e)}` };
            } finally{
                this.deepDebugPromise = null;
                this.deepDebugConversationId = null;
            }
        })();

        // Store promise before awaiting
        this.deepDebugPromise = debugPromise;

        return await debugPromise;
    }

    /**
     * Generate next phase with user context (suggestions and images)
     */
    async generateNextPhase(currentIssues: AllIssues, userContext?: UserContext): Promise<PhaseConceptGenerationSchemaType | undefined> {
        const issues = IssueReport.from(currentIssues);
        
        // Build notification message
        let notificationMsg = "Generating next phase";
        if (userContext?.suggestions && userContext.suggestions.length > 0) {
            notificationMsg = `Generating next phase incorporating ${userContext.suggestions.length} user suggestion(s)`;
        }
        if (userContext?.images && userContext.images.length > 0) {
            notificationMsg += ` with ${userContext.images.length} image(s)`;
        }
        
        // Notify phase generation start
        this.broadcast(WebSocketMessageResponses.PHASE_GENERATING, {
            message: notificationMsg,
            issues: issues,
            userSuggestions: userContext?.suggestions,
        });
        
        const result = await this.operations.generateNextPhase.execute(
            {
                issues,
                userContext,
                isUserSuggestedPhase: userContext?.suggestions && userContext.suggestions.length > 0 && this.state.mvpGenerated,
            },
            this.getOperationOptions()
        )
        // Execute install commands if any
        if (result.installCommands && result.installCommands.length > 0) {
            this.executeCommands(result.installCommands);
        }

        // Execute delete commands if any
        const filesToDelete = result.files.filter(f => f.changes?.toLowerCase().trim() === 'delete');
        if (filesToDelete.length > 0) {
            this.logger().info(`Deleting ${filesToDelete.length} files: ${filesToDelete.map(f => f.path).join(", ")}`);
            this.deleteFiles(filesToDelete.map(f => f.path));
        }
        
        if (result.files.length === 0) {
            this.logger().info("No files generated for next phase");
            // Notify phase generation complete
            this.broadcast(WebSocketMessageResponses.PHASE_GENERATED, {
                message: `No files generated for next phase`,
                phase: undefined
            });
            return undefined;
        }
        
        this.createNewIncompletePhase(result);
        // Notify phase generation complete
        this.broadcast(WebSocketMessageResponses.PHASE_GENERATED, {
            message: `Generated next phase: ${result.name}`,
            phase: result
        });

        return result;
    }

    /**
     * Implement a single phase of code generation
     * Streams file generation with real-time updates and incorporates technical instructions
     */
    async implementPhase(phase: PhaseConceptType, currentIssues: AllIssues, userContext?: UserContext, streamChunks: boolean = true, postPhaseFixing: boolean = true): Promise<PhaseImplementationSchemaType> {
        const issues = IssueReport.from(currentIssues);
        
        const implementationMsg = userContext?.suggestions && userContext.suggestions.length > 0
            ? `Implementing phase: ${phase.name} with ${userContext.suggestions.length} user suggestion(s)`
            : `Implementing phase: ${phase.name}`;
        const msgWithImages = userContext?.images && userContext.images.length > 0
            ? `${implementationMsg} and ${userContext.images.length} image(s)`
            : implementationMsg;
            
        this.broadcast(WebSocketMessageResponses.PHASE_IMPLEMENTING, {
            message: msgWithImages,
            phase: phase,
            issues: issues,
        });
            
        
        const result = await this.operations.implementPhase.execute(
            {
                phase, 
                issues, 
                isFirstPhase: this.state.generatedPhases.filter(p => p.completed).length === 0,
                fileGeneratingCallback: (filePath: string, filePurpose: string) => {
                    this.broadcast(WebSocketMessageResponses.FILE_GENERATING, {
                        message: `Generating file: ${filePath}`,
                        filePath: filePath,
                        filePurpose: filePurpose
                    });
                },
                userContext,
                shouldAutoFix: this.state.inferenceContext.enableRealtimeCodeFix,
                fileChunkGeneratedCallback: streamChunks ? (filePath: string, chunk: string, format: 'full_content' | 'unified_diff') => {
                    this.broadcast(WebSocketMessageResponses.FILE_CHUNK_GENERATED, {
                        message: `Generating file: ${filePath}`,
                        filePath: filePath,
                        chunk,
                        format,
                    });
                } : (_filePath: string, _chunk: string, _format: 'full_content' | 'unified_diff') => {},
                fileClosedCallback: (file: FileOutputType, message: string) => {
                    this.broadcast(WebSocketMessageResponses.FILE_GENERATED, {
                        message,
                        file,
                    });
                }
            },
            this.getOperationOptions()
        );
        
        this.broadcast(WebSocketMessageResponses.PHASE_VALIDATING, {
            message: `Validating files for phase: ${phase.name}`,
            phase: phase,
        });

        // Await the already-created realtime code fixer promises
        const finalFiles = await Promise.allSettled(result.fixedFilePromises).then((results: PromiseSettledResult<FileOutputType>[]) => {
            return results.map((result) => {
                if (result.status === 'fulfilled') {
                    return result.value;
                } else {
                    return null;
                }
            }).filter((f): f is FileOutputType => f !== null);
        });
    
        // Update state with completed phase
        await this.fileManager.saveGeneratedFiles(finalFiles, `feat: ${phase.name}\n\n${phase.description}`);

        this.logger().info("Files generated for phase:", phase.name, finalFiles.map(f => f.filePath));

        // Execute commands if provided
        if (result.commands && result.commands.length > 0) {
            this.logger().info("Phase implementation suggested install commands:", result.commands);
            await this.executeCommands(result.commands, false);
        }
    
        // Deploy generated files
        if (finalFiles.length > 0) {
            await this.deployToSandbox(finalFiles, false, phase.name, true);
            if (postPhaseFixing) {
                await this.applyDeterministicCodeFixes();
                if (this.state.inferenceContext.enableFastSmartCodeFix) {
                    await this.applyFastSmartCodeFixes();
                }
            }
        }

        // Validation complete
        this.broadcast(WebSocketMessageResponses.PHASE_VALIDATED, {
            message: `Files validated for phase: ${phase.name}`,
            phase: phase
        });
    
        this.logger().info("Files generated for phase:", phase.name, finalFiles.map(f => f.filePath));
    
        this.logger().info(`Validation complete for phase: ${phase.name}`);
    
        // Notify phase completion
        this.broadcast(WebSocketMessageResponses.PHASE_IMPLEMENTED, {
            phase: {
                name: phase.name,
                files: finalFiles.map(f => ({
                    path: f.filePath,
                    purpose: f.filePurpose,
                    contents: f.fileContents
                })),
                description: phase.description
            },
            message: "Files generated successfully for phase"
        });
    
        this.markPhaseComplete(phase.name);
        
        return {
            files: finalFiles,
            deploymentNeeded: result.deploymentNeeded,
            commands: result.commands
        };
    }

    /**
     * Get current model configurations (defaults + user overrides)
     * Used by WebSocket to provide configuration info to frontend
     */
    async getModelConfigsInfo() {
        const userId = this.state.inferenceContext.userId;
        if (!userId) {
            throw new Error('No user session available for model configurations');
        }

        try {
            const modelConfigService = new ModelConfigService(this.env);
            
            // Get all user configs
            const userConfigsRecord = await modelConfigService.getUserModelConfigs(userId);
            
            // Transform to match frontend interface
            const agents = Object.entries(AGENT_CONFIG).map(([key, config]) => ({
                key,
                name: config.name,
                description: config.description
            }));

            const userConfigs: Record<string, any> = {};
            const defaultConfigs: Record<string, any> = {};

            for (const [actionKey, mergedConfig] of Object.entries(userConfigsRecord)) {
                if (mergedConfig.isUserOverride) {
                    userConfigs[actionKey] = {
                        name: mergedConfig.name,
                        max_tokens: mergedConfig.max_tokens,
                        temperature: mergedConfig.temperature,
                        reasoning_effort: mergedConfig.reasoning_effort,
                        fallbackModel: mergedConfig.fallbackModel,
                        isUserOverride: true
                    };
                }
                
                // Always include default config
                const defaultConfig = AGENT_CONFIG[actionKey as AgentActionKey];
                if (defaultConfig) {
                    defaultConfigs[actionKey] = {
                        name: defaultConfig.name,
                        max_tokens: defaultConfig.max_tokens,
                        temperature: defaultConfig.temperature,
                        reasoning_effort: defaultConfig.reasoning_effort,
                        fallbackModel: defaultConfig.fallbackModel
                    };
                }
            }

            return {
                agents,
                userConfigs,
                defaultConfigs
            };
        } catch (error) {
            this.logger().error('Error fetching model configs info:', error);
            throw error;
        }
    }

    getTotalFiles(): number {
        return this.fileManager.getGeneratedFilePaths().length + ((this.state.currentPhase || this.state.blueprint.initialPhase)?.files?.length || 0);
    }

    getSummary(): Promise<AgentSummary> {
        const summaryData = {
            query: this.state.query,
            generatedCode: this.fileManager.getGeneratedFiles(),
            conversation: this.state.conversationMessages,
        };
        return Promise.resolve(summaryData);
    }

    async getFullState(): Promise<CodeGenState> {
        return this.state;
    }
    
    private migrateStateIfNeeded(): void {
        const migratedState = StateMigration.migrateIfNeeded(this.state, this.logger());
        if (migratedState) {
            this.setState(migratedState);
        }
    }

    getFileGenerated(filePath: string) {
        return this.fileManager!.getGeneratedFile(filePath) || null;
    }

    getWebSockets(): WebSocket[] {
        return this.ctx.getWebSockets();
    }

    async fetchRuntimeErrors(clear: boolean = true) {
        await this.deploymentManager.waitForPreview();

        try {
            const errors = await this.deploymentManager.fetchRuntimeErrors(clear);
            
            if (errors.length > 0) {
                this.broadcast(WebSocketMessageResponses.RUNTIME_ERROR_FOUND, {
                    errors,
                    message: "Runtime errors found",
                    count: errors.length
                });
            }

            return errors;
        } catch (error) {
            this.logger().error("Exception fetching runtime errors:", error);
            // If fetch fails, initiate redeploy
            this.deployToSandbox();
            return [];
        }
    }

    /**
     * Perform static code analysis on the generated files
     * This helps catch potential issues early in the development process
     */
    async runStaticAnalysisCode(files?: string[]): Promise<StaticAnalysisResponse> {
        try {
            const analysisResponse = await this.deploymentManager.runStaticAnalysis(files);

            const { lint, typecheck } = analysisResponse;
            this.broadcast(WebSocketMessageResponses.STATIC_ANALYSIS_RESULTS, {
                lint: { issues: lint.issues, summary: lint.summary },
                typecheck: { issues: typecheck.issues, summary: typecheck.summary }
            });

            return analysisResponse;
        } catch (error) {
            this.broadcastError("Failed to lint code", error);
            return { success: false, lint: { issues: [], }, typecheck: { issues: [], } };
        }
    }

    private async applyFastSmartCodeFixes() : Promise<void> {
        try {
            const startTime = Date.now();
            this.logger().info("Applying fast smart code fixes");
            // Get static analysis and do deterministic fixes
            const staticAnalysis = await this.runStaticAnalysisCode();
            if (staticAnalysis.typecheck.issues.length + staticAnalysis.lint.issues.length == 0) {
                this.logger().info("No issues found, skipping fast smart code fixes");
                return;
            }
            const issues = staticAnalysis.typecheck.issues.concat(staticAnalysis.lint.issues);
            const allFiles = this.fileManager.getAllRelevantFiles();

            const fastCodeFixer = await this.operations.fastCodeFixer.execute({
                query: this.state.query,
                issues,
                allFiles,
            }, this.getOperationOptions());

            if (fastCodeFixer.length > 0) {
                await this.fileManager.saveGeneratedFiles(fastCodeFixer, "fix: Fast smart code fixes");
                await this.deployToSandbox(fastCodeFixer);
                this.logger().info("Fast smart code fixes applied successfully");
            }
            this.logger().info(`Fast smart code fixes applied in ${Date.now() - startTime}ms`);            
        } catch (error) {
            this.broadcastError("Failed to apply fast smart code fixes", error);
            return;
        }
    }

    /**
     * Apply deterministic code fixes for common TypeScript errors
     */
    private async applyDeterministicCodeFixes() : Promise<StaticAnalysisResponse | undefined> {
        try {
            // Get static analysis and do deterministic fixes
            const staticAnalysis = await this.runStaticAnalysisCode();
            if (staticAnalysis.typecheck.issues.length == 0) {
                this.logger().info("No typecheck issues found, skipping deterministic fixes");
                return staticAnalysis;  // So that static analysis is not repeated again
            }
            const typeCheckIssues = staticAnalysis.typecheck.issues;
            this.broadcast(WebSocketMessageResponses.DETERMINISTIC_CODE_FIX_STARTED, {
                message: `Attempting to fix ${typeCheckIssues.length} TypeScript issues using deterministic code fixer`,
                issues: typeCheckIssues
            });

            this.logger().info(`Attempting to fix ${typeCheckIssues.length} TypeScript issues using deterministic code fixer`);
            const allFiles = this.fileManager.getAllFiles();

            const fixResult = fixProjectIssues(
                allFiles.map(file => ({
                    filePath: file.filePath,
                    fileContents: file.fileContents,
                    filePurpose: ''
                })),
                typeCheckIssues
            );

            this.broadcast(WebSocketMessageResponses.DETERMINISTIC_CODE_FIX_COMPLETED, {
                message: `Fixed ${typeCheckIssues.length} TypeScript issues using deterministic code fixer`,
                issues: typeCheckIssues,
                fixResult
            });

            if (fixResult) {
                // If there are unfixable issues but of type TS2307, extract external module names and install them
                if (fixResult.unfixableIssues.length > 0) {
                    const modulesNotFound = fixResult.unfixableIssues.filter(issue => issue.issueCode === 'TS2307');
                    // Reason is of the form: External package "xyz" should be handled by package manager                    
                    const moduleNames = modulesNotFound.flatMap(issue => {
                        const match = issue.reason.match(/External package ["'](.+?)["']/);
                        const name = match?.[1];
                        return (typeof name === 'string' && name.trim().length > 0 && !name.startsWith('@shared')) ? [name] : [];
                    });
                    if (moduleNames.length > 0) {
                        const installCommands = moduleNames.map(moduleName => `bun install ${moduleName}`);
                        await this.executeCommands(installCommands, false);

                        this.logger().info(`Deterministic code fixer installed missing modules: ${moduleNames.join(', ')}`);
                    } else {
                        this.logger().info(`Deterministic code fixer detected no external modules to install from unfixable TS2307 issues`);
                    }
                }
                if (fixResult.modifiedFiles.length > 0) {
                        this.logger().info("Applying deterministic fixes to files, Fixes: ", JSON.stringify(fixResult, null, 2));
                        const fixedFiles = fixResult.modifiedFiles.map(file => ({
                            filePath: file.filePath,
                            filePurpose: allFiles.find(f => f.filePath === file.filePath)?.filePurpose || '',
                            fileContents: file.fileContents
                    }));
                    await this.fileManager.saveGeneratedFiles(fixedFiles, "fix: applied deterministic fixes");
                    
                    await this.deployToSandbox(fixedFiles, false, "fix: applied deterministic fixes");
                    this.logger().info("Deployed deterministic fixes to sandbox");
                }
            }
            this.logger().info(`Applied deterministic code fixes: ${JSON.stringify(fixResult, null, 2)}`);
        } catch (error) {
            this.broadcastError('Deterministic code fixer failed', error);
        }
        // return undefined;
    }

    async fetchAllIssues(resetIssues: boolean = false): Promise<AllIssues> {
        const [runtimeErrors, staticAnalysis] = await Promise.all([
            this.fetchRuntimeErrors(resetIssues),
            this.runStaticAnalysisCode()
        ]);
        this.logger().info("Fetched all issues:", JSON.stringify({ runtimeErrors, staticAnalysis }));
        
        return { runtimeErrors, staticAnalysis };
    }

    async updateProjectName(newName: string): Promise<boolean> {
        try {
            const valid = /^[a-z0-9-_]{3,50}$/.test(newName);
            if (!valid) return false;
            const updatedBlueprint = { ...this.state.blueprint, projectName: newName } as Blueprint;
            this.setState({
                ...this.state,
                blueprint: updatedBlueprint
            });
            let ok = true;
            if (this.state.sandboxInstanceId) {
                try {
                    ok = await this.getSandboxServiceClient().updateProjectName(this.state.sandboxInstanceId, newName);
                } catch (_) {
                    ok = false;
                }
            }
            try {
                const appService = new AppService(this.env);
                const dbOk = await appService.updateApp(this.getAgentId(), { title: newName });
                ok = ok && dbOk;
            } catch (error) {
                this.logger().error('Error updating project name in database:', error);
                ok = false;
            }
            this.broadcast(WebSocketMessageResponses.PROJECT_NAME_UPDATED, {
                message: 'Project name updated',
                projectName: newName
            });
            return ok;
        } catch (error) {
            this.logger().error('Error updating project name:', error);
            return false;
        }
    }

    async updateBlueprint(patch: Partial<Blueprint>): Promise<Blueprint> {
        const keys = Object.keys(patch) as (keyof Blueprint)[];
        const allowed = new Set<keyof Blueprint>([
            'title',
            'projectName',
            'detailedDescription',
            'description',
            'colorPalette',
            'views',
            'userFlow',
            'dataFlow',
            'architecture',
            'pitfalls',
            'frameworks',
            'implementationRoadmap'
        ]);
        const filtered: Partial<Blueprint> = {};
        for (const k of keys) {
            if (allowed.has(k) && typeof (patch as any)[k] !== 'undefined') {
                (filtered as any)[k] = (patch as any)[k];
            }
        }
        if (typeof filtered.projectName === 'string' && filtered.projectName) {
            await this.updateProjectName(filtered.projectName);
            delete (filtered as any).projectName;
        }
        const updated: Blueprint = { ...this.state.blueprint, ...(filtered as Blueprint) } as Blueprint;
        this.setState({
            ...this.state,
            blueprint: updated
        });
        this.broadcast(WebSocketMessageResponses.BLUEPRINT_UPDATED, {
            message: 'Blueprint updated',
            updatedKeys: Object.keys(filtered)
        });
        return updated;
    }

    // ===== Debugging helpers for assistants =====
    async readFiles(paths: string[]): Promise<{ files: { path: string; content: string }[] }> {
        const { sandboxInstanceId } = this.state;
        if (!sandboxInstanceId) {
            return { files: [] };
        }
        const resp = await this.getSandboxServiceClient().getFiles(sandboxInstanceId, paths);
        if (!resp.success) {
            this.logger().warn('readFiles failed', { error: resp.error });
            return { files: [] };
        }
        return { files: resp.files.map(f => ({ path: f.filePath, content: f.fileContents })) };
    }

    async execCommands(commands: string[], shouldSave: boolean, timeout?: number): Promise<ExecuteCommandsResponse> {
        const { sandboxInstanceId } = this.state;
        if (!sandboxInstanceId) {
            return { success: false, results: [], error: 'No sandbox instance' } as any;
        }
        const result = await this.getSandboxServiceClient().executeCommands(sandboxInstanceId, commands, timeout);
        if (shouldSave) {
            this.saveExecutedCommands(commands);
        }
        return result;
    }

    /**
     * Regenerate a file to fix identified issues
     * Retries up to 3 times before giving up
     */
    async regenerateFile(file: FileOutputType, issues: string[], retryIndex: number = 0) {
        this.broadcast(WebSocketMessageResponses.FILE_REGENERATING, {
            message: `Regenerating file: ${file.filePath}`,
            filePath: file.filePath,
            original_issues: issues,
        });
        
        const result = await this.operations.regenerateFile.execute(
            {file, issues, retryIndex},
            this.getOperationOptions()
        );

        const fileState = await this.fileManager.saveGeneratedFile(result);

        this.broadcast(WebSocketMessageResponses.FILE_REGENERATED, {
            message: `Regenerated file: ${file.filePath}`,
            file: fileState,
            original_issues: issues,
        });
        
        return fileState;
    }

    async regenerateFileByPath(path: string, issues: string[]): Promise<{ path: string; diff: string }> {
        const { sandboxInstanceId } = this.state;
        if (!sandboxInstanceId) {
            throw new Error('No sandbox instance available');
        }
        // Prefer local file manager; fallback to sandbox
        let fileContents = '';
        let filePurpose = '';
        try {
            const fmFile = this.fileManager.getFile(path);
            if (fmFile) {
                fileContents = fmFile.fileContents;
                filePurpose = fmFile.filePurpose || '';
            } else {
                const resp = await this.getSandboxServiceClient().getFiles(sandboxInstanceId, [path]);
                const f = resp.success ? resp.files.find(f => f.filePath === path) : undefined;
                if (!f) throw new Error(resp.error || `File not found: ${path}`);
                fileContents = f.fileContents;
            }
        } catch (e) {
            throw new Error(`Failed to read file for regeneration: ${String(e)}`);
        }

        const regenerated = await this.regenerateFile({ filePath: path, fileContents, filePurpose }, issues, 0);
        // Persist to sandbox instance
        await this.getSandboxServiceClient().writeFiles(sandboxInstanceId, [{ filePath: regenerated.filePath, fileContents: regenerated.fileContents }], `Deep debugger fix: ${path}`);
        return { path, diff: regenerated.lastDiff };
    }

    async generateFiles(
        phaseName: string,
        phaseDescription: string,
        requirements: string[],
        files: FileConceptType[]
    ): Promise<{ files: Array<{ path: string; purpose: string; diff: string }> }> {
        this.logger().info('Generating files for deep debugger', {
            phaseName,
            requirementsCount: requirements.length,
            filesCount: files.length
        });

        // Create phase structure with explicit files
        const phase: PhaseConceptType = {
            name: phaseName,
            description: phaseDescription,
            files: files,
            lastPhase: true
        };

        // Call existing implementPhase with postPhaseFixing=false
        // This skips deterministic fixes and fast smart fixes
        const result = await this.implementPhase(
            phase,
            {
                runtimeErrors: [],
                staticAnalysis: { 
                    success: true, 
                    lint: { issues: [] }, 
                    typecheck: { issues: [] } 
                },
            },
            { suggestions: requirements },
            true, // streamChunks
            false // postPhaseFixing = false (skip auto-fixes)
        );

        // Return files with diffs from FileState
        return {
            files: result.files.map(f => ({
                path: f.filePath,
                purpose: f.filePurpose || '',
                diff: (f as any).lastDiff || '' // FileState has lastDiff
            }))
        };
    }

    async deployToSandbox(files: FileOutputType[] = [], redeploy: boolean = false, commitMessage?: string, clearLogs: boolean = false): Promise<PreviewType | null> {
        // Call deployment manager with callbacks for broadcasting at the right times
        const result = await this.deploymentManager.deployToSandbox(
            files,
            redeploy,
            commitMessage,
            clearLogs,
            {
                onStarted: (data) => {
                    this.broadcast(WebSocketMessageResponses.DEPLOYMENT_STARTED, data);
                },
                onCompleted: (data) => {
                    // Store preview URL in cache when deployment completes
                    if (data.previewURL) {
                        this.previewUrlCache = data.previewURL;
                    }
                    this.broadcast(WebSocketMessageResponses.DEPLOYMENT_COMPLETED, data);
                },
                onError: (data) => {
                    this.broadcast(WebSocketMessageResponses.DEPLOYMENT_FAILED, data);
                },
                onAfterSetupCommands: async () => {
                    // Sync package.json after setup commands (includes dependency installs)
                    await this.syncPackageJsonFromSandbox();
                }
            }
        );

        // Store preview URL in cache if deployment succeeded
        if (result?.previewURL) {
            this.previewUrlCache = result.previewURL;
        }

        return result;
    }
    
    /**
     * Deploy the generated code to Cloudflare Workers
     */
    async deployToCloudflare(): Promise<{ deploymentUrl?: string; workersUrl?: string } | null> {
        try {
            // Ensure sandbox instance exists first
            if (!this.state.sandboxInstanceId) {
                this.logger().info('No sandbox instance, deploying to sandbox first');
                await this.deployToSandbox();
                
                if (!this.state.sandboxInstanceId) {
                    this.logger().error('Failed to deploy to sandbox service');
                    this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_ERROR, {
                        message: 'Deployment failed: Failed to deploy to sandbox service',
                        error: 'Sandbox service unavailable'
                    });
                    return null;
                }
            }

            // Call service - handles orchestration, callbacks for broadcasting
            const result = await this.deploymentManager.deployToCloudflare({
                onStarted: (data) => {
                    this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_STARTED, data);
                },
                onCompleted: (data) => {
                    this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_COMPLETED, data);
                },
                onError: (data) => {
                    this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_ERROR, data);
                },
                onPreviewExpired: () => {
                    // Re-deploy sandbox and broadcast error
                    this.deployToSandbox();
                    this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_ERROR, {
                        message: PREVIEW_EXPIRED_ERROR,
                        error: PREVIEW_EXPIRED_ERROR
                    });
                }
            });

            // Update database with deployment ID if successful
            if (result.deploymentUrl && result.deploymentId) {
                const appService = new AppService(this.env);
                await appService.updateDeploymentId(
                    this.getAgentId(),
                    result.deploymentId
                );
            }

            return result.deploymentUrl ? { deploymentUrl: result.deploymentUrl } : null;

        } catch (error) {
            this.logger().error('Cloudflare deployment error:', error);
            this.broadcast(WebSocketMessageResponses.CLOUDFLARE_DEPLOYMENT_ERROR, {
                message: 'Deployment failed',
                error: error instanceof Error ? error.message : String(error)
            });
            return null;
        }
    }

    async waitForGeneration(): Promise<void> {
        if (this.generationPromise) {
            try {
                await this.generationPromise;
                this.logger().info("Code generation completed successfully");
            } catch (error) {
                this.logger().error("Error during code generation:", error);
            }
        } else {
            this.logger().error("No generation process found");
        }
    }

    isDeepDebugging(): boolean {
        return this.deepDebugPromise !== null;
    }
    
    getDeepDebugSessionState(): { conversationId: string } | null {
        if (this.deepDebugConversationId && this.deepDebugPromise) {
            return { conversationId: this.deepDebugConversationId };
        }
        return null;
    }

    async waitForDeepDebug(): Promise<void> {
        if (this.deepDebugPromise) {
            try {
                await this.deepDebugPromise;
                this.logger().info("Deep debug session completed successfully");
            } catch (error) {
                this.logger().error("Error during deep debug session:", error);
            } finally {
                // Clear promise after waiting completes
                this.deepDebugPromise = null;
            }
        }
    }

    /**
     * Cache GitHub OAuth token in memory for subsequent exports
     * Token is ephemeral - lost on DO eviction
     */
    setGitHubToken(token: string, username: string, ttl: number = 3600000): void {
        this.githubTokenCache = {
            token,
            username,
            expiresAt: Date.now() + ttl
        };
        this.logger().info('GitHub token cached', { 
            username, 
            expiresAt: new Date(this.githubTokenCache.expiresAt).toISOString() 
        });
    }

    /**
     * Get cached GitHub token if available and not expired
     */
    getGitHubToken(): { token: string; username: string } | null {
        if (!this.githubTokenCache) {
            return null;
        }
        
        if (Date.now() >= this.githubTokenCache.expiresAt) {
            this.logger().info('GitHub token expired, clearing cache');
            this.githubTokenCache = null;
            return null;
        }
        
        return {
            token: this.githubTokenCache.token,
            username: this.githubTokenCache.username
        };
    }

    /**
     * Clear cached GitHub token
     */
    clearGitHubToken(): void {
        this.githubTokenCache = null;
        this.logger().info('GitHub token cleared');
    }

    async onMessage(connection: Connection, message: string): Promise<void> {
        handleWebSocketMessage(this, connection, message);
    }

    async onClose(connection: Connection): Promise<void> {
        handleWebSocketClose(connection);
    }

    private async onProjectUpdate(message: string): Promise<void> {
        this.setState({
            ...this.state,
            projectUpdatesAccumulator: [...this.state.projectUpdatesAccumulator, message]
        });
    }

    private async getAndResetProjectUpdates() {
        const projectUpdates = this.state.projectUpdatesAccumulator || [];
        this.setState({
            ...this.state,
            projectUpdatesAccumulator: []
        });
        return projectUpdates;
    }

    public broadcast<T extends WebSocketMessageType>(msg: T, data?: WebSocketMessageData<T>): void {
        if (this.operations.processUserMessage.isProjectUpdateType(msg)) {
            let message = msg as string;
            if (data && 'message' in data) {
                message = (data as { message: string }).message;
            }
            this.onProjectUpdate(message);
        }
        broadcastToConnections(this, msg, data || {} as WebSocketMessageData<T>);
    }

    private getBootstrapCommands() {
        const bootstrapCommands = this.state.commandsHistory || [];
        // Validate, deduplicate, and clean
        const { validCommands } = validateAndCleanBootstrapCommands(bootstrapCommands);
        return validCommands;
    }

    private async saveExecutedCommands(commands: string[]) {
        this.logger().info('Saving executed commands', { commands });
        
        // Merge with existing history
        const mergedCommands = [...(this.state.commandsHistory || []), ...commands];
        
        // Validate, deduplicate, and clean
        const { validCommands, invalidCommands, deduplicated } = validateAndCleanBootstrapCommands(mergedCommands);

        // Log what was filtered out
        if (invalidCommands.length > 0 || deduplicated > 0) {
            this.logger().warn('[commands] Bootstrap commands cleaned', { 
                invalidCommands,
                invalidCount: invalidCommands.length,
                deduplicatedCount: deduplicated,
                finalCount: validCommands.length
            });
        }

        // Update state with cleaned commands
        this.setState({
            ...this.state,
            commandsHistory: validCommands
        });

        // Update bootstrap script with validated commands
        await this.updateBootstrapScript(validCommands);

        // Sync package.json if any dependency-modifying commands were executed
        const hasDependencyCommands = commands.some(cmd => 
            cmd.includes('install') || 
            cmd.includes(' add ') || 
            cmd.includes('remove') ||
            cmd.includes('uninstall')
        );
        
        if (hasDependencyCommands) {
            this.logger().info('Dependency commands executed, syncing package.json from sandbox');
            await this.syncPackageJsonFromSandbox();
        }
    }

    /**
     * Execute commands with retry logic
     * Chunks commands and retries failed ones with AI assistance
     */
    private async executeCommands(commands: string[], shouldRetry: boolean = true, chunkSize: number = 5): Promise<void> {
        const state = this.state;
        if (!state.sandboxInstanceId) {
            this.logger().warn('No sandbox instance available for executing commands');
            return;
        }

        // Sanitize and prepare commands
        commands = commands.join('\n').split('\n').filter(cmd => cmd.trim() !== '').filter(cmd => looksLikeCommand(cmd) && !cmd.includes(' undefined'));
        if (commands.length === 0) {
            this.logger().warn("No commands to execute");
            return;
        }

        commands = commands.map(cmd => cmd.trim().replace(/^\s*-\s*/, '').replace(/^npm/, 'bun'));
        this.logger().info(`AI suggested ${commands.length} commands to run: ${commands.join(", ")}`);

        // Remove duplicate commands
        commands = Array.from(new Set(commands));

        // Execute in chunks
        const commandChunks: string[][] = [];
        for (let i = 0; i < commands.length; i += chunkSize) {
            commandChunks.push(commands.slice(i, i + chunkSize));
        }

        const successfulCommands: string[] = [];

        for (const chunk of commandChunks) {
            // Retry failed commands up to 3 times
            let currentChunk = chunk;
            let retryCount = 0;
            const maxRetries = shouldRetry ? 3 : 1;
            
            while (currentChunk.length > 0 && retryCount < maxRetries) {
                try {
                    this.broadcast(WebSocketMessageResponses.COMMAND_EXECUTING, {
                        message: retryCount > 0 ? `Retrying commands (attempt ${retryCount + 1}/${maxRetries})` : "Executing commands",
                        commands: currentChunk
                    });
                    
                    const resp = await this.getSandboxServiceClient().executeCommands(
                        state.sandboxInstanceId,
                        currentChunk
                    );
                    if (!resp.results || !resp.success) {
                        this.logger().error('Failed to execute commands', { response: resp });
                        // Check if instance is still running
                        const status = await this.getSandboxServiceClient().getInstanceStatus(state.sandboxInstanceId);
                        if (!status.success || !status.isHealthy) {
                            this.logger().error(`Instance ${state.sandboxInstanceId} is no longer running`);
                            return;
                        }
                        break;
                    }

                    // Process results
                    const successful = resp.results.filter(r => r.success);
                    const failures = resp.results.filter(r => !r.success);

                    // Track successful commands
                    if (successful.length > 0) {
                        const successfulCmds = successful.map(r => r.command);
                        this.logger().info(`Successfully executed ${successful.length} commands: ${successfulCmds.join(", ")}`);
                        successfulCommands.push(...successfulCmds);
                    }

                    // If all succeeded, move to next chunk
                    if (failures.length === 0) {
                        this.logger().info(`All commands in chunk executed successfully`);
                        break;
                    }
                    
                    // Handle failures
                    const failedCommands = failures.map(r => r.command);
                    this.logger().warn(`${failures.length} commands failed: ${failedCommands.join(", ")}`);
                    
                    // Only retry if shouldRetry is true
                    if (!shouldRetry) {
                        break;
                    }
                    
                    retryCount++;
                    
                    // For install commands, try AI regeneration
                    const failedInstallCommands = failedCommands.filter(cmd => 
                        cmd.startsWith("bun") || cmd.startsWith("npm") || cmd.includes("install")
                    );
                    
                    if (failedInstallCommands.length > 0 && retryCount < maxRetries) {
                        // Use AI to suggest alternative commands
                        const newCommands = await this.getProjectSetupAssistant().generateSetupCommands(
                            `The following install commands failed: ${JSON.stringify(failures, null, 2)}. Please suggest alternative commands.`
                        );
                        
                        if (newCommands?.commands && newCommands.commands.length > 0) {
                            this.logger().info(`AI suggested ${newCommands.commands.length} alternative commands`);
                            this.broadcast(WebSocketMessageResponses.COMMAND_EXECUTING, {
                                message: "Executing regenerated commands",
                                commands: newCommands.commands
                            });
                            currentChunk = newCommands.commands.filter(looksLikeCommand);
                        } else {
                            this.logger().warn('AI could not generate alternative commands');
                            currentChunk = [] as string[];
                        }
                    } else {
                        // No retry needed for non-install commands
                        currentChunk = [] as string[];
                    }
                } catch (error) {
                    this.logger().error('Error executing commands:', error);
                    // Stop retrying on error
                    break;
                }
            }
        }

        // Record command execution history
        const failedCommands = commands.filter(cmd => !successfulCommands.includes(cmd));
        
        if (failedCommands.length > 0) {
            this.broadcastError('Failed to execute commands', new Error(failedCommands.join(", ")));
        } else {
            this.logger().info(`All commands executed successfully: ${successfulCommands.join(", ")}`);
        }

        this.saveExecutedCommands(successfulCommands);
    }

    /**
     * Sync package.json from sandbox to agent's git repository
     * Called after install/add/remove commands to keep dependencies in sync
     */
    private async syncPackageJsonFromSandbox(): Promise<void> {
        try {
            this.logger().info('Fetching current package.json from sandbox');
            const results = await this.readFiles(['package.json']);
            if (!results || !results.files || results.files.length === 0) {
                this.logger().warn('Failed to fetch package.json from sandbox', { results });
                return;
            }
            const packageJsonContent = results.files[0].content;

            const { updated, packageJson } = updatePackageJson(this.state.lastPackageJson, packageJsonContent);
            if (!updated) {
                this.logger().info('package.json has not changed, skipping sync');
                return;
            }
            // Update state with latest package.json
            this.setState({
                ...this.state,
                lastPackageJson: packageJson
            });
            
            // Commit to git repository
            const fileState = await this.fileManager.saveGeneratedFile(
                {
                    filePath: 'package.json',
                    fileContents: packageJson,
                    filePurpose: 'Project dependencies and configuration'
                },
                'chore: sync package.json dependencies from sandbox'
            );
            
            this.logger().info('Successfully synced package.json to git', { 
                filePath: fileState.filePath,
            });
            
            // Broadcast update to clients
            this.broadcast(WebSocketMessageResponses.FILE_GENERATED, {
                message: 'Synced package.json from sandbox',
                file: fileState
            });
            
        } catch (error) {
            this.logger().error('Failed to sync package.json from sandbox', error);
            // Non-critical error - don't throw, just log
        }
    }

    async getLogs(_reset?: boolean, durationSeconds?: number): Promise<string> {
        if (!this.state.sandboxInstanceId) {
            throw new Error('Cannot get logs: No sandbox instance available');
        }
        
        const response = await this.getSandboxServiceClient().getLogs(this.state.sandboxInstanceId, _reset, durationSeconds);
        if (response.success) {
            return `STDOUT: ${response.logs.stdout}\nSTDERR: ${response.logs.stderr}`;
        } else {
            return `Failed to get logs, ${response.error}`;
        }
    }

    /**
     * Delete files from the file manager
     */
    async deleteFiles(filePaths: string[]) {
        const deleteCommands: string[] = [];
        for (const filePath of filePaths) {
            deleteCommands.push(`rm -rf ${filePath}`);
        }
        // Remove the files from file manager
        this.fileManager.deleteFiles(filePaths);
        try {
            await this.executeCommands(deleteCommands, false);
            this.logger().info(`Deleted ${filePaths.length} files: ${filePaths.join(", ")}`);
        } catch (error) {
            this.logger().error('Error deleting files:', error);
        }
    }

    /**
     * Export generated code to a GitHub repository
     */
    async pushToGitHub(options: GitHubPushRequest): Promise<GitHubExportResult> {
        try {
            this.logger().info('Starting GitHub export using DO git');

            // Broadcast export started
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_STARTED, {
                message: `Starting GitHub export to repository "${options.cloneUrl}"`,
                repositoryName: options.repositoryHtmlUrl,
                isPrivate: options.isPrivate
            });

            // Export git objects from DO
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_PROGRESS, {
                message: 'Preparing git repository...',
                step: 'preparing',
                progress: 20
            });

            const { gitObjects, query, templateDetails } = await this.exportGitObjects();
            
            this.logger().info('Git objects exported', {
                objectCount: gitObjects.length,
                hasTemplate: !!templateDetails
            });

            // Get app createdAt timestamp for template base commit
            let appCreatedAt: Date | undefined = undefined;
            try {
                const appId = this.getAgentId();
                if (appId) {
                    const appService = new AppService(this.env);
                    const app = await appService.getAppDetails(appId);
                    if (app && app.createdAt) {
                        appCreatedAt = new Date(app.createdAt);
                        this.logger().info('Using app createdAt for template base', {
                            createdAt: appCreatedAt.toISOString()
                        });
                    }
                }
            } catch (error) {
                this.logger().warn('Failed to get app createdAt, using current time', { error });
                appCreatedAt = new Date(); // Fallback to current time
            }

            // Push to GitHub using new service
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_PROGRESS, {
                message: 'Uploading to GitHub repository...',
                step: 'uploading_files',
                progress: 40
            });

            const result = await GitHubService.exportToGitHub({
                gitObjects,
                templateDetails,
                appQuery: query,
                appCreatedAt,
                token: options.token,
                repositoryUrl: options.repositoryHtmlUrl,
                username: options.username,
                email: options.email
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to export to GitHub');
            }

            this.logger().info('GitHub export completed', { 
                commitSha: result.commitSha
            });

            // Cache token for subsequent exports
            if (options.token && options.username) {
                try {
                    this.setGitHubToken(options.token, options.username);
                    this.logger().info('GitHub token cached after successful export');
                } catch (cacheError) {
                    // Non-fatal - continue with finalization
                    this.logger().warn('Failed to cache GitHub token', { error: cacheError });
                }
            }

            // Update database
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_PROGRESS, {
                message: 'Finalizing GitHub export...',
                step: 'finalizing',
                progress: 90
            });

            const agentId = this.getAgentId();
            this.logger().info('[DB Update] Updating app with GitHub repository URL', {
                agentId,
                repositoryUrl: options.repositoryHtmlUrl,
                visibility: options.isPrivate ? 'private' : 'public'
            });

            const appService = new AppService(this.env);
            const updateResult = await appService.updateGitHubRepository(
                agentId || '',
                options.repositoryHtmlUrl || '',
                options.isPrivate ? 'private' : 'public'
            );

            this.logger().info('[DB Update] Database update result', {
                agentId,
                success: updateResult,
                repositoryUrl: options.repositoryHtmlUrl
            });

            // Broadcast success
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_COMPLETED, {
                message: `Successfully exported to GitHub repository: ${options.repositoryHtmlUrl}`,
                repositoryUrl: options.repositoryHtmlUrl,
                cloneUrl: options.cloneUrl,
                commitSha: result.commitSha
            });

            this.logger().info('GitHub export completed successfully', { 
                repositoryUrl: options.repositoryHtmlUrl,
                commitSha: result.commitSha
            });
            
            return { 
                success: true, 
                repositoryUrl: options.repositoryHtmlUrl,
                cloneUrl: options.cloneUrl
            };

        } catch (error) {
            this.logger().error('GitHub export failed', error);
            this.broadcast(WebSocketMessageResponses.GITHUB_EXPORT_ERROR, {
                message: `GitHub export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return { 
                success: false, 
                repositoryUrl: options.repositoryHtmlUrl,
                cloneUrl: options.cloneUrl 
            };
        }
    }

    /**
     * Handle user input during conversational code generation
     * Processes user messages and updates pendingUserInputs state
     */
    async handleUserInput(userMessage: string, images?: ImageAttachment[]): Promise<void> {
        try {
            this.logger().info('Processing user input message', { 
                messageLength: userMessage.length,
                pendingInputsCount: this.state.pendingUserInputs.length,
                hasImages: !!images && images.length > 0,
                imageCount: images?.length || 0
            });

            // Ensure template details are loaded before processing
            await this.ensureTemplateDetails();

            // Just fetch runtime errors
            const errors = await this.fetchRuntimeErrors(false);
            const projectUpdates = await this.getAndResetProjectUpdates();
            this.logger().info('Passing context to user conversation processor', { errors, projectUpdates });

            // If there are images, upload them and pass the URLs to the conversation processor
            let uploadedImages: ProcessedImageAttachment[] = [];
            if (images) {
                uploadedImages = await Promise.all(images.map(async (image) => {
                    return await uploadImage(this.env, image, ImageType.UPLOADS);
                }));

                this.logger().info('Uploaded images', { uploadedImages });
            }

            // Process the user message using conversational assistant
            const conversationalResponse = await this.operations.processUserMessage.execute(
                { 
                    userMessage, 
                    conversationState: this.getConversationState(),
                    conversationResponseCallback: (
                        message: string,
                        conversationId: string,
                        isStreaming: boolean,
                        tool?: { name: string; status: 'start' | 'success' | 'error'; args?: Record<string, unknown> }
                    ) => {
                        // Track conversationId when deep_debug starts
                        if (tool?.name === 'deep_debug' && tool.status === 'start') {
                            this.deepDebugConversationId = conversationId;
                        }
                        
                        this.broadcast(WebSocketMessageResponses.CONVERSATION_RESPONSE, {
                            message,
                            conversationId,
                            isStreaming,
                            tool,
                        });
                    },
                    errors,
                    projectUpdates,
                    images: uploadedImages
                }, 
                this.getOperationOptions()
            );

            const { conversationResponse, conversationState } = conversationalResponse;
            this.setConversationState(conversationState);

             if (!this.generationPromise) {
                // If idle, start generation process
                this.logger().info('User input during IDLE state, starting generation');
                this.generateAllFiles().catch(error => {
                    this.logger().error('Error starting generation from user input:', error);
                });
            }

            this.logger().info('User input processed successfully', {
                responseLength: conversationResponse.userResponse.length,
            });

        } catch (error) {
            if (error instanceof RateLimitExceededError) {
                this.logger().error('Rate limit exceeded:', error);
                this.broadcast(WebSocketMessageResponses.RATE_LIMIT_ERROR, {
                    error
                });
                return;
            }
            this.broadcastError('Error processing user input', error);
        }
    }

    /**
     * Clear conversation history
     */
    public clearConversation(): void {
        const messageCount = this.state.conversationMessages.length;
                        
        // Clear conversation messages only from agent's running history
        this.setState({
            ...this.state,
            conversationMessages: []
        });
                        
        // Send confirmation response
        this.broadcast(WebSocketMessageResponses.CONVERSATION_CLEARED, {
            message: 'Conversation history cleared',
            clearedMessageCount: messageCount
        });
    }

    /**
     * Capture screenshot of the given URL using Cloudflare Browser Rendering REST API
     */
    public async captureScreenshot(
        url: string, 
        viewport: { width: number; height: number } = { width: 1280, height: 720 }
    ): Promise<string> {
        if (!this.env.DB || !this.getAgentId()) {
            const error = 'Cannot capture screenshot: DB or agentId not available';
            this.logger().warn(error);
            this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                error,
                configurationError: true
            });
            throw new Error(error);
        }

        if (!url) {
            const error = 'URL is required for screenshot capture';
            this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                error,
                url,
                viewport
            });
            throw new Error(error);
        }

        this.logger().info('Capturing screenshot via REST API', { url, viewport });
        
        // Notify start of screenshot capture
        this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_STARTED, {
            message: `Capturing screenshot of ${url}`,
            url,
            viewport
        });
        
        try {
            // Use Cloudflare Browser Rendering REST API
            const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/snapshot`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    viewport: viewport,
                    gotoOptions: {
                        waitUntil: 'networkidle0',
                        timeout: 10000
                    },
                    screenshotOptions: {
                        fullPage: false,
                        type: 'png'
                    }
                }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                const error = `Browser Rendering API failed: ${response.status} - ${errorText}`;
                this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                    error,
                    url,
                    viewport,
                    statusCode: response.status,
                    statusText: response.statusText
                });
                throw new Error(error);
            }
            
            const result = await response.json() as {
                success: boolean;
                result: {
                    screenshot: string; // base64 encoded
                    content: string;    // HTML content
                };
            };
            
            if (!result.success || !result.result.screenshot) {
                const error = 'Browser Rendering API succeeded but no screenshot returned';
                this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                    error,
                    url,
                    viewport,
                    apiResponse: result
                });
                throw new Error(error);
            }
            
            // Get base64 screenshot data
            const base64Screenshot = result.result.screenshot;
            const screenshot: ImageAttachment = {
                id: this.getAgentId(),
                filename: 'latest.png',
                mimeType: 'image/png',
                base64Data: base64Screenshot
            };
            const uploadedImage = await uploadImage(this.env, screenshot, ImageType.SCREENSHOTS);

            // Persist in database
            try {
                const appService = new AppService(this.env);
                await appService.updateAppScreenshot(this.getAgentId(), uploadedImage.publicUrl);
            } catch (dbError) {
                const error = `Database update failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`;
                this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                    error,
                    url,
                    viewport,
                    screenshotCaptured: true,
                    databaseError: true
                });
                throw new Error(error);
            }

            this.logger().info('Screenshot captured and stored successfully', { 
                url, 
                storage: uploadedImage.publicUrl.startsWith('data:') ? 'database' : (uploadedImage.publicUrl.includes('/api/screenshots/') ? 'r2' : 'images'),
                length: base64Screenshot.length
            });

            // Notify successful screenshot capture
            this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_SUCCESS, {
                message: `Successfully captured screenshot of ${url}`,
                url,
                viewport,
                screenshotSize: base64Screenshot.length,
                timestamp: new Date().toISOString()
            });

            return uploadedImage.publicUrl;
            
        } catch (error) {
            this.logger().error('Failed to capture screenshot via REST API:', error);
            
            // Only broadcast if error wasn't already broadcast above
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (!errorMessage.includes('Browser Rendering API') && !errorMessage.includes('Database update failed')) {
                this.broadcast(WebSocketMessageResponses.SCREENSHOT_CAPTURE_ERROR, {
                    error: errorMessage,
                    url,
                    viewport
                });
            }
            
            throw new Error(`Screenshot capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Export git objects
     * The route handler will build the repo with template rebasing
     */
    async exportGitObjects(): Promise<{
        gitObjects: Array<{ path: string; data: Uint8Array }>;
        query: string;
        hasCommits: boolean;
        templateDetails: TemplateDetails | null;
    }> {
        try {
            // Export git objects efficiently (minimal DO memory usage)
            const gitObjects = this.git.fs.exportGitObjects();

            await this.gitInit();
            
            // Ensure template details are available
            await this.ensureTemplateDetails();
            
            return {
                gitObjects,
                query: this.state.query || 'N/A',
                hasCommits: gitObjects.length > 0,
                templateDetails: this.templateDetailsCache
            };
        } catch (error) {
            this.logger().error('exportGitObjects failed', error);
            throw error;
        }
    }
}
