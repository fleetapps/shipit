import { z } from 'zod';
export type SchemaFormat = 'markdown';
export type FormatterOptions = {
    rootTagName?: string;
    headingLevel?: number;
    debug?: boolean;
};
export declare function formatSchemaAsMarkdown<T extends z.ZodRawShape>(schema: z.ZodObject<T>, options?: FormatterOptions): string;
export declare function parseMarkdownContent<OutputSchema extends z.AnyZodObject>(markdownInput: string, schema: OutputSchema, options?: FormatterOptions): z.infer<OutputSchema>;
interface TemplateRegistryEntry {
    template: (schema: z.AnyZodObject, options?: FormatterOptions) => string;
    serialize: <OutputSchema extends z.AnyZodObject>(data: z.infer<OutputSchema>, schema: OutputSchema, options?: FormatterOptions) => string;
    prompt: (template: string) => string;
    parser: <OutputSchema extends z.AnyZodObject>(content: string, schema: OutputSchema, options?: FormatterOptions) => z.infer<OutputSchema>;
}
export declare const TemplateRegistry: Record<SchemaFormat, TemplateRegistryEntry>;
export declare function generateTemplateForSchema(schema: z.AnyZodObject, schemaFormat: SchemaFormat, options?: FormatterOptions): string;
export declare function parseContentForSchema<OutputSchema extends z.AnyZodObject>(content: string, schemaFormat: SchemaFormat, schema: OutputSchema, options?: FormatterOptions): z.infer<OutputSchema>;
export {};
