/**
 * Utility functions for generating unique IDs
 */
export declare class IdGenerator {
    /**
     * Generate a unique conversation ID
     * Format: conv-{timestamp}-{random}
     */
    static generateConversationId(): string;
    /**
     * Generate a generic unique ID with custom prefix
     */
    static generateId(prefix?: string): string;
}
