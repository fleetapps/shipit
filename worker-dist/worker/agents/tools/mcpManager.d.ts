/**
 * MCP Manager - Based on the reference implementation from vite-cfagents-runner
 * Manages connections to multiple MCP servers and provides unified tool access
 */
export declare class MCPManager {
    private clients;
    private toolMap;
    private initialized;
    initialize(): Promise<void>;
    getToolDefinitions(): Promise<{
        type: "function";
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    }[]>;
    executeTool(toolName: string, args: Record<string, unknown>): Promise<string>;
    hasToolAvailable(toolName: string): boolean;
    getAvailableToolNames(): string[];
    shutdown(): Promise<void>;
}
export declare const mcpManager: MCPManager;
