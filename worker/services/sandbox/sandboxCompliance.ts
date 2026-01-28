import { BaseSandboxService } from './BaseSandboxService';
import { FileOutputType } from '../../agents/schemas';
import { StructuredLogger } from '../../logger';
import { executeInference } from '../../agents/inferutils/infer';
import { createSystemMessage, createUserMessage, Message } from '../../agents/inferutils/common';
import { InferenceContext } from '../../agents/inferutils/config.types';
import { ToolDefinition } from '../../agents/tools/types';
import { createRegenerateFileTool } from '../../agents/tools/toolkit/regenerate-file';
import { createGenerateFilesTool } from '../../agents/tools/toolkit/generate-files';
import { createReadFilesTool } from '../../agents/tools/toolkit/read-files';
import { ICodingAgent } from '../../agents/services/interfaces/ICodingAgent';

export interface ComplianceCheckResult {
    compliant: boolean;
    issues: ComplianceIssue[];
    fixedFiles: FileOutputType[];
}

export interface ComplianceIssue {
    file: string;
    issue: string;
    severity: 'critical' | 'warning';
}

/**
 * Sandbox compliance service that ensures applications are properly configured
 * for Cloudflare sandbox deployment (port binding, host configuration, etc.)
 */

const COMPLIANCE_SYSTEM_PROMPT = `You are a sandbox deployment compliance specialist. Your task is to ensure that applications are properly configured to run in Cloudflare sandbox containers.

## RUNTIME REQUIREMENTS (MANDATORY):
- Your app MUST start an HTTP server.
- The server MUST listen on process.env.PORT (not a hardcoded port).
- The server MUST bind to 0.0.0.0 (not localhost or 127.0.0.1).
- The server MUST run in the foreground and not exit.
- Do NOT hardcode ports.
- Do NOT daemonize the process.
- Do NOT use background (&) processes.

## KEY FILES TO CHECK:

### 1. vite.config.ts
**Required Configuration:**
\`\`\`typescript
server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "3000", 10),
}
\`\`\`

**Common Issues:**
- Missing server configuration
- host set to "localhost" or "127.0.0.1"
- Hardcoded port instead of using process.env.PORT
- Port not parsed as integer

### 2. package.json
**Required Scripts:**
- \`dev\` script MUST include \`--host 0.0.0.0\` and \`--port\` with PORT environment variable (or use vite.config.ts)
- \`preview\` script MUST include \`--host 0.0.0.0\` and \`--port\` with PORT environment variable

**Common Issues:**
- Missing --host flag
- Missing --port flag or hardcoded port
- Using localhost instead of 0.0.0.0

### 3. Other Server Configurations
- Express/Fastify: Must use \`app.listen(process.env.PORT || 3000, "0.0.0.0")\`
- Next.js: Must configure hostname in next.config.js
- Any custom server: Must bind to 0.0.0.0 and use process.env.PORT

## YOUR TASK:
1. Read the required files (vite.config.ts, package.json, and any server entry points)
2. Identify compliance issues
3. Use regenerate_file or generate_files tools to fix issues
4. Ensure all fixes are applied before deployment

## FIXING STRATEGY:
- If file exists but is misconfigured: Use regenerate_file
- If file is missing: Use generate_files to create it
- Always preserve existing functionality while fixing compliance issues
- Make minimal, targeted changes

## OUTPUT:
After fixing, report what was fixed and confirm compliance.`;

const COMPLIANCE_USER_PROMPT = `<COMPLIANCE_CHECK_REQUEST>

<CONTEXT>
You are checking the following project files for sandbox deployment compliance:
{{fileContext}}

<FILES_TO_CHECK>
{{filesToCheck}}
</FILES_TO_CHECK>

<MISSING_FILES>
{{missingFiles}}
</MISSING_FILES>

<DETECTED_ISSUES>
{{issues}}
</DETECTED_ISSUES>

## TASK:
1. Review all provided files for compliance with sandbox runtime requirements
2. Identify any issues (missing config, wrong host, hardcoded ports, etc.)
3. Use the available tools (regenerate_file, generate_files) to fix all issues
4. Ensure vite.config.ts has proper server configuration
5. Ensure package.json scripts use correct host and port flags
6. Fix any other server configuration files as needed

## CRITICAL:
- All fixes must be applied immediately
- Do not skip any compliance issues
- Ensure the app will bind to 0.0.0.0:PORT (from env var)
- Verify fixes are correct before completing
- If a file is missing, use generate_files to create it with proper configuration
</COMPLIANCE_CHECK_REQUEST>`;

