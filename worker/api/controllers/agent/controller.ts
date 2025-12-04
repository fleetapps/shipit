import { WebSocketMessageResponses } from '../../../agents/constants';
import { BaseController } from '../baseController';
import { generateId } from '../../../utils/idGenerator';
import { CodeGenState } from '../../../agents/core/state';
import { getAgentStub, getTemplateForQuery } from '../../../agents';
import { AgentConnectionData, AgentPreviewResponse, CodeGenArgs } from './types';
import { ApiResponse, ControllerResponse } from '../types';
import { RouteContext } from '../../types/route-context';
import { ModelConfigService } from '../../../database';
import { ModelConfig, InferenceContext } from '../../../agents/inferutils/config.types';
import { RateLimitService } from '../../../services/rate-limit/rateLimits';
import { validateWebSocketOrigin } from '../../../middleware/security/websocket';
import { createLogger } from '../../../logger';
import { getPreviewDomain } from 'worker/utils/urls';
import { ImageType, uploadImage } from 'worker/utils/images';
import { ProcessedImageAttachment } from 'worker/types/image-attachment';
import { getTemplateImportantFiles } from 'worker/services/sandbox/utils';
import { AppService } from '../../../database';

const defaultCodeGenArgs: CodeGenArgs = {
    query: '',
    language: 'typescript',
    frameworks: ['react', 'vite'],
    selectedTemplate: 'auto',
    agentMode: 'deterministic',
};


/**
 * CodingAgentController to handle all code generation related endpoints
 */
