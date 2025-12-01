import { SimpleCodeGeneratorAgent } from "./simpleGeneratorAgent";
/**
 * SmartCodeGeneratorAgent - Smartly orchestrated AI-powered code generation
 * using an LLM orchestrator instead of state machine based orchestrator.
 * TODO: NOT YET IMPLEMENTED, CURRENTLY Just uses SimpleCodeGeneratorAgent
 */
export class SmartCodeGeneratorAgent extends SimpleCodeGeneratorAgent {
    /**
     * Initialize the smart code generator with project blueprint and template
     * Sets up services and begins deployment process
     */
    async initialize(initArgs, agentMode) {
        this.logger().info('🧠 Initializing SmartCodeGeneratorAgent with enhanced AI orchestration', {
            queryLength: initArgs.query.length,
            agentType: agentMode
        });
        // Call the parent initialization
        return await super.initialize(initArgs);
    }
    async generateAllFiles(reviewCycles = 10) {
        if (this.state.agentMode === 'deterministic') {
            return super.generateAllFiles(reviewCycles);
        }
        else {
            return this.builderLoop();
        }
    }
    async builderLoop() {
        // TODO
    }
}