export class SandboxComplianceService {
    constructor(
        private sandboxClient: BaseSandboxService,
        private agent: ICodingAgent,
        private logger: StructuredLogger,
        private env: Env,
        private inferenceContext: InferenceContext
    ) {}

    /**
     * Check and fix sandbox compliance for files before deployment
     * Uses AI agent with tools to fix compliance issues
     */
    async ensureCompliance(
        instanceId: string | null,
        filesToDeploy: FileOutputType[]
    ): Promise<ComplianceCheckResult> {
        this.logger.info('Starting sandbox compliance check', { instanceId, fileCount: filesToDeploy.length });

        // Files we need to check
        const requiredFiles = ['vite.config.ts', 'package.json'];
        const optionalFiles = ['src/main.tsx', 'src/main.ts', 'index.ts', 'server.ts'];

        // Try to read files from filesToDeploy first, then from agent's file manager
        const fileMap = new Map<string, FileOutputType>();
        filesToDeploy.forEach(file => {
            fileMap.set(file.filePath, file);
        });

        const filesToCheck: Array<{ path: string; content: string; exists: boolean }> = [];
        const missingFiles: string[] = [];

        // Check required files - first from filesToDeploy, then from agent
        for (const filePath of requiredFiles) {
            const file = fileMap.get(filePath);
            if (file) {
                filesToCheck.push({ path: filePath, content: file.fileContents, exists: true });
            } else {
                // Try to read from agent's file manager
                try {
                    const readResult = await this.agent.readFiles([filePath]);
                    if (readResult.files && readResult.files.length > 0) {
                        const agentFile = readResult.files[0];
                        filesToCheck.push({ path: filePath, content: agentFile.content, exists: true });
                    } else if (instanceId) {
                        // Try to read from sandbox as last resort
                        try {
                            const response = await this.sandboxClient.getFiles(instanceId, [filePath]);
                            if (response.success && response.files.length > 0) {
                                const sandboxFile = response.files[0];
                                filesToCheck.push({ path: filePath, content: sandboxFile.fileContents, exists: true });
                            } else {
                                missingFiles.push(filePath);
                            }
                        } catch (error) {
                            this.logger.warn(`Failed to read ${filePath} from sandbox`, { error });
                            missingFiles.push(filePath);
                        }
                    } else {
                        missingFiles.push(filePath);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to read ${filePath} from agent`, { error });
                    missingFiles.push(filePath);
                }
            }
        }

        // Check optional files (server entry points)
        for (const filePath of optionalFiles) {
            const file = fileMap.get(filePath);
            if (file) {
                filesToCheck.push({ path: filePath, content: file.fileContents, exists: true });
            }
        }

        // Quick deterministic check first
        const quickIssues = await this.quickComplianceCheck(filesToDeploy);
        if (quickIssues.length === 0 && missingFiles.length === 0) {
            this.logger.info('Quick compliance check passed, no issues found');
            return {
                compliant: true,
                issues: [],
                fixedFiles: []
            };
        }

        // Build context for AI agent
        const fileContext = filesToCheck.map(f => `**${f.path}**:\n\`\`\`\n${f.content.substring(0, 2000)}\n\`\`\``).join('\n\n');
        const missingFilesList = missingFiles.length > 0 ? missingFiles.join(', ') : 'None';
        const issuesList = quickIssues.map(i => `- ${i.file}: ${i.issue}`).join('\n');

        // Create tools for the agent
        const tools: ToolDefinition<any, any>[] = [
            createReadFilesTool(this.agent, this.logger),
            createRegenerateFileTool(this.agent, this.logger),
            createGenerateFilesTool(this.agent, this.logger),
        ];

        // Build messages
        const systemMessage = createSystemMessage(COMPLIANCE_SYSTEM_PROMPT);
        const userMessage = createUserMessage(
            COMPLIANCE_USER_PROMPT
                .replace('{{fileContext}}', fileContext || 'No files found')
                .replace('{{filesToCheck}}', filesToCheck.map(f => f.path).join(', ') || 'None')
                .replace('{{missingFiles}}', missingFilesList)
                .replace('{{issues}}', issuesList || 'None detected')
        );

        const messages: Message[] = [systemMessage, userMessage];

        try {
            // Execute inference with tools
            this.logger.info('Running compliance check with AI agent', {
                filesToCheck: filesToCheck.length,
                missingFiles: missingFiles.length,
                quickIssues: quickIssues.length
            });

            // Add timeout to prevent hanging - 30 seconds max for compliance fixes
            const COMPLIANCE_TIMEOUT_MS = 30000;
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            
            try {
                const inferencePromise = executeInference({
                    env: this.env,
                    messages,
                    agentActionName: 'sandboxCompliance',
                    tools,
                    context: this.inferenceContext,
                    retryLimit: 1,
                });
                
                const timeoutPromise = new Promise<never>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('Compliance check timeout after 30s'));
                    }, COMPLIANCE_TIMEOUT_MS);
                });
                
                await Promise.race([inferencePromise, timeoutPromise]);
            } catch (timeoutError) {
                this.logger.warn('Compliance AI check timed out or failed, using quick check results', { 
                    error: timeoutError instanceof Error ? timeoutError.message : 'Unknown error' 
                });
                // Return with quick check results instead of hanging
                // The AI fix attempt failed, but we can still proceed with deployment
                // The quick check issues will be logged but won't block deployment
                return {
                    compliant: false,
                    issues: quickIssues,
                    fixedFiles: []
                };
            } finally {
                // Clean up timeout to prevent it from firing after promise resolves
                if (timeoutId !== undefined) {
                    clearTimeout(timeoutId);
                }
            }

