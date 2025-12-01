import { ProcessedImageAttachment } from "../../../types/image-attachment";
import { Blueprint, FileConceptType } from "../../../agents/schemas";
import { ExecuteCommandsResponse, StaticAnalysisResponse, RuntimeError } from "../../../services/sandbox/sandboxTypes";
import { ICodingAgent } from "../interfaces/ICodingAgent";
import { OperationOptions } from "../../../agents/operations/common";
import { DeepDebugResult } from "../../../agents/core/types";
import { RenderToolCall } from "../../../agents/operations/UserConversationProcessor";
export declare class CodingAgentInterface {
    agentStub: ICodingAgent;
    constructor(agentStub: ICodingAgent);
    getLogs(reset?: boolean, durationSeconds?: number): Promise<string>;
    fetchRuntimeErrors(clear?: boolean): Promise<RuntimeError[]>;
    deployPreview(clearLogs?: boolean, forceRedeploy?: boolean): Promise<string>;
    deployToCloudflare(): Promise<string>;
    queueRequest(request: string, images?: ProcessedImageAttachment[]): void;
    clearConversation(): void;
    getOperationOptions(): OperationOptions;
    getGit(): import("../../git").GitVersionControl;
    updateProjectName(newName: string): Promise<boolean>;
    updateBlueprint(patch: Partial<Blueprint>): Promise<Blueprint>;
    readFiles(paths: string[]): Promise<{
        files: {
            path: string;
            content: string;
        }[];
    }>;
    runStaticAnalysisCode(files?: string[]): Promise<StaticAnalysisResponse>;
    execCommands(commands: string[], shouldSave: boolean, timeout?: number): Promise<ExecuteCommandsResponse>;
    regenerateFile(path: string, issues: string[]): Promise<{
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
    isCodeGenerating(): boolean;
    waitForGeneration(): Promise<void>;
    isDeepDebugging(): boolean;
    waitForDeepDebug(): Promise<void>;
    executeDeepDebug(issue: string, toolRenderer: RenderToolCall, streamCb: (chunk: string) => void, focusPaths?: string[]): Promise<DeepDebugResult>;
}
