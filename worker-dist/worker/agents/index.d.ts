import { SmartCodeGeneratorAgent } from './core/smartGeneratorAgent';
import { CodeGenState } from './core/state';
import { StructuredLogger } from '../logger';
import { InferenceContext } from './inferutils/config.types';
import { TemplateDetails } from '../services/sandbox/sandboxTypes';
import { TemplateSelection } from './schemas';
import type { ImageAttachment } from '../types/image-attachment';
export declare function getAgentStub(env: Env, agentId: string): Promise<DurableObjectStub<SmartCodeGeneratorAgent>>;
export declare function getAgentStubLightweight(env: Env, agentId: string): Promise<DurableObjectStub<SmartCodeGeneratorAgent>>;
export declare function getAgentState(env: Env, agentId: string): Promise<CodeGenState>;
export declare function cloneAgent(env: Env, agentId: string): Promise<{
    newAgentId: string;
    newAgent: DurableObjectStub<SmartCodeGeneratorAgent>;
}>;
export declare function getTemplateForQuery(env: Env, inferenceContext: InferenceContext, query: string, images: ImageAttachment[] | undefined, logger: StructuredLogger): Promise<{
    templateDetails: TemplateDetails;
    selection: TemplateSelection;
}>;
