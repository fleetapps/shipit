import { AgentConfig, AIModels } from "./config.types";
export declare const AGENT_CONFIG: AgentConfig;
export declare const ALL_AI_MODELS: readonly AIModels[];
export type AIModelType = AIModels;
export declare const AI_MODELS_TUPLE: [AIModels, ...AIModels[]];
export declare function isValidAIModel(model: string): model is AIModels;
export declare function getValidAIModelsArray(): readonly AIModels[];
