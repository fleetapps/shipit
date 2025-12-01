/**
 * Base class for all agent services
 * Provides common dependencies and DO-compatible access patterns
 */
export class BaseAgentService {
    stateManager;
    fileManager;
    getLogger;
    env;
    constructor(options) {
        this.stateManager = options.stateManager;
        this.fileManager = options.fileManager;
        this.getLogger = options.getLogger;
        this.env = options.env;
    }
    /**
     * Get current agent state
     */
    getState() {
        return this.stateManager.getState();
    }
    /**
     * Update agent state
     */
    setState(newState) {
        this.stateManager.setState(newState);
    }
    getAgentId() {
        return this.getState().inferenceContext.agentId;
    }
    /**
     * Get fresh logger instance (DO-compatible)
     */
    getLog() {
        return this.getLogger();
    }
    /**
     * Execute an operation with a timeout
     */
    async withTimeout(operation, timeoutMs, errorMsg, onTimeout) {
        let timeoutId;
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                onTimeout?.();
                reject(new Error(errorMsg));
            }, timeoutMs);
        });
        try {
            return await Promise.race([operation, timeoutPromise]);
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
