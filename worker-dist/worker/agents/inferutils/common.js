/**
 * Create a standard user message with content
 */
export function createUserMessage(content) {
    return {
        role: 'user',
        content,
    };
}
/**
 * Create a standard system message with content
 */
export function createSystemMessage(content) {
    return {
        role: 'system',
        content,
    };
}
/**
 * Create a standard assistant message with content
 */
export function createAssistantMessage(content) {
    return {
        role: 'assistant',
        content,
    };
}
/**
 * Create a multi-modal user message with text and image content
 */
export function createMultiModalUserMessage(text, imageUrls, detail) {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    return {
        role: 'user',
        content: [
            {
                type: 'text',
                text,
            },
            ...urls.map(url => ({
                type: 'image_url',
                image_url: {
                    url,
                    detail: detail || 'auto',
                },
            })),
        ],
    };
}
export async function mapImagesInMultiModalMessage(message, fn) {
    // Check if message is of type multi-modal
    if (message.content && Array.isArray(message.content)) {
        message.content = await Promise.all(message.content.map(c => {
            if (c.type === 'image_url') {
                return fn(c);
            }
            return c;
        }));
    }
    return message;
}
