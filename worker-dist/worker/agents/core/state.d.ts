import type { Blueprint, PhaseConceptType, FileOutputType } from '../schemas';
import type { ConversationMessage } from '../inferutils/common';
import type { InferenceContext } from '../inferutils/config.types';
export interface FileState extends FileOutputType {
    lastDiff: string;
}
export interface PhaseState extends PhaseConceptType {
    completed: boolean;
}
export declare enum CurrentDevState {
    IDLE = 0,
    PHASE_GENERATING = 1,
    PHASE_IMPLEMENTING = 2,
    REVIEWING = 3,
    FINALIZING = 4
}
export declare const MAX_PHASES = 12;
export interface CodeGenState {
    blueprint: Blueprint;
    projectName: string;
    query: string;
    generatedFilesMap: Record<string, FileState>;
    generatedPhases: PhaseState[];
    commandsHistory?: string[];
    lastPackageJson?: string;
    templateName: string;
    sandboxInstanceId?: string;
    shouldBeGenerating: boolean;
    mvpGenerated: boolean;
    reviewingInitiated: boolean;
    agentMode: 'deterministic' | 'smart';
    sessionId: string;
    hostname: string;
    phasesCounter: number;
    pendingUserInputs: string[];
    currentDevState: CurrentDevState;
    reviewCycles?: number;
    currentPhase?: PhaseConceptType;
    conversationMessages: ConversationMessage[];
    projectUpdatesAccumulator: string[];
    inferenceContext: InferenceContext;
    lastDeepDebugTranscript: string | null;
}
