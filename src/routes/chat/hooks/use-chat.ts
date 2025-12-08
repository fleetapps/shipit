import { WebSocket } from 'partysocket';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    RateLimitExceededError,
	type BlueprintType,
	type WebSocketMessage,
	type CodeFixEdits,
	type ImageAttachment
} from '@/api-types';
import {
	createRepairingJSONParser,
	ndjsonStream,
} from '@/utils/ndjson-parser/ndjson-parser';
import { getFileType } from '@/utils/string';
import { logger } from '@/utils/logger';
import { apiClient } from '@/lib/api-client';
import { appEvents } from '@/lib/app-events';
import { createWebSocketMessageHandler, type HandleMessageDeps } from '../utils/handle-websocket-message';
import { isConversationalMessage, addOrUpdateMessage, createUserMessage, handleRateLimitError, createAIMessage, type ChatMessage } from '../utils/message-helpers';
import { sendWebSocketMessage } from '../utils/websocket-helpers';
import { initialStages as defaultStages, updateStage as updateStageHelper } from '../utils/project-stage-helpers';
import type { ProjectStage } from '../utils/project-stage-helpers';


export interface FileType {
	filePath: string;
	fileContents: string;
	explanation?: string;
	isGenerating?: boolean;
	needsFixing?: boolean;
	hasErrors?: boolean;
	language?: string;
}

// New interface for phase timeline tracking
export interface PhaseTimelineItem {
	id: string;
	name: string;
	description: string;
	files: {
		path: string;
		purpose: string;
		status: 'generating' | 'completed' | 'error' | 'validating' | 'cancelled';
		contents?: string;
	}[];
	status: 'generating' | 'completed' | 'error' | 'validating' | 'cancelled';
	timestamp: number;
}

