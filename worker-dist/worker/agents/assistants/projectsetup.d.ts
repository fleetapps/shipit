import { TemplateDetails } from "../../services/sandbox/sandboxTypes";
import { SetupCommandsType, type Blueprint } from "../schemas";
import Assistant from "./assistant";
import { InferenceContext } from "../inferutils/config.types";
interface GenerateSetupCommandsArgs {
    env: Env;
    agentId: string;
    query: string;
    blueprint: Blueprint;
    template: TemplateDetails;
    inferenceContext: InferenceContext;
}
export declare class ProjectSetupAssistant extends Assistant<Env> {
    private query;
    private logger;
    constructor({ env, inferenceContext, query, blueprint, template, }: GenerateSetupCommandsArgs);
    generateSetupCommands(error?: string): Promise<SetupCommandsType>;
}
export {};
