import { toolWebSearchDefinition } from './toolkit/web-search';
import { toolFeedbackDefinition } from './toolkit/feedback';
import { createQueueRequestTool } from './toolkit/queue-request';
import { createGetLogsTool } from './toolkit/get-logs';
import { createDeployPreviewTool } from './toolkit/deploy-preview';
import { createDeepDebuggerTool } from "./toolkit/deep-debugger";
import { createRenameProjectTool } from './toolkit/rename-project';
import { createAlterBlueprintTool } from './toolkit/alter-blueprint';
import { createReadFilesTool } from './toolkit/read-files';
import { createExecCommandsTool } from './toolkit/exec-commands';
import { createRunAnalysisTool } from './toolkit/run-analysis';
import { createRegenerateFileTool } from './toolkit/regenerate-file';
import { createGenerateFilesTool } from './toolkit/generate-files';
import { createWaitTool } from './toolkit/wait';
import { createGetRuntimeErrorsTool } from './toolkit/get-runtime-errors';
import { createWaitForGenerationTool } from './toolkit/wait-for-generation';
import { createWaitForDebugTool } from './toolkit/wait-for-debug';
import { createGitTool } from './toolkit/git';
export async function executeToolWithDefinition(toolDef, args) {
    toolDef.onStart?.(args);
    const result = await toolDef.implementation(args);
    toolDef.onComplete?.(args, result);
    return result;
}
/**
 * Build all available tools for the agent
 * Add new tools here - they're automatically included in the conversation
 */
export function buildTools(agent, logger, toolRenderer, streamCb) {
    return [
        toolWebSearchDefinition,
        toolFeedbackDefinition,
        createQueueRequestTool(agent, logger),
        createGetLogsTool(agent, logger),
        createDeployPreviewTool(agent, logger),
        createWaitForGenerationTool(agent, logger),
        createWaitForDebugTool(agent, logger),
        createRenameProjectTool(agent, logger),
        createAlterBlueprintTool(agent, logger),
        // Git tool (safe version - no reset for user conversations)
        createGitTool(agent, logger, { excludeCommands: ['reset'] }),
        // Deep autonomous debugging assistant tool
        createDeepDebuggerTool(agent, logger, toolRenderer, streamCb),
    ];
}
export function buildDebugTools(session, logger, toolRenderer) {
    const tools = [
        createGetLogsTool(session.agent, logger),
        createGetRuntimeErrorsTool(session.agent, logger),
        createReadFilesTool(session.agent, logger),
        createRunAnalysisTool(session.agent, logger),
        createExecCommandsTool(session.agent, logger),
        createRegenerateFileTool(session.agent, logger),
        createGenerateFilesTool(session.agent, logger),
        createDeployPreviewTool(session.agent, logger),
        createWaitTool(logger),
        createGitTool(session.agent, logger),
    ];
    // Attach tool renderer for UI visualization if provided
    if (toolRenderer) {
        return tools.map(td => ({
            ...td,
            onStart: (args) => toolRenderer({ name: td.function.name, status: 'start', args }),
            onComplete: (args, result) => toolRenderer({
                name: td.function.name,
                status: 'success',
                args,
                result: typeof result === 'string' ? result : JSON.stringify(result)
            })
        }));
    }
    return tools;
}