export class CodingAgentController extends BaseController {
    static logger = createLogger('CodingAgentController');
    /**
     * Start the incremental code generation process
     */
    static async startCodeGeneration(request: Request, env: Env, _: ExecutionContext, context: RouteContext): Promise<Response> {
        try {
            this.logger.info('Starting code generation process');

            const url = new URL(request.url);
            const hostname = url.hostname === 'localhost' ? `localhost:${url.port}`: getPreviewDomain(env);
            // Parse the query from the request body
            let body: CodeGenArgs;
            try {
                body = await request.json() as CodeGenArgs;
            } catch (error) {
                return CodingAgentController.createErrorResponse(`Invalid JSON in request body: ${JSON.stringify(error, null, 2)}`, 400);
            }

            const query = body.query;
            if (!query) {
                return CodingAgentController.createErrorResponse('Missing "query" field in request body', 400);
            }
            const { readable, writable } = new TransformStream({
                transform(chunk, controller) {
                    if (chunk === "terminate") {
                        controller.terminate();
                    } else {
                        const encoded = new TextEncoder().encode(JSON.stringify(chunk) + '\n');
                        controller.enqueue(encoded);
                    }
                }
            });
            const writer = writable.getWriter();
            // Check if user is authenticated (required for app creation)
            const user = context.user!;
            try {
                await RateLimitService.enforceAppCreationRateLimit(env, context.config.security.rateLimit, user, request);
            } catch (error) {
                if (error instanceof Error) {
                    return CodingAgentController.createErrorResponse(error, 429);
                } else {
                    this.logger.error('Unknown error in enforceAppCreationRateLimit', error);
                    return CodingAgentController.createErrorResponse(JSON.stringify(error), 429);
                }
            }

            const agentId = generateId();
            
            // CRITICAL LOG: Verify we reach app creation code
            console.log('[CRITICAL] About to create app record', { agentId, userId: user?.id || 'null', hasUser: !!user });
            this.logger.info('[CRITICAL] About to create app record', { agentId, userId: user?.id || 'null', hasUser: !!user });
            
            // Create app record IMMEDIATELY so frontend can fetch it
            // This prevents 404 errors when frontend tries to fetch app before blueprint completes
            // CRITICAL: This MUST succeed - retry up to 3 times if it fails
            const appService = new AppService(env);
            const userId = user?.id || null;
            let appCreated = false;
            let lastError: unknown = null;
            
            console.log('[CRITICAL] Starting app creation retry loop', { agentId, userId, attempt: 1 });
            // Retry app creation up to 3 times
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`[CRITICAL] App creation attempt ${attempt}/3`, { agentId, userId });
                try {
                    await appService.createApp({
                        id: agentId,
                        userId: userId, // Can be null for anonymous users (if route allows it)
                        sessionToken: null,
                        title: query.substring(0, 100), // Temporary, will be updated with blueprint title
                        description: null,
                        originalPrompt: query,
                        finalPrompt: query,
                        framework: null, // Will be updated when blueprint completes
                        visibility: 'private' as const,
                        status: 'generating' as const,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    appCreated = true;
                    this.logger.info(`[createApp] App record created immediately for agent: ${agentId} (attempt ${attempt})`, {
                        agentId,
                        userId: userId ? `${userId.substring(0, 8)}...` : 'null (anonymous)',
                        attempt,
                        timestamp: new Date().toISOString()
                    });
                    console.log('[CRITICAL] ✅ App record created successfully in database', { agentId, userId: userId || 'anonymous', attempt });
                    console.log('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - PROGRESS: App record created in database', { agentId, userId: userId || 'anonymous', attempt });
                    break; // Success - exit retry loop
                } catch (error) {
                    lastError = error;
                    const errorDetails = error instanceof Error ? {
                        message: error.message,
                        name: error.name,
                        stack: error.stack?.split('\n').slice(0, 3).join('\n')
                    } : { error: String(error) };
                    
                    console.error(`[CRITICAL] ❌ App creation attempt ${attempt}/3 FAILED`, { agentId, userId, error: errorDetails });
                    this.logger.warn(`[createApp] Failed to create app record immediately for agent ${agentId} (attempt ${attempt}/3)`, {
                        agentId,
                        userId: userId ? `${userId.substring(0, 8)}...` : 'null (anonymous)',
                        attempt,
                        error: errorDetails,
                        timestamp: new Date().toISOString()
                    });
                    
                    // If this is the last attempt, log as error
                    if (attempt === 3) {
                        this.logger.error(`[createApp] CRITICAL: Failed to create app record after 3 attempts for agent ${agentId}`, {
                            agentId,
                            userId: userId ? `${userId.substring(0, 8)}...` : 'null (anonymous)',
                            error: errorDetails,
                            timestamp: new Date().toISOString()
                        });
                        console.error('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - ERROR: Failed to create app record after 3 attempts', { 
                            agentId, 
                            userId: user?.id || 'anonymous',
                            error: errorDetails 
                        });
                    } else {
                        // Wait before retry (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
                    }
                }
            }
            
            // If app creation failed after all retries, this is critical but we continue
            // The app will be created in saveToDatabase() as a fallback
            if (!appCreated) {
                this.logger.error(`[createApp] CRITICAL: App record creation failed for agent ${agentId} - will retry in saveToDatabase()`, {
                    agentId,
                    userId: userId ? `${userId.substring(0, 8)}...` : 'null (anonymous)',
                    lastError: lastError instanceof Error ? lastError.message : String(lastError)
                });
            }
            
            const modelConfigService = new ModelConfigService(env);
                                
            // Fetch all user model configs, api keys and agent instance at once
            const [userConfigsRecord, agentInstance] = await Promise.all([
                modelConfigService.getUserModelConfigs(user.id),
                getAgentStub(env, agentId)
            ]);
                                
            // Convert Record to Map and extract only ModelConfig properties
            const userModelConfigs = new Map();
            for (const [actionKey, mergedConfig] of Object.entries(userConfigsRecord)) {
                if (mergedConfig.isUserOverride) {
                    const modelConfig: ModelConfig = {
                        name: mergedConfig.name,
                        max_tokens: mergedConfig.max_tokens,
                        temperature: mergedConfig.temperature,
                        reasoning_effort: mergedConfig.reasoning_effort,
                        fallbackModel: mergedConfig.fallbackModel
                    };
                    userModelConfigs.set(actionKey, modelConfig);
                }
            }

            const inferenceContext = {
                userModelConfigs: Object.fromEntries(userModelConfigs),
                agentId: agentId,
                userId: user.id,
                enableRealtimeCodeFix: false, // This costs us too much, so disabled it for now
                enableFastSmartCodeFix: false,
            }
                                
            this.logger.info(`Initialized inference context for user ${user.id}`, {
                modelConfigsCount: Object.keys(userModelConfigs).length,
            });

            const { templateDetails, selection } = await getTemplateForQuery(env, inferenceContext, query, body.images, this.logger);

            const websocketUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/api/agent/${agentId}/ws`;
            const httpStatusUrl = `${url.origin}/api/agent/${agentId}`;

            let uploadedImages: ProcessedImageAttachment[] = [];
            if (body.images) {
                uploadedImages = await Promise.all(body.images.map(async (image) => {
                    return uploadImage(env, image, ImageType.UPLOADS);
                }));
            }
        
            console.log('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - COMPLETE: Session created, template selected', { agentId, templateName: templateDetails.name });
            writer.write({
                message: 'Code generation started',
                agentId: agentId,
                websocketUrl,
                httpStatusUrl,
                template: {
                    name: templateDetails.name,
                    files: getTemplateImportantFiles(templateDetails),
                }
            });

            console.log('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - START: Beginning blueprint generation', { agentId, queryLength: query.length });
            const agentPromise = agentInstance.initialize({
                query,
                language: body.language || defaultCodeGenArgs.language,
                frameworks: body.frameworks || defaultCodeGenArgs.frameworks,
                hostname,
                inferenceContext,
                images: uploadedImages,
                onBlueprintChunk: (chunk: string) => {
                    console.log(`[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS: Blueprint chunk received`, { chunkLength: chunk.length });
                    console.log(`[CALLBACK_CHAIN] onBlueprintChunk() called in controller. Chunk length: ${chunk.length}, preview: ${chunk.substring(0, 100)}...`);
                    console.log(`[CALLBACK_CHAIN] About to call writer.write({chunk})...`);
                    try {
                        writer.write({chunk});
                        console.log(`[CALLBACK_CHAIN] ✅ writer.write({chunk}) completed successfully`);
                    } catch (writeError) {
                        console.error(`[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - ERROR: Failed to write chunk`, writeError);
                        console.error(`[CALLBACK_CHAIN] ❌ ERROR in writer.write({chunk}):`, writeError);
                        throw writeError;
                    }
                },
                templateInfo: { templateDetails, selection },
            }, body.agentMode || defaultCodeGenArgs.agentMode) as Promise<CodeGenState>;
            agentPromise.then(async (_state: CodeGenState) => {
                writer.write("terminate");
                writer.close();
                this.logger.info(`Agent ${agentId} terminated successfully`);
            });

            this.logger.info(`Agent ${agentId} init launched successfully`);
            
            return new Response(readable, {
                status: 200,
                headers: {
                    // Use SSE content-type to ensure Cloudflare disables buffering,
                    // while the payload remains NDJSON lines consumed by the client.
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    // Prevent intermediary caches/proxies from buffering or transforming
                    'Cache-Control': 'no-cache, no-store, must-revalidate, no-transform',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        } catch (error) {
            this.logger.error('Error starting code generation', error);
            return CodingAgentController.handleError(error, 'start code generation');
        }
    }

    /**
     * Handle WebSocket connections for code generation
     * This routes the WebSocket connection directly to the Agent
     */
    static async handleWebSocketConnection(
        request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<Response> {
        try {
            const chatId = context.pathParams.agentId; // URL param is still agentId for backward compatibility
            if (!chatId) {
                return CodingAgentController.createErrorResponse('Missing agent ID parameter', 400);
            }

            // Ensure the request is a WebSocket upgrade request
            if (request.headers.get('Upgrade') !== 'websocket') {
                return new Response('Expected WebSocket upgrade', { status: 426 });
            }
            
            // Validate WebSocket origin
            if (!validateWebSocketOrigin(request, env)) {
                return new Response('Forbidden: Invalid origin', { status: 403 });
            }

            // Extract user (optional - route is public, supports anonymous users)
            const user = context.user || null;

            // For anonymous users, verify they can access this agent (created recently)
            if (!user) {
                const canAccess = await CodingAgentController.verifyAnonymousAccess(chatId, env);
                if (!canAccess) {
                    this.logger.warn(`Anonymous access denied for agent: ${chatId}`, {
                        reason: 'Agent not found or access expired (> 1 hour since creation)'
                    });
                    return CodingAgentController.createErrorResponse(
                        'Anonymous access expired. Please log in to continue, or reconnect within 1 hour of creation.',
                        401
                    );
                }
                this.logger.info(`Anonymous WebSocket connection allowed for agent: ${chatId}`);
            }

            this.logger.info(`WebSocket connection request for chat: ${chatId}`, {
                userId: user?.id || 'anonymous',
                isAnonymous: !user
            });
            
            // Log request details for debugging
            const headers: Record<string, string> = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });
            this.logger.info('WebSocket request details', {
                headers,
                url: request.url,
                chatId
            });

            try {
                // Get the agent instance to handle the WebSocket connection
                const agentInstance = await getAgentStub(env, chatId);
                
                this.logger.info(`Successfully got agent instance for chat: ${chatId}`);

                // Let the agent handle the WebSocket connection directly
                return agentInstance.fetch(request);
            } catch (error) {
                this.logger.error(`Failed to get agent instance with ID ${chatId}:`, error);
                // Return an appropriate WebSocket error response
                // We need to emulate a WebSocket response even for errors
                const { 0: client, 1: server } = new WebSocketPair();

                server.accept();
                server.send(JSON.stringify({
                    type: WebSocketMessageResponses.ERROR,
                    error: `Failed to get agent instance: ${error instanceof Error ? error.message : String(error)}`
                }));

                server.close(1011, 'Agent instance not found');

                return new Response(null, {
                    status: 101,
                    webSocket: client
                });
            }
        } catch (error) {
            this.logger.error('Error handling WebSocket connection', error);
            return CodingAgentController.handleError(error, 'handle WebSocket connection');
        }
    }

    /**
     * Verify that an anonymous user can access an agent
     * Allows access if agent was created recently (< 1 hour ago) and belongs to anonymous user
     */
    private static async verifyAnonymousAccess(
        agentId: string,
        env: Env
    ): Promise<boolean> {
        try {
            const appService = new AppService(env);
            const app = await appService.getAppDetails(agentId, undefined);
            
            if (!app) {
                this.logger.warn(`Agent not found for anonymous access check: ${agentId}`);
                return false; // Agent doesn't exist
            }
            
            // Check if agent belongs to anonymous user (userId is null)
            if (app.userId) {
                this.logger.warn(`Agent ${agentId} belongs to authenticated user, anonymous access denied`);
                return false; // Agent belongs to an authenticated user
            }
            
            // Check if agent was created recently (within 1 hour)
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            const createdAt = app.createdAt?.getTime() || 0;
            
            if (createdAt === 0) {
                this.logger.warn(`Agent ${agentId} has no creation timestamp`);
                return false; // No creation time - deny access
            }
            
            const isRecent = createdAt > oneHourAgo;
            
            if (!isRecent) {
                this.logger.info(`Anonymous access expired for agent: ${agentId}`, {
                    createdAt: new Date(createdAt).toISOString(),
                    hoursAgo: ((Date.now() - createdAt) / (60 * 60 * 1000)).toFixed(2)
                });
            }
            
            return isRecent;
        } catch (error) {
            this.logger.error('Error verifying anonymous access', {
                agentId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false; // Deny on error for security
        }
    }

    /**
     * Connect to an existing agent instance
     * Returns connection information for an already created agent
     */
    static async connectToExistingAgent(
        request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<AgentConnectionData>>> {
        try {
            const agentId = context.pathParams.agentId;
            if (!agentId) {
                return CodingAgentController.createErrorResponse<AgentConnectionData>('Missing agent ID parameter', 400);
            }

            this.logger.info(`Connecting to existing agent: ${agentId}`);

            try {
                // Verify the agent instance exists
                const agentInstance = await getAgentStub(env, agentId);
                if (!agentInstance || !(await agentInstance.isInitialized())) {
                    return CodingAgentController.createErrorResponse<AgentConnectionData>('Agent instance not found or not initialized', 404);
                }
                this.logger.info(`Successfully connected to existing agent: ${agentId}`);

                // Construct WebSocket URL
                const url = new URL(request.url);
                const websocketUrl = `${url.protocol === 'https:' ? 'wss:' : 'ws:'}//${url.host}/api/agent/${agentId}/ws`;

                const responseData: AgentConnectionData = {
                    websocketUrl,
                    agentId,
                };

                return CodingAgentController.createSuccessResponse(responseData);
            } catch (error) {
                this.logger.error(`Failed to connect to agent ${agentId}:`, error);
                return CodingAgentController.createErrorResponse<AgentConnectionData>(`Agent instance not found or unavailable: ${error instanceof Error ? error.message : String(error)}`, 404);
            }
        } catch (error) {
            this.logger.error('Error connecting to existing agent', error);
            return CodingAgentController.handleError(error, 'connect to existing agent') as ControllerResponse<ApiResponse<AgentConnectionData>>;
        }
    }

    static async deployPreview(
        _request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<AgentPreviewResponse>>> {
        try {
            const agentId = context.pathParams.agentId;
            if (!agentId) {
                return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Missing agent ID parameter', 400);
            }

            this.logger.info(`Deploying preview for agent: ${agentId}`);

            try {
                // Get the agent instance
                const agentInstance = await getAgentStub(env, agentId);
                
                // Deploy the preview
                const preview = await agentInstance.deployToSandbox();
                if (!preview) {
                    return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Failed to deploy preview', 500);
                }
                this.logger.info('Preview deployed successfully', {
                    agentId,
                    previewUrl: preview.previewURL
                });

                return CodingAgentController.createSuccessResponse(preview);
            } catch (error) {
                this.logger.error('Failed to deploy preview', { agentId, error });
                return CodingAgentController.createErrorResponse<AgentPreviewResponse>('Failed to deploy preview', 500);
            }
        } catch (error) {
            this.logger.error('Error deploying preview', error);
            const appError = CodingAgentController.handleError(error, 'deploy preview') as ControllerResponse<ApiResponse<AgentPreviewResponse>>;
            return appError;
        }
    }

    /**
     * Trigger code generation via HTTP (fallback when WebSocket fails)
     * POST /api/agent/:agentId/generate
     */
    static async triggerCodeGeneration(
        request: Request,
        env: Env,
        _: ExecutionContext,
        context: RouteContext
    ): Promise<ControllerResponse<ApiResponse<{ message: string; agentId: string }>>> {
        try {
            const agentId = context.pathParams.agentId;
            if (!agentId) {
                return CodingAgentController.createErrorResponse('Missing agent ID parameter', 400);
            }

            this.logger.info(`Triggering code generation via HTTP for agent: ${agentId}`);

            try {
                // Get the agent instance
                const agentInstance = await getAgentStub(env, agentId);
                
                // Check if agent is initialized
                const isInitialized = await agentInstance.isInitialized();
                
                if (!isInitialized) {
                    // Agent not initialized - initialize it first using app data
                    this.logger.info(`Agent ${agentId} not initialized, initializing from app data...`);
                    
                    // Get app details to retrieve original prompt and user info
                    const appService = new AppService(env);
                    const app = await appService.getAppDetails(agentId, context.user?.id || undefined);
                    
                    if (!app) {
                        return CodingAgentController.createErrorResponse(`App not found for agent ${agentId}`, 404);
                    }
                    
                    // Get user for model configs (if authenticated)
                    const user = context.user;
                    let userModelConfigs = new Map();
                    let inferenceContext: InferenceContext;
                    
                    if (user?.id) {
                        const modelConfigService = new ModelConfigService(env);
                        const userConfigsRecord = await modelConfigService.getUserModelConfigs(user.id);
                        
                        for (const [actionKey, mergedConfig] of Object.entries(userConfigsRecord)) {
                            if (mergedConfig.isUserOverride) {
                                const modelConfig: ModelConfig = {
                                    name: mergedConfig.name,
                                    max_tokens: mergedConfig.max_tokens,
                                    temperature: mergedConfig.temperature,
                                    reasoning_effort: mergedConfig.reasoning_effort,
                                    fallbackModel: mergedConfig.fallbackModel
                                };
                                userModelConfigs.set(actionKey, modelConfig);
                            }
                        }
                        
                        inferenceContext = {
                            userModelConfigs: Object.fromEntries(userModelConfigs),
                            agentId: agentId,
                            userId: user.id,
                            enableRealtimeCodeFix: false,
                            enableFastSmartCodeFix: false,
                        };
                    } else {
                        // Anonymous user - use minimal inference context
                        // For anonymous users, we need a userId - use the agentId as a placeholder
                        // This allows the agent to work without a real user ID
                        const emptyModelConfigs = new Map<string, ModelConfig>();
                        inferenceContext = {
                            userModelConfigs: Object.fromEntries(emptyModelConfigs) as Record<string, ModelConfig>,
                            agentId: agentId,
                            userId: `anonymous-${agentId}`, // Use agentId as placeholder for anonymous users
                            enableRealtimeCodeFix: false,
                            enableFastSmartCodeFix: false,
                        };
                    }
                    
                    // Get template for the query
                    const url = new URL(request.url);
                    const hostname = url.hostname === 'localhost' ? `localhost:${url.port}`: getPreviewDomain(env);
                    const { templateDetails, selection } = await getTemplateForQuery(
                        env, 
                        inferenceContext, 
                        app.originalPrompt, 
                        undefined, // No images available in fallback
                        this.logger
                    );
                    
                    // Initialize the agent (non-blocking)
                    console.log('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - PROGRESS: Initializing agent from app data', { agentId });
                    agentInstance.initialize({
                        query: app.originalPrompt,
                        language: 'typescript', // Default
                        frameworks: app.framework ? [app.framework] : ['react'], // Use app framework or default
                        hostname,
                        inferenceContext,
                        images: [], // No images in fallback
                        onBlueprintChunk: () => {
                            // No-op for HTTP fallback - blueprint already generated
                        },
                        templateInfo: { templateDetails, selection },
                    }, 'deterministic' as any).catch((error) => {
                        this.logger.error('Error initializing agent in HTTP fallback:', error);
                        console.error('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - ERROR: Agent initialization failed', error);
                    });
                    
                    // Wait a moment for initialization to start, then trigger generation
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check if initialized now
                    const nowInitialized = await agentInstance.isInitialized();
                    if (!nowInitialized) {
                        this.logger.warn(`Agent ${agentId} still not initialized after 1s, proceeding anyway...`);
                    }
                }

                // Trigger code generation (non-blocking - it runs in background)
                console.log('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - START: Triggering code generation via HTTP');
                agentInstance.generateAllFiles().catch((error) => {
                    this.logger.error('Error during HTTP-triggered code generation:', error);
                    console.error('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - ERROR: Code generation failed', error);
                });

                this.logger.info('Code generation triggered successfully via HTTP', { agentId });

                return CodingAgentController.createSuccessResponse({
                    message: isInitialized ? 'Code generation started' : 'Agent initialized and code generation started',
                    agentId,
                });
            } catch (error) {
                this.logger.error(`Failed to trigger code generation for agent ${agentId}:`, error);
                return CodingAgentController.createErrorResponse(`Failed to trigger code generation: ${error instanceof Error ? error.message : String(error)}`, 500);
            }
        } catch (error) {
            this.logger.error('Error triggering code generation', error);
            return CodingAgentController.handleError(error, 'trigger code generation') as ControllerResponse<ApiResponse<{ message: string; agentId: string }>>;
        }
    }
}