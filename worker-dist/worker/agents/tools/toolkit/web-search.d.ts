import { ToolDefinition } from '../types';
type WebSearchArgs = {
    query?: string;
    url?: string;
    num_results?: number;
};
type WebSearchResult = {
    content?: string;
    error?: string;
};
export declare const toolWebSearchDefinition: ToolDefinition<WebSearchArgs, WebSearchResult>;
export {};
