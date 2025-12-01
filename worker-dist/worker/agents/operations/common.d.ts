import { StructuredLogger } from "../../logger";
import { GenerationContext } from "../domain/values/GenerationContext";
import { Message } from "../inferutils/common";
import { InferenceContext } from "../inferutils/config.types";
import { CodeSerializerType } from "../utils/codeSerializers";
import { CodingAgentInterface } from "../services/implementations/CodingAgent";
export declare function getSystemPromptWithProjectContext(systemPrompt: string, context: GenerationContext, serializerType?: CodeSerializerType): Message[];
export interface OperationOptions {
    env: Env;
    agentId: string;
    context: GenerationContext;
    logger: StructuredLogger;
    inferenceContext: InferenceContext;
    agent: CodingAgentInterface;
}
export declare abstract class AgentOperation<InputType, OutputType> {
    abstract execute(inputs: InputType, options: OperationOptions): Promise<OutputType>;
}
