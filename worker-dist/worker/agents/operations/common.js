import { createUserMessage, createSystemMessage, createAssistantMessage } from "../inferutils/common";
import { generalSystemPromptBuilder, USER_PROMPT_FORMATTER } from "../prompts";
import { CodeSerializerType } from "../utils/codeSerializers";
export function getSystemPromptWithProjectContext(systemPrompt, context, serializerType = CodeSerializerType.SIMPLE) {
    const { query, blueprint, templateDetails, dependencies, allFiles, commandsHistory } = context;
    const messages = [
        createSystemMessage(generalSystemPromptBuilder(systemPrompt, {
            query,
            blueprint,
            templateDetails,
            dependencies,
        })),
        createUserMessage(USER_PROMPT_FORMATTER.PROJECT_CONTEXT(context.getCompletedPhases(), allFiles, context.getFileTree(), commandsHistory, serializerType)),
        createAssistantMessage(`I have thoroughly gone through the whole codebase and understood the current implementation and project requirements. We can continue.`)
    ];
    return messages;
}
export class AgentOperation {
}
