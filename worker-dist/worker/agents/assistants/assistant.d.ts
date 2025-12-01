import { Message } from "../inferutils/common";
import { InferenceContext } from "../inferutils/config.types";
declare class Assistant<Env> {
    protected history: Message[];
    protected env: Env;
    protected inferenceContext: InferenceContext;
    constructor(env: Env, inferenceContext: InferenceContext, systemPrompt?: Message);
    save(messages: Message[]): Message[];
    getHistory(): Message[];
    clearHistory(): void;
}
export default Assistant;
