import { type ChatCompletionMessageToolCall } from 'openai/resources';
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool';
export type TextContent = {
    type: 'text';
    text: string;
};
export type ImageContent = {
    type: 'image_url';
    image_url: {
        url: string;
        detail?: 'auto' | 'low' | 'high';
    };
};
export type MessageContent = string | (TextContent | ImageContent)[] | null;
export type Message = {
    role: MessageRole;
    content: MessageContent;
    name?: string;
    tool_calls?: ChatCompletionMessageToolCall[];
};
export interface ConversationMessage extends Message {
    conversationId: string;
}
export interface ConversationState {
    id: string;
    runningHistory: ConversationMessage[];
    fullHistory: ConversationMessage[];
}
/**
 * Create a standard user message with content
 */
export declare function createUserMessage(content: MessageContent): {
    role: MessageRole;
    content: MessageContent;
};
/**
 * Create a standard system message with content
 */
export declare function createSystemMessage(content: string): {
    role: MessageRole;
    content: string;
};
/**
 * Create a standard assistant message with content
 */
export declare function createAssistantMessage(content: string): {
    role: MessageRole;
    content: string;
};
/**
 * Create a multi-modal user message with text and image content
 */
export declare function createMultiModalUserMessage(text: string, imageUrls: string | string[], detail?: 'auto' | 'low' | 'high'): {
    role: MessageRole;
    content: (TextContent | ImageContent)[];
};
export declare function mapImagesInMultiModalMessage(message: ConversationMessage, fn: (content: ImageContent) => Promise<ImageContent>): Promise<ConversationMessage>;
