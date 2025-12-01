export interface TemplateCustomizationOptions {
    projectName: string;
    commandsHistory: string[];
}
export interface CustomizedTemplateFiles {
    'package.json': string;
    'wrangler.jsonc'?: string;
    '.bootstrap.js': string;
    '.gitignore': string;
}
/**
 * Customize all template configuration files
 * - Updates package.json with project name and prepare script
 * - Updates wrangler.jsonc with project name (if exists)
 * - Generates .bootstrap.js script
 * - Updates .gitignore to exclude bootstrap marker
 */
export declare function customizeTemplateFiles(templateFiles: Record<string, string>, options: TemplateCustomizationOptions): Partial<CustomizedTemplateFiles>;
/**
 * Update package.json with project name and prepare script
 */
export declare function customizePackageJson(content: string, projectName: string): string;
/**
 * Generate bootstrap script with proper command escaping
 */
export declare function generateBootstrapScript(projectName: string, commands: string[]): string;
/**
 * Generate project name from blueprint or query
 */
export declare function generateProjectName(projectName: string, uniqueSuffix: string, maxPrefixLength?: number): string;
