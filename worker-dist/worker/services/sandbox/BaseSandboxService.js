import { createObjectLogger } from '../../logger';
import { env } from 'cloudflare:workers';
import { ZipExtractor } from './zipExtractor';
import { FileTreeBuilder } from './fileTreeBuilder';
const templateDetailsCache = {};
/**
 * Abstract base class providing complete RunnerService API compatibility
 * All implementations MUST support every method defined here
*/
export class BaseSandboxService {
    logger;
    sandboxId;
    constructor(sandboxId) {
        this.logger = createObjectLogger(this, 'BaseSandboxService');
        this.sandboxId = sandboxId;
    }
    // ==========================================
    // TEMPLATE MANAGEMENT (Required)
    // ==========================================
    /**
     * List all available templates
     * Returns: { success: boolean, templates: [...], count: number, error?: string }
     */
    static async listTemplates() {
        try {
            // Check if R2 bucket is configured
            if (!env.TEMPLATES_BUCKET) {
                throw new Error(`TEMPLATES_BUCKET R2 binding is not configured. Please enable R2 in wrangler.jsonc or use GitHub repository for templates.`);
            }
            const response = await env.TEMPLATES_BUCKET.get('template_catalog.json');
            if (response === null) {
                throw new Error(`Failed to fetch template catalog: Template catalog not found`);
            }
            const templates = await response.json();
            // For now, just filter out *next* templates
            const filteredTemplates = templates.filter(t => !t.name.includes('next'));
            return {
                success: true,
                templates: filteredTemplates.map(t => ({
                    name: t.name,
                    language: t.language,
                    frameworks: t.frameworks || [],
                    description: t.description
                })),
                count: filteredTemplates.length
            };
        }
        catch (error) {
            return {
                success: false,
                templates: [],
                count: 0,
                error: `Failed to fetch templates: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Get details for a specific template - fully in-memory, no sandbox operations
     * Downloads zip from R2, extracts in memory, and returns all files with metadata
     * Returns: { success: boolean, templateDetails?: {...}, error?: string }
     */
    static async getTemplateDetails(templateName, downloadDir) {
        try {
            if (templateDetailsCache[templateName]) {
                console.log(`Template details for template: ${templateName} found in cache`);
                return {
                    success: true,
                    templateDetails: templateDetailsCache[templateName]
                };
            }
            // Download template zip from R2
            const downloadUrl = downloadDir ? `${downloadDir}/${templateName}.zip` : `${templateName}.zip`;
            const r2Object = await env.TEMPLATES_BUCKET.get(downloadUrl);
            if (!r2Object) {
                throw new Error(`Template '${templateName}' not found in bucket`);
            }
            const zipData = await r2Object.arrayBuffer();
            // Extract all files in memory
            const allFiles = ZipExtractor.extractFiles(zipData);
            // Build file tree
            const fileTree = FileTreeBuilder.buildFromTemplateFiles(allFiles, { rootPath: '.' });
            // Extract dependencies from package.json
            const packageJsonFile = allFiles.find(f => f.filePath === 'package.json');
            const packageJson = packageJsonFile ? JSON.parse(packageJsonFile.fileContents) : null;
            const dependencies = packageJson?.dependencies || {};
            // Parse metadata files
            const dontTouchFile = allFiles.find(f => f.filePath === '.donttouch_files.json');
            const dontTouchFiles = dontTouchFile ? JSON.parse(dontTouchFile.fileContents) : [];
            const redactedFile = allFiles.find(f => f.filePath === '.redacted_files.json');
            const redactedFiles = redactedFile ? JSON.parse(redactedFile.fileContents) : [];
            const importantFile = allFiles.find(f => f.filePath === '.important_files.json');
            const importantFiles = importantFile ? JSON.parse(importantFile.fileContents) : [];
            // Get template info from catalog
            const catalogResponse = await BaseSandboxService.listTemplates();
            const catalogInfo = catalogResponse.success
                ? catalogResponse.templates.find(t => t.name === templateName)
                : null;
            // Remove metadata files and convert to map for efficient lookups
            const filteredFiles = allFiles.filter(f => !f.filePath.startsWith('.') ||
                (!f.filePath.endsWith('.json') && !f.filePath.startsWith('.git')));
            // Convert array to map: filePath -> fileContents
            const filesMap = {};
            for (const file of filteredFiles) {
                filesMap[file.filePath] = file.fileContents;
            }
            const templateDetails = {
                name: templateName,
                description: {
                    selection: catalogInfo?.description.selection || '',
                    usage: catalogInfo?.description.usage || ''
                },
                fileTree,
                allFiles: filesMap,
                language: catalogInfo?.language,
                deps: dependencies,
                importantFiles,
                dontTouchFiles,
                redactedFiles,
                frameworks: catalogInfo?.frameworks || []
            };
            templateDetailsCache[templateName] = templateDetails;
            return {
                success: true,
                templateDetails
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to get template details: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
