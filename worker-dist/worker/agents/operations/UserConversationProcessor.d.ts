import { ConversationalResponseType } from "../schemas";
import { WebSocketMessageData } from "../../api/websocketTypes";
import { AgentOperation, OperationOptions } from "../operations/common";
import { ConversationMessage } from "../inferutils/common";
import { StructuredLogger } from "../../logger";
import { RuntimeError } from "worker/services/sandbox/sandboxTypes";
import { ConversationState } from "../inferutils/common";
import { ProcessedImageAttachment } from "worker/types/image-attachment";
export interface ToolCallStatusArgs {
    name: string;
    status: 'start' | 'success' | 'error';
    args?: Record<string, unknown>;
    result?: string;
}
export type RenderToolCall = (args: ToolCallStatusArgs) => void;
type ConversationResponseCallback = (message: string, conversationId: string, isStreaming: boolean, tool?: ToolCallStatusArgs) => void;
export declare function buildToolCallRenderer(callback: ConversationResponseCallback, conversationId: string): RenderToolCall;
export interface UserConversationInputs {
    userMessage: string;
    conversationState: ConversationState;
    conversationResponseCallback: ConversationResponseCallback;
    errors: RuntimeError[];
    projectUpdates: string[];
    images?: ProcessedImageAttachment[];
}
export interface UserConversationOutputs {
    conversationResponse: ConversationalResponseType;
    conversationState: ConversationState;
}
declare const RelevantProjectUpdateWebsoketMessages: readonly ["error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log", "error" | "cf_agent_state" | "agent_connected" | "conversation_state" | "generation_started" | "file_generating" | "file_regenerating" | "file_chunk_generated" | "file_generated" | "file_regenerated" | "generation_complete" | "deployment_started" | "deployment_completed" | "deployment_failed" | "preview_force_refresh" | "code_reviewing" | "code_reviewed" | "command_executing" | "command_executed" | "command_execution_failed" | "runtime_error_found" | "code_fix_edits" | "static_analysis_results" | "phase_generating" | "phase_generated" | "phase_implementing" | "phase_implemented" | "phase_validating" | "phase_validated" | "generation_stopped" | "generation_resumed" | "cloudflare_deployment_started" | "cloudflare_deployment_completed" | "cloudflare_deployment_error" | "screenshot_capture_started" | "screenshot_capture_success" | "screenshot_capture_error" | "screenshot_analysis_result" | "github_export_started" | "github_export_progress" | "github_export_completed" | "github_export_error" | "rate_limit_error" | "user_suggestions_processing" | "conversation_response" | "conversation_cleared" | "project_name_updated" | "blueprint_updated" | "deterministic_code_fix_started" | "deterministic_code_fix_completed" | "model_configs_info" | "terminal_command" | "terminal_output" | "server_log"];
export type ProjectUpdateType = typeof RelevantProjectUpdateWebsoketMessages[number];
export declare class UserConversationProcessor extends AgentOperation<UserConversationInputs, UserConversationOutputs> {
    /**
     * Remove system context tags from message content
     */
    private stripSystemContext;
    execute(inputs: UserConversationInputs, options: OperationOptions): Promise<UserConversationOutputs>;
    /**
     * Count conversation turns (user message to next user message)
     */
    private countTurns;
    /**
     * Convert character count to estimated token count
     */
    private tokensFromChars;
    /**
     * Estimate token count for messages (4 chars ≈ 1 token)
     */
    private estimateTokens;
    /**
     * Check if compactification should be triggered
     */
    private shouldCompactify;
    /**
     * Find the last valid turn boundary before the preserve threshold
     * A turn boundary is right before a user message
     */
    private findTurnBoundary;
    /**
     * Generate LLM-powered conversation summary
     * Sends the full conversation history as-is to the LLM with a summarization instruction
     */
    private generateConversationSummary;
    /**
     * Intelligent conversation compactification system
     *
     * Strategy:
     * - Monitors turns (user message to user message) and token count
     * - Triggers at 50 turns OR ~100k tokens
     * - Uses LLM to generate intelligent summary
     * - Preserves last 10 messages in full
     * - Respects turn boundaries to avoid tool call fragmentation
     */
    compactifyContext(runningHistory: ConversationMessage[], env: Env, options: OperationOptions, toolCallRenderer: RenderToolCall, logger: StructuredLogger): Promise<ConversationMessage[]>;
    processProjectUpdates<T extends ProjectUpdateType>(updateType: T, _data: WebSocketMessageData<T>, logger: StructuredLogger): ConversationMessage[];
    isProjectUpdateType(type: unknown): type is ProjectUpdateType;
}
export {};
