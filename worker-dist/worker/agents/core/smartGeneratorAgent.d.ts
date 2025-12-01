import { SimpleCodeGeneratorAgent } from "./simpleGeneratorAgent";
import { CodeGenState } from "./state";
import { AgentInitArgs } from "./types";
/**
 * SmartCodeGeneratorAgent - Smartly orchestrated AI-powered code generation
 * using an LLM orchestrator instead of state machine based orchestrator.
 * TODO: NOT YET IMPLEMENTED, CURRENTLY Just uses SimpleCodeGeneratorAgent
 */
export declare class SmartCodeGeneratorAgent extends SimpleCodeGeneratorAgent {
    /**
     * Initialize the smart code generator with project blueprint and template
     * Sets up services and begins deployment process
     */
    initialize(initArgs: AgentInitArgs, agentMode: 'deterministic' | 'smart'): Promise<CodeGenState>;
    generateAllFiles(reviewCycles?: number): Promise<void>;
    builderLoop(): Promise<void>;
}
