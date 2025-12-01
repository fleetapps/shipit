import { StructuredLogger } from '../../logger';
export interface PlaceholderInfo {
    placeholder: string;
    resourceType: 'KV' | 'D1';
    binding?: string;
}
export interface PlaceholderReplacements {
    [placeholder: string]: string;
}
export interface ParseResult {
    hasPlaceholders: boolean;
    placeholders: PlaceholderInfo[];
    content: string;
}
export declare class TemplateParser {
    private logger;
    private static readonly PLACEHOLDER_PATTERNS;
    constructor(logger: StructuredLogger);
    detectPlaceholders(wranglerContent: string): PlaceholderInfo[];
    private extractBindingName;
    replacePlaceholders(content: string, replacements: PlaceholderReplacements): string;
    parseWranglerConfig(content: string): ParseResult;
    validateReplacements(content: string): boolean;
    createReplacementSummary(replacements: PlaceholderReplacements): string;
}
