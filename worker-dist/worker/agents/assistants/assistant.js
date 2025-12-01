// An assistant to agents
class Assistant {
    history = [];
    env;
    inferenceContext;
    constructor(env, inferenceContext, systemPrompt) {
        this.env = env;
        this.inferenceContext = inferenceContext;
        if (systemPrompt) {
            this.history.push(systemPrompt);
        }
    }
    save(messages) {
        this.history.push(...messages);
        return this.history;
    }
    getHistory() {
        return this.history;
    }
    clearHistory() {
        this.history = [];
    }
}
export default Assistant;