export function useChat({
	chatId: urlChatId,
	query: userQuery,
	images: userImages,
	agentMode = 'deterministic',
	onDebugMessage,
	onTerminalMessage,
	refetchApp,
}: {
	chatId?: string;
	query: string | null;
	images?: ImageAttachment[];
	agentMode?: 'deterministic' | 'smart';
	onDebugMessage?: (type: 'error' | 'warning' | 'info' | 'websocket', message: string, details?: string, source?: string, messageType?: string, rawMessage?: unknown) => void;
	onTerminalMessage?: (log: { id: string; content: string; type: 'command' | 'stdout' | 'stderr' | 'info' | 'error' | 'warn' | 'debug'; timestamp: number; source?: string }) => void;
	refetchApp?: () => Promise<void>;
}) {
	const connectionStatus = useRef<'idle' | 'connecting' | 'connected' | 'failed' | 'retrying'>('idle');
	const retryCount = useRef(0);
	const maxRetries = 5;
	const retryTimeouts = useRef<NodeJS.Timeout[]>([]);
	// Track whether component is mounted and should attempt reconnects
	const shouldReconnectRef = useRef(true);
	// Track the latest connection attempt to avoid handling stale socket events
	const connectAttemptIdRef = useRef(0);
	// Track if HTTP fallback has already been triggered to prevent duplicate calls
	const httpFallbackTriggered = useRef<Set<string>>(new Set());
	const [chatId, setChatId] = useState<string>();
	const [messages, setMessages] = useState<ChatMessage[]>([
		createAIMessage('main', 'Thinking...', true),
	]);

	const [bootstrapFiles, setBootstrapFiles] = useState<FileType[]>([]);
	const [blueprint, setBlueprint] = useState<BlueprintType>();
	const [blueprintMarkdown, setBlueprintMarkdown] = useState<string>('');
	const [previewUrl, setPreviewUrl] = useState<string>();
	const [query, setQuery] = useState<string>();

	const [websocket, setWebsocket] = useState<WebSocket>();

	const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
	const [isBootstrapping, setIsBootstrapping] = useState(true);

	const [projectStages, setProjectStages] = useState<ProjectStage[]>(defaultStages);

	// New state for phase timeline tracking
	const [phaseTimeline, setPhaseTimeline] = useState<PhaseTimelineItem[]>([]);

	const [files, setFiles] = useState<FileType[]>([]);

	const [totalFiles, setTotalFiles] = useState<number>();

	const [edit, setEdit] = useState<Omit<CodeFixEdits, 'type'>>();

	// Deployment and generation control state
	const [isDeploying, setIsDeploying] = useState(false);
	const [cloudflareDeploymentUrl, setCloudflareDeploymentUrl] = useState<string>('');
	const [deploymentError, setDeploymentError] = useState<string>();
	
	// Issue tracking and debugging state
	const [runtimeErrorCount, setRuntimeErrorCount] = useState(0);
	const [staticIssueCount, setStaticIssueCount] = useState(0);
	const [isDebugging, setIsDebugging] = useState(false);
	
	// Preview deployment state
	const [isPreviewDeploying, setIsPreviewDeploying] = useState(false);
	
	// Redeployment state - tracks when redeploy button should be enabled
	const [isRedeployReady, setIsRedeployReady] = useState(false);
	// const [lastDeploymentPhaseCount, setLastDeploymentPhaseCount] = useState(0);
	const [isGenerationPaused, setIsGenerationPaused] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// Phase progress visual indicator (used to apply subtle throb on chat)
	const [isPhaseProgressActive, setIsPhaseProgressActive] = useState(false);

	const [isThinking, setIsThinking] = useState(false);
	
	// Preview refresh state - triggers preview reload after deployment
	const [shouldRefreshPreview, setShouldRefreshPreview] = useState(false);
	
	// Track whether we've completed initial state restoration to avoid disrupting active sessions
	const [isInitialStateRestored, setIsInitialStateRestored] = useState(false);

	const updateStage = useCallback(
		(stageId: ProjectStage['id'], data: Partial<Omit<ProjectStage, 'id'>>) => {
			logger.debug('updateStage', { stageId, ...data });
			setProjectStages(prev => updateStageHelper(prev, stageId, data));
		},
		[],
	);

	const onCompleteBootstrap = useCallback(() => {
		updateStage('bootstrap', { status: 'completed' });
	}, [updateStage]);

	const clearEdit = useCallback(() => {
		setEdit(undefined);
	}, []);


	const sendMessage = useCallback((message: ChatMessage) => {
		// Only add conversational messages to the chat UI
		if (!isConversationalMessage(message.conversationId)) return;
		setMessages((prev: ChatMessage[]) => addOrUpdateMessage(prev, message));
	}, []);

	const sendUserMessage = useCallback((message: string) => {
		setMessages(prev => [...prev, createUserMessage(message)]);
	}, []);

	const loadBootstrapFiles = (files: FileType[]) => {
		setBootstrapFiles((prev) => [
			...prev,
			...files.map((file) => ({
				...file,
				language: getFileType(file.filePath),
			})),
		]);
	};

	// Create the WebSocket message handler
	const handleWebSocketMessage = useCallback(
		createWebSocketMessageHandler({
			// State setters
			setFiles,
			setPhaseTimeline,
			setProjectStages,
			setMessages,
			setBlueprint,
			setBlueprintMarkdown,
			setQuery,
			setPreviewUrl,
			setTotalFiles,
			setIsRedeployReady,
			setIsPreviewDeploying,
			setIsThinking,
			setIsInitialStateRestored,
			setShouldRefreshPreview,
			setIsDeploying,
			setCloudflareDeploymentUrl,
			setDeploymentError,
			setIsGenerationPaused,
			setIsGenerating,
			setIsPhaseProgressActive,
			setRuntimeErrorCount,
			setStaticIssueCount,
			setIsDebugging,
			// Current state
			isInitialStateRestored,
			blueprint,
			query,
			bootstrapFiles,
			files,
			phaseTimeline,
			previewUrl,
			projectStages,
			isGenerating,
			urlChatId,
			// Functions
			updateStage,
			sendMessage,
			loadBootstrapFiles,
			refetchApp,
			onDebugMessage,
			onTerminalMessage,
		} as HandleMessageDeps),
		[
			isInitialStateRestored,
			blueprint,
			query,
			bootstrapFiles,
			files,
			phaseTimeline,
			previewUrl,
			projectStages,
			isGenerating,
			urlChatId,
			updateStage,
			sendMessage,
			loadBootstrapFiles,
			onDebugMessage,
			onTerminalMessage,
		]
	);

	// Helper function to extract auth token from multiple sources (matching server-side authUtils logic)
	const getAuthToken = useCallback((): string | null => {
		// Priority 1: Check cookies (matching server-side authUtils.ts extractToken logic)
		const cookieHeader = document.cookie;
		if (cookieHeader) {
			const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
				const [key, value] = cookie.trim().split('=');
				if (key && value) {
					acc[key] = decodeURIComponent(value);
				}
				return acc;
			}, {} as Record<string, string>);

			// Check common cookie names in order of preference (matching server-side)
			// Also check for session cookie which is used for authentication
			// Note: accessToken is HttpOnly, so check accessTokenReadable first (non-HttpOnly fallback)
			const cookieNames = ['accessTokenReadable', 'accessToken', 'auth_token', 'jwt', 'token', 'session'];
			for (const cookieName of cookieNames) {
				if (cookies[cookieName]) {
					logger.debug('🔐 Found auth token in cookie:', cookieName);
					return cookies[cookieName];
				}
			}
			
			// Log all available cookies for debugging
			logger.debug('📋 Available cookies:', Object.keys(cookies));
		}
		
		// Priority 2: Check localStorage as fallback
		const localStorageToken = localStorage.getItem('accessToken') || 
		                          localStorage.getItem('auth_token') || 
		                          localStorage.getItem('jwt') ||
		                          localStorage.getItem('token');
		if (localStorageToken) {
			logger.debug('🔐 Found auth token in localStorage');
			return localStorageToken;
		}
		
		logger.warn('⚠️ No authentication token found in cookies or localStorage');
		logger.warn('📋 Full cookie string:', document.cookie);
		return null;
	}, []);

	// WebSocket connection with retry logic
	const connectWithRetry = useCallback(
		(
			wsUrl: string,
			{ disableGenerate = false, isRetry = false }: { disableGenerate?: boolean; isRetry?: boolean } = {},
		) => {
			logger.debug(`🔌 ${isRetry ? 'Retrying' : 'Attempting'} WebSocket connection (attempt ${retryCount.current + 1}/${maxRetries + 1}):`, wsUrl);
			
			if (!wsUrl) {
				logger.error('❌ WebSocket URL is required');
				return;
			}

			connectionStatus.current = isRetry ? 'retrying' : 'connecting';

			// Extract auth token and append to WebSocket URL as query parameter
			// This matches the server-side authUtils.ts extractToken logic (Priority 3: Query parameter)
			const authToken = getAuthToken();
			let finalWsUrl = wsUrl;
			if (authToken) {
				const url = new URL(wsUrl);
				url.searchParams.set('token', authToken);
				finalWsUrl = url.toString();
				logger.debug('🔐 Added authentication token to WebSocket URL');
			} else {
				logger.warn('⚠️ No authentication token found in cookies, WebSocket may fail authentication');
			}

			try {
				logger.debug('🔗 Attempting WebSocket connection to:', finalWsUrl);
				const ws = new WebSocket(finalWsUrl);
				setWebsocket(ws);

				// Mark this attempt id
				const myAttemptId = ++connectAttemptIdRef.current;

				// Connection timeout - if connection doesn't open within 30 seconds
				const connectionTimeout = setTimeout(() => {
					// Only handle timeout for the latest attempt
					if (myAttemptId !== connectAttemptIdRef.current) return;
					if (ws.readyState === WebSocket.CONNECTING) {
						logger.warn('⏰ WebSocket connection timeout');
						ws.close();
			handleConnectionFailure(finalWsUrl, disableGenerate, 'Connection timeout');
				}
			}, 30000);

				ws.addEventListener('open', () => {
					// Ignore stale open events
					if (!shouldReconnectRef.current) {
						ws.close();
						return;
					}
					if (myAttemptId !== connectAttemptIdRef.current) return;
					
					clearTimeout(connectionTimeout);
					console.log('[FLOW_STEP_4] STEP 4: WebSocket Connection - COMPLETE: Connection established successfully');
					logger.info('✅ WebSocket connection established successfully!');
					connectionStatus.current = 'connected';
					
					// Reset retry count on successful connection
					retryCount.current = 0;
					
					// Clear any pending retry timeouts
					retryTimeouts.current.forEach(clearTimeout);
					retryTimeouts.current = [];

					// Send success message to user
					if (isRetry) {
						// Clear old messages on reconnect to prevent duplicates
						setMessages(() => [
							createAIMessage('websocket_reconnected', 'Seems we lost connection for a while there. Fixed now!', true)
						]);
					}

					// Always request conversation state explicitly (running/full history)
					sendWebSocketMessage(ws, 'get_conversation_state');

					// Request file generation for new chats only
					if (!disableGenerate && urlChatId === 'new') {
						console.log('[FLOW_STEP_5] STEP 5: Code Generation → WebSocket Messages - START: Requesting code generation');
						logger.debug('🔄 Starting code generation for new chat');
						sendWebSocketMessage(ws, 'generate_all');
					}
				});

				ws.addEventListener('message', (event) => {
					try {
						const message: WebSocketMessage = JSON.parse(event.data);
						handleWebSocketMessage(ws, message);
					} catch (parseError) {
						logger.error('❌ Error parsing WebSocket message:', parseError, event.data);
					}
				});

				ws.addEventListener('error', (error) => {
					clearTimeout(connectionTimeout);
					// Only handle error for the latest attempt and when we should reconnect
					if (myAttemptId !== connectAttemptIdRef.current) return;
					if (!shouldReconnectRef.current) return;
					logger.error('❌ WebSocket error:', error);
					handleConnectionFailure(finalWsUrl, disableGenerate, 'WebSocket error');
				});

				ws.addEventListener('close', (event) => {
					clearTimeout(connectionTimeout);
					logger.info(
						`🔌 WebSocket connection closed with code ${event.code}: ${event.reason || 'No reason provided'}`,
						event,
					);
					// Only handle close for the latest attempt and when we should reconnect
					if (myAttemptId !== connectAttemptIdRef.current) return;
					if (!shouldReconnectRef.current) return;
					// Retry on any close while mounted (including 1000) to improve resilience
					handleConnectionFailure(finalWsUrl, disableGenerate, `Connection closed (code: ${event.code})`);
				});

				return function disconnect() {
					clearTimeout(connectionTimeout);
					ws.close();
				};
			} catch (error) {
				logger.error('❌ Error establishing WebSocket connection:', error);
				handleConnectionFailure(finalWsUrl, disableGenerate, 'Connection setup failed');
			}
		},
		[retryCount, maxRetries, retryTimeouts, getAuthToken],
	);

	// Handle connection failures with exponential backoff retry
	const handleConnectionFailure = useCallback(
		(wsUrl: string, disableGenerate: boolean, reason: string) => {
			connectionStatus.current = 'failed';
			
			if (retryCount.current >= maxRetries) {
				console.error(`[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR: Failed permanently after ${maxRetries + 1} attempts. Reason: ${reason}`);
				logger.error(`💥 WebSocket connection failed permanently after ${maxRetries + 1} attempts`);
				sendMessage(createAIMessage('websocket_failed', `🚨 WebSocket connection failed after ${maxRetries + 1} attempts.\n\n⚠️ Switching to HTTP fallback for code generation...\n\n❌ Reason: ${reason}`));
				
				// Debug logging for permanent failure
				onDebugMessage?.('error',
					'WebSocket Connection Failed Permanently',
					`Failed after ${maxRetries + 1} attempts. Reason: ${reason}`,
					'WebSocket Resilience'
				);
				
				// HTTP FALLBACK: Trigger code generation via HTTP if WebSocket fails permanently
				// Only for new chats that need code generation
				// Extract agentId from WebSocket URL (format: /api/agent/{agentId}/ws)
				const agentIdMatch = wsUrl.match(/\/api\/agent\/([^/]+)\/ws/);
				const agentId = agentIdMatch ? agentIdMatch[1] : (chatId || urlChatId);
				
				// CRITICAL: Prevent duplicate HTTP fallback triggers for the same agentId
				// This prevents multiple LLM calls when WebSocket fails multiple times
				if (!disableGenerate && urlChatId === 'new' && agentId && !httpFallbackTriggered.current.has(agentId)) {
					// Mark this agentId as having triggered HTTP fallback
					httpFallbackTriggered.current.add(agentId);
					
					console.log('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - START: WebSocket failed, using HTTP fallback', { agentId });
					logger.info('🔄 WebSocket failed permanently, triggering code generation via HTTP fallback', { agentId });
					
					// Trigger code generation via HTTP
					apiClient.triggerCodeGeneration(agentId)
						.then((response) => {
							if (response.success) {
								console.log('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - COMPLETE: Code generation started via HTTP');
								logger.info('✅ Code generation started successfully via HTTP fallback');
								sendMessage(createAIMessage('code_generation_http', '✅ Code generation started via HTTP (WebSocket unavailable). Progress updates may be limited.'));
								updateStage('code', { status: 'active' });
							} else {
								console.error('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - ERROR: Failed to start code generation via HTTP');
								logger.error('❌ Failed to trigger code generation via HTTP fallback:', response.error);
								// Remove from set so user can retry
								httpFallbackTriggered.current.delete(agentId);
								sendMessage(createAIMessage('code_generation_failed', `❌ Failed to start code generation:\n\n${response.error?.message || 'Unknown error'}\n\n🔄 Please refresh the page to try again.`));
							}
						})
						.catch((error) => {
							console.error('[FLOW_STEP_5] STEP 5: Code Generation → HTTP Fallback - ERROR: Exception during HTTP fallback', error);
							logger.error('❌ Exception triggering code generation via HTTP fallback:', error);
							// Remove from set so user can retry
							httpFallbackTriggered.current.delete(agentId);
							sendMessage(createAIMessage('code_generation_failed', `❌ Failed to start code generation:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 Please refresh the page to try again.`));
						});
				} else if (agentId && httpFallbackTriggered.current.has(agentId)) {
					// HTTP fallback already triggered for this agentId - log but don't trigger again
					logger.debug('⚠️ HTTP fallback already triggered for this agentId, skipping duplicate call', { agentId });
				}
				
				return;
			}

			retryCount.current++;
			
			// Exponential backoff: 2^attempt * 1000ms (1s, 2s, 4s, 8s, 16s)
			const retryDelay = Math.pow(2, retryCount.current) * 1000;
			const maxDelay = 30000; // Cap at 30 seconds
			const actualDelay = Math.min(retryDelay, maxDelay);

			logger.warn(`🔄 Retrying WebSocket connection in ${actualDelay / 1000}s (attempt ${retryCount.current + 1}/${maxRetries + 1})`);
			
			sendMessage(createAIMessage('websocket_retrying', `🔄 Connection failed. Retrying in ${Math.ceil(actualDelay / 1000)} seconds... (attempt ${retryCount.current + 1}/${maxRetries + 1})\n\n❌ Reason: ${reason}`, true));

			const timeoutId = setTimeout(() => {
				connectWithRetry(wsUrl, { disableGenerate, isRetry: true });
			}, actualDelay);
			
			retryTimeouts.current.push(timeoutId);
			
			// Debug logging for retry attempt
			onDebugMessage?.('warning',
				'WebSocket Connection Retry',
				`Retry ${retryCount.current}/${maxRetries} in ${actualDelay / 1000}s. Reason: ${reason}`,
				'WebSocket Resilience'
			);
		},
		[maxRetries, retryCount, retryTimeouts, onDebugMessage, sendMessage, urlChatId, chatId, updateStage],
	);

    // No legacy wrapper; call connectWithRetry directly

	useEffect(() => {
		async function init() {
			if (!urlChatId || connectionStatus.current !== 'idle') return;

			try {
				if (urlChatId === 'new') {
					if (!userQuery) {
						const errorMsg = 'Please enter a description of what you want to build';
						logger.error('Query is required for new code generation');
						toast.error(errorMsg);
						return;
					}

					// Start new code generation using API client
					console.log('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - START', { query: userQuery, agentMode, imagesCount: userImages?.length || 0 });
					logger.info('🚀 Starting new agent session creation...', { query: userQuery, agentMode, imagesCount: userImages?.length || 0 });
					let response: Response | null = null;
					try {
						const streamingResponse = await apiClient.createAgentSession({
							query: userQuery,
							agentMode,
							images: userImages, // Pass images from URL params for multi-modal blueprint
						});
						// streamingResponse.stream is a Response object, which ndjsonStream expects
						if (!streamingResponse.stream || !streamingResponse.stream.body) {
							console.error('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - ERROR: No stream body in response');
							logger.error('❌ No stream body in response');
							toast.error('Failed to get stream from server');
							return;
						}
						response = streamingResponse.stream;
						console.log('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - COMPLETE: Session created, stream available');
						logger.info('✅ Agent session created, starting to read stream...');
					} catch (error) {
						console.error('[FLOW_STEP_1] STEP 1: User Enters Prompt → Agent Session Creation - ERROR:', error);
						logger.error('❌ Failed to create agent session:', error);
						const errorMsg = error instanceof Error ? error.message : 'Failed to start code generation';
						toast.error(errorMsg);
						return;
					}

					const result: {
						websocketUrl: string;
						agentId: string;
						template: {
							files: FileType[];
						};
					} = {
						websocketUrl: '',
						agentId: '',
						template: {
							files: [],
						},
					};

					let startedBlueprintStream = false;
					let blueprintChunkCount = 0;
					let blueprintBuffer = '';
					sendMessage(createAIMessage('main', "Sure, let's get started. Bootstrapping the project first...", true));

					if (!response) {
						console.error('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - ERROR: No response stream available');
						logger.error('❌ No response stream available');
						return;
					}
					
					console.log('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - START: Reading NDJSON stream');
					logger.info('📡 Starting to read NDJSON stream from response...');
					let streamObjectCount = 0;
					for await (const obj of ndjsonStream(response)) {
						streamObjectCount++;
                        logger.info(`📦 Received NDJSON object #${streamObjectCount} from server:`, obj);
						if (obj.chunk) {
							blueprintChunkCount++;
							const chunk = String(obj.chunk);
							logger.info(`📄 Blueprint chunk ${blueprintChunkCount} received, length: ${chunk.length}, preview: ${chunk.substring(0, 100)}...`);
							
							if (!startedBlueprintStream) {
								console.log('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - PROGRESS: Blueprint stream started, receiving chunks');
								sendMessage(createAIMessage('main', 'Blueprint is being generated...', true));
								logger.info('Blueprint stream has started');
								setIsBootstrapping(false);
								setIsGeneratingBlueprint(true);
								startedBlueprintStream = true;
								updateStage('bootstrap', { status: 'completed' });
								updateStage('blueprint', { status: 'active' });
							}
							
							// Accumulate chunks as markdown/PRD text
							blueprintBuffer += chunk;
							
							// Update markdown state in real-time for typewriter effect
							setBlueprintMarkdown(blueprintBuffer);
							
							// Check if it looks like JSON (starts with { or [)
							const trimmed = blueprintBuffer.trimStart();
							if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
								// Try to parse as JSON only at the end of stream
								// For now, just accumulate
								logger.debug('📝 Blueprint buffer looks like JSON, will parse at end of stream');
							} else {
								// It's markdown/PRD text - this is expected
								logger.debug('📝 Blueprint buffer is markdown/PRD text (not JSON)');
							}
						} 
						if (obj.agentId) {
							result.agentId = obj.agentId;
						}
						if (obj.websocketUrl) {
							result.websocketUrl = obj.websocketUrl;
							logger.debug('📡 Received WebSocket URL from server:', result.websocketUrl)
						}
						if (obj.template) {
                            logger.debug('Received template from server:', obj.template);
							result.template = obj.template;
							if (obj.template.files) {
								loadBootstrapFiles(obj.template.files);
							}
						}
					}

					console.log('[FLOW_STEP_2] STEP 2: Blueprint Generation → HTTP Stream - COMPLETE', { 
						totalObjects: streamObjectCount,
						blueprintChunks: blueprintChunkCount,
						hasAgentId: !!result.agentId,
						hasWebSocketUrl: !!result.websocketUrl,
						hasTemplate: !!result.template,
						blueprintBufferLength: blueprintBuffer.length
					});
					logger.info('🏁 NDJSON stream completed', { 
						totalObjects: streamObjectCount,
						blueprintChunks: blueprintChunkCount,
						hasAgentId: !!result.agentId,
						hasWebSocketUrl: !!result.websocketUrl,
						hasTemplate: !!result.template,
						blueprintBufferLength: blueprintBuffer.length
					});
					
					// Try to parse blueprint as JSON only if it looks like JSON
					if (blueprintBuffer.trim().length > 0) {
						const trimmed = blueprintBuffer.trimStart();
						if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
							// Try to parse as JSON
							try {
								const parser = createRepairingJSONParser();
								parser.feed(blueprintBuffer);
								const parsed = parser.finalize();
								if (parsed && Object.keys(parsed).length > 0) {
									console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - COMPLETE: Blueprint parsed and displayed', { title: parsed.title });
									logger.info('✅ Blueprint parsed as JSON successfully');
									setBlueprint(parsed);
									setBlueprintMarkdown(''); // Clear markdown when structured blueprint is set
								} else {
									console.warn('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - WARNING: Blueprint parsed but appears empty');
									logger.warn('⚠️ Blueprint parsed but appears empty');
								}
							} catch (e) {
								console.warn('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - WARNING: Failed to parse JSON, will come via WebSocket:', e);
								logger.warn('⚠️ Blueprint buffer looks like JSON but failed to parse, treating as markdown:', e);
								// Blueprint will remain undefined - it will come via WebSocket later
							}
						} else {
							// It's markdown/PRD text - display it immediately with typewriter effect
							console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - PROGRESS: Markdown received, displaying in real-time');
							logger.info('📝 Blueprint is markdown/PRD text (not JSON), displaying markdown with typewriter effect');
							// Markdown is already being updated in real-time via setBlueprintMarkdown above
							// Structured blueprint will come via WebSocket later if available
						}
					}
					
					// Mark blueprint generation as complete (even if we only have markdown)
					if (blueprintChunkCount > 0) {
						console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - COMPLETE: Markdown blueprint displayed, waiting for structured blueprint via WebSocket');
					}
					updateStage('blueprint', { status: 'completed' });
					setIsGeneratingBlueprint(false);
					
					// Log blueprint status
					if (blueprint) {
						// Clear markdown when structured blueprint arrives
						setBlueprintMarkdown('');
						console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - COMPLETE: Structured blueprint displayed successfully');
						logger.info('✅ Blueprint received successfully:', { 
							title: blueprint.title, 
							hasDescription: !!blueprint.description,
							chunkCount: blueprintChunkCount 
						});
					} else if (blueprintChunkCount > 0 && blueprintBuffer.length > 0) {
						console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - PROGRESS: Markdown blueprint displayed, structured blueprint may come via WebSocket');
						logger.info('📝 Blueprint markdown displayed with typewriter effect, structured blueprint will come via WebSocket if available', { 
							chunkCount: blueprintChunkCount,
							bufferLength: blueprintBuffer.length
						});
					} else if (blueprintChunkCount > 0) {
						console.log('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - PROGRESS: Waiting for structured blueprint via WebSocket');
						logger.info('📝 Blueprint chunks received as markdown text, structured blueprint will come via WebSocket', { 
							chunkCount: blueprintChunkCount,
							bufferLength: blueprintBuffer.length
						});
					} else {
						console.error('[FLOW_STEP_3] STEP 3: Blueprint Display → UI Rendering - ERROR: No blueprint chunks received');
						logger.warn('⚠️ No blueprint chunks received', { 
							chunkCount: blueprintChunkCount,
							totalStreamObjects: streamObjectCount,
							receivedObjects: {
								agentId: !!result.agentId,
								websocketUrl: !!result.websocketUrl,
								template: !!result.template,
								chunks: blueprintChunkCount
							}
						});
					}
					
					sendMessage(createAIMessage('main', 'Blueprint generation complete. Now starting the code generation...', true));

					// Connect to WebSocket
					console.log('[FLOW_STEP_4] STEP 4: WebSocket Connection - START', { websocketUrl: result.websocketUrl, agentId: result.agentId });
					logger.debug('connecting to ws with created id:', result.websocketUrl);
					if (!result.websocketUrl) {
						console.error('[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR: No WebSocket URL received from server');
						logger.error('❌ No WebSocket URL received from server');
						toast.error('Failed to get WebSocket URL. Please try again.');
						return;
					}
					if (!result.agentId) {
						console.error('[FLOW_STEP_4] STEP 4: WebSocket Connection - ERROR: No agent ID received from server');
						logger.error('❌ No agent ID received from server');
						toast.error('Failed to get agent ID. Please try again.');
						return;
					}
					setChatId(result.agentId); // This comes from the server response
					connectWithRetry(result.websocketUrl);
					
					// Emit app-created event for sidebar updates
					appEvents.emitAppCreated(result.agentId, {
						title: userQuery || 'New App',
						description: userQuery,
					});
				} else if (connectionStatus.current === 'idle') {
					setIsBootstrapping(false);
					// Show starting message with thinking indicator
					setMessages(() => [
						createAIMessage('fetching-chat', 'Starting from where you left off...', true)
					]);

					// Fetch existing agent connection details
					const response = await apiClient.connectToAgent(urlChatId);
					if (!response.success || !response.data) {
						logger.error('Failed to fetch existing chat:', { chatId: urlChatId, error: response.error });
						throw new Error(response.error?.message || 'Failed to connect to agent');
					}

					logger.debug('Existing agentId API result', response.data);
					// Set the chatId for existing chat - this enables the chat input
					setChatId(urlChatId);


					logger.debug('connecting from init for existing chatId');
					connectWithRetry(response.data.websocketUrl, {
						disableGenerate: true, // We'll handle generation resume in the WebSocket open handler
					});
				}
			} catch (error) {
				logger.error('Error initializing code generation:', error);
				if (error instanceof RateLimitExceededError) {
					const rateLimitMessage = handleRateLimitError(error.details, onDebugMessage);
					setMessages(prev => [...prev, rateLimitMessage]);
				}
			}
		}
		init();
	}, []);

    // Mount/unmount: enable/disable reconnection and clear pending retries
    useEffect(() => {
        shouldReconnectRef.current = true;
        return () => {
            shouldReconnectRef.current = false;
            retryTimeouts.current.forEach(clearTimeout);
            retryTimeouts.current = [];
        };
    }, []);

    // Close previous websocket on change
    useEffect(() => {
        return () => {
            websocket?.close();
        };
    }, [websocket]);

	useEffect(() => {
		if (edit) {
			// When edit is cleared, write the edit changes
			return () => {
				setFiles((prev) =>
					prev.map((file) => {
						if (file.filePath === edit.filePath) {
							file.fileContents = file.fileContents.replace(
								edit.search,
								edit.replacement,
							);
						}
						return file;
					}),
				);
			};
		}
	}, [edit]);

	// Track debugging state based on deep_debug tool events in messages
	useEffect(() => {
		const hasActiveDebug = messages.some(msg => 
			msg.role === 'assistant' && 
			msg.ui?.toolEvents?.some(event => 
				event.name === 'deep_debug' && event.status === 'start'
			)
		);
		setIsDebugging(hasActiveDebug);
	}, [messages]);

	// Control functions for deployment and generation
	const handleStopGeneration = useCallback(() => {
		sendWebSocketMessage(websocket, 'stop_generation');
	}, [websocket]);

	const handleResumeGeneration = useCallback(() => {
		sendWebSocketMessage(websocket, 'resume_generation');
	}, [websocket]);

	const handleDeployToCloudflare = useCallback(async (instanceId: string) => {
		try {
			// Send deployment command via WebSocket instead of HTTP request
			if (sendWebSocketMessage(websocket, 'deploy', { instanceId })) {
				logger.debug('🚀 Deployment WebSocket message sent:', instanceId);
				
				// Set 1-minute timeout for deployment
				setTimeout(() => {
					if (isDeploying) {
						logger.warn('⏰ Deployment timeout after 1 minute');
						
						// Reset deployment state
						setIsDeploying(false);
						setCloudflareDeploymentUrl('');
						setIsRedeployReady(false);
						
						// Show timeout message
						sendMessage(createAIMessage('deployment_timeout', `⏰ Deployment timed out after 1 minute.\n\n🔄 Please try deploying again. The server may be busy.`));
						
						// Debug logging for timeout
						onDebugMessage?.('warning', 
							'Deployment Timeout',
							`Deployment for ${instanceId} timed out after 60 seconds`,
							'Deployment Timeout Management'
						);
					}
				}, 60000); // 1 minute = 60,000ms
				
				// Store timeout ID for cleanup if deployment completes early
				// Note: In a real implementation, you'd want to clear this timeout
				// when deployment completes successfully
				
			} else {
				throw new Error('WebSocket connection not available');
			}
		} catch (error) {
			logger.error('❌ Error sending deployment WebSocket message:', error);
			
			// Set deployment state immediately for UI feedback
			setIsDeploying(true);
			// Clear any previous deployment error
			setDeploymentError('');
			setCloudflareDeploymentUrl('');
			setIsRedeployReady(false);
			
			sendMessage(createAIMessage('deployment_error', `❌ Failed to initiate deployment: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 You can try again.`));
		}
	}, [websocket, sendMessage, isDeploying, onDebugMessage]);

	return {
		messages,
		edit,
		bootstrapFiles,
		chatId,
		query,
		files,
		blueprint,
		blueprintMarkdown,
		previewUrl,
		setPreviewUrl,
		isGeneratingBlueprint,
		isBootstrapping,
		totalFiles,
		websocket,
		sendUserMessage,
		sendAiMessage: sendMessage,
		clearEdit,
		projectStages,
		phaseTimeline,
		isThinking,
		onCompleteBootstrap,
		// Deployment and generation control
		isDeploying,
		cloudflareDeploymentUrl,
		deploymentError,
		isRedeployReady,
		isGenerationPaused,
		isGenerating,
		handleStopGeneration,
		handleResumeGeneration,
		handleDeployToCloudflare,
		// Preview refresh control
		shouldRefreshPreview,
		// Preview deployment state
		isPreviewDeploying,
		// Phase progress visual indicator
		isPhaseProgressActive,
		// Issue tracking and debugging state
		runtimeErrorCount,
		staticIssueCount,
		isDebugging,
	};
}