            // Get fixed files from agent's file manager
            const allFiles = this.agent.listFiles();
            const fixedFilePaths = new Set(['vite.config.ts', 'package.json']);
            const updatedFiles = allFiles.filter(f => fixedFilePaths.has(f.filePath));

            this.logger.info('Compliance check completed', {
                fixedFilesCount: updatedFiles.length
            });

            return {
                compliant: true,
                issues: quickIssues,
                fixedFiles: updatedFiles
            };

        } catch (error) {
            this.logger.error('Compliance check failed', { error });
            return {
                compliant: false,
                issues: quickIssues.length > 0 ? quickIssues : [{ 
                    file: 'unknown', 
                    issue: `Compliance check error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
                    severity: 'critical' 
                }],
                fixedFiles: []
            };
        }
    }

    /**
     * Quick compliance check without AI (deterministic)
     */
    async quickComplianceCheck(files: FileOutputType[]): Promise<ComplianceIssue[]> {
        const issues: ComplianceIssue[] = [];
        const fileMap = new Map<string, string>();
        files.forEach(f => fileMap.set(f.filePath, f.fileContents));

        // Check vite.config.ts
        const viteConfig = fileMap.get('vite.config.ts');
        if (viteConfig) {
            if (!viteConfig.includes('host:') || !viteConfig.includes('"0.0.0.0"')) {
                issues.push({
                    file: 'vite.config.ts',
                    issue: 'Missing or incorrect server.host configuration (must be "0.0.0.0")',
                    severity: 'critical'
                });
            }
            if (!viteConfig.includes('process.env.PORT')) {
                issues.push({
                    file: 'vite.config.ts',
                    issue: 'Server port must use process.env.PORT, not hardcoded value',
                    severity: 'critical'
                });
            }
        } else {
            issues.push({
                file: 'vite.config.ts',
                issue: 'vite.config.ts file is missing',
                severity: 'critical'
            });
        }

        // Check package.json
        const packageJson = fileMap.get('package.json');
        if (packageJson) {
            if (packageJson.includes('"dev"') && !packageJson.includes('--host') && !viteConfig?.includes('host:')) {
                issues.push({
                    file: 'package.json',
                    issue: 'dev script missing --host 0.0.0.0 flag (or vite.config.ts server.host)',
                    severity: 'critical'
                });
            }
        }

        return issues;
    }
}
