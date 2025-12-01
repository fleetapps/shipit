import * as z from 'zod';
export const FileTreeNodeSchema = z.lazy(() => z.object({
    path: z.string(),
    type: z.enum(['file', 'directory']),
    children: z.array(FileTreeNodeSchema).optional(),
}));
export const TemplateFileSchema = z.object({
    filePath: z.string(),
    fileContents: z.string(),
});
// --- Template Details ---
export const TemplateDetailsSchema = z.object({
    name: z.string(),
    description: z.object({
        selection: z.string(),
        usage: z.string(),
    }),
    fileTree: FileTreeNodeSchema,
    allFiles: z.record(z.string(), z.string()), // Map of filePath -> fileContents
    language: z.string().optional(),
    deps: z.record(z.string(), z.string()),
    frameworks: z.array(z.string()).optional(),
    importantFiles: z.array(z.string()),
    dontTouchFiles: z.array(z.string()),
    redactedFiles: z.array(z.string()),
});
// ==========================================
// RUNTIME ERROR SCHEMAS
// ==========================================
export const SimpleErrorSchema = z.object({
    timestamp: z.string(), // ISO timestamp
    level: z.number(), // Pino log level (50=error, 60=fatal)
    message: z.string(), // The 'msg' field from JSON log
    rawOutput: z.string() // The complete raw JSON log line
});
// StoredError extends SimpleError with storage-specific fields
export const StoredErrorSchema = SimpleErrorSchema.extend({
    id: z.number(),
    instanceId: z.string(),
    processId: z.string(),
    errorHash: z.string(),
    occurrenceCount: z.number(),
    createdAt: z.string()
});
export const RuntimeErrorSchema = SimpleErrorSchema;
// --- Instance Details ---
export const InstanceDetailsSchema = z.object({
    runId: z.string(),
    templateName: z.string(),
    startTime: z.union([z.string(), z.date()]),
    uptime: z.number(),
    previewURL: z.string().optional(),
    tunnelURL: z.string().optional(),
    directory: z.string(),
    serviceDirectory: z.string(),
    fileTree: FileTreeNodeSchema.optional(),
    runtimeErrors: z.array(RuntimeErrorSchema).optional(),
    processId: z.string().optional(),
});
// --- Command Execution ---
export const CommandExecutionResultSchema = z.object({
    command: z.string(),
    success: z.boolean(),
    output: z.string(),
    error: z.string().optional(),
    exitCode: z.number().optional(),
});
// --- API Request/Response Schemas ---
// /templates (GET)
export const TemplateInfoSchema = z.object({
    name: z.string(),
    language: z.string().optional(),
    frameworks: z.array(z.string()).optional(),
    description: z.object({
        selection: z.string(),
        usage: z.string(),
    })
});
export const TemplateListResponseSchema = z.object({
    success: z.boolean(),
    templates: z.array(TemplateInfoSchema),
    count: z.number(),
    error: z.string().optional(),
});
// /template/:name (GET)
export const TemplateDetailsResponseSchema = z.object({
    success: z.boolean(),
    templateDetails: TemplateDetailsSchema.optional(),
    error: z.string().optional(),
});
// /template/:name/files (POST)
export const GetTemplateFilesRequestSchema = z.object({
    filePaths: z.array(z.string()),
});
export const GetTemplateFilesResponseSchema = z.object({
    success: z.boolean(),
    files: z.array(TemplateFileSchema),
    errors: z.array(z.object({ file: z.string(), error: z.string() })).optional(),
    error: z.string().optional(),
});
export const BootstrapRequestSchema = z.object({
    templateName: z.string(),
    projectName: z.string(),
    webhookUrl: z.string().url().optional(),
    envVars: z.record(z.string(), z.string()).optional(),
});
export const PreviewSchema = z.object({
    runId: z.string().optional(),
    previewURL: z.string().optional(),
    tunnelURL: z.string().optional(),
});
export const BootstrapResponseSchema = PreviewSchema.extend({
    success: z.boolean(),
    processId: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
});
// /instances/:id/status (GET)
export const BootstrapStatusResponseSchema = z.object({
    success: z.boolean(),
    pending: z.boolean(),
    message: z.string().optional(),
    previewURL: z.string().optional(),
    tunnelURL: z.string().optional(),
    processId: z.string().optional(),
    isHealthy: z.boolean(),
    error: z.string().optional(),
});
// /instances (GET)
export const ListInstancesResponseSchema = z.object({
    success: z.boolean(),
    instances: z.array(InstanceDetailsSchema),
    count: z.number(),
    error: z.string().optional(),
});
// /instances/:id (GET)
export const GetInstanceResponseSchema = z.object({
    success: z.boolean(),
    instance: InstanceDetailsSchema.optional(),
    error: z.string().optional(),
});
// /instances/:id/files (POST)
export const WriteFilesRequestSchema = z.object({
    files: z.array(z.object({
        filePath: z.string(),
        fileContents: z.string(),
    })),
    commitMessage: z.string().optional(),
});
// /instances/:id/files (GET) - Define schema for getting files from an instance
export const GetFilesResponseSchema = z.object({
    success: z.boolean(),
    files: z.array(TemplateFileSchema), // Re-use TemplateFileSchema { filePath, fileContents }
    errors: z.array(z.object({ file: z.string(), error: z.string() })).optional(),
    error: z.string().optional(),
});
export const WriteFilesResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    results: z.array(z.object({
        file: z.string(),
        success: z.boolean(),
        error: z.string().optional(),
    })),
    error: z.string().optional(),
});
export const GetLogsResponseSchema = z.object({
    success: z.boolean(),
    logs: z.object({
        stdout: z.string(),
        stderr: z.string(),
    }),
    error: z.string().optional(),
});
// /instances/:id/commands (POST)
export const ExecuteCommandsRequestSchema = z.object({
    commands: z.array(z.string()),
    timeout: z.number().optional(),
});
export const ExecuteCommandsResponseSchema = z.object({
    success: z.boolean(),
    results: z.array(CommandExecutionResultSchema),
    message: z.string().optional(),
    error: z.string().optional(),
});
// /instances/:id/errors (GET)
export const RuntimeErrorResponseSchema = z.object({
    success: z.boolean(),
    errors: z.array(RuntimeErrorSchema),
    hasErrors: z.boolean(),
    error: z.string().optional(),
});
// /instances/:id/errors (DELETE)
export const ClearErrorsResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
});
// /instances/:id/fix-code (POST)
export const FixCodeResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    fixes: z.array(z.object({
        filePath: z.string(),
        originalCode: z.string(),
        fixedCode: z.string(),
        explanation: z.string(),
    })),
    applied: z.array(z.string()).optional(),
    failed: z.array(z.string()).optional(),
    commands: z.array(z.string()).optional(),
    error: z.string().optional(),
});
// /instances/:id (DELETE)
export const ShutdownResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    error: z.string().optional(),
});
// /templates/from-instance (POST)
export const PromoteToTemplateRequestSchema = z.object({
    instanceId: z.string(),
    templateName: z.string().optional(),
});
export const PromoteToTemplateResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    templateName: z.string().optional(),
    error: z.string().optional(),
});
// /templates (POST) - AI template generation
export const GenerateTemplateRequestSchema = z.object({
    prompt: z.string(),
    templateName: z.string(),
    options: z.object({
        framework: z.string().optional(),
        language: z.enum(['javascript', 'typescript']).optional(),
        styling: z.enum(['tailwind', 'css', 'scss']).optional(),
        features: z.array(z.string()).optional(),
    }).optional(),
});
export const GenerateTemplateResponseSchema = z.object({
    success: z.boolean(),
    templateName: z.string(),
    summary: z.string().optional(),
    fileCount: z.number().optional(),
    fileTree: FileTreeNodeSchema.optional(),
    error: z.string().optional(),
});
// /instances/:id/lint (GET)
export const LintSeveritySchema = z.enum(['error', 'warning', 'info']);
export const CodeIssueSchema = z.object({
    message: z.string(),
    filePath: z.string(),
    line: z.number(),
    column: z.number().optional(),
    severity: LintSeveritySchema,
    ruleId: z.string().optional(),
    source: z.string().optional()
});
export const CodeIssueResponseSchema = z.object({
    issues: z.array(CodeIssueSchema),
    summary: z.object({
        errorCount: z.number(),
        warningCount: z.number(),
        infoCount: z.number()
    }).optional(),
    rawOutput: z.string().optional(),
});
export const StaticAnalysisResponseSchema = z.object({
    success: z.boolean(),
    lint: CodeIssueResponseSchema,
    typecheck: CodeIssueResponseSchema,
    error: z.string().optional()
});
// --- Cloudflare Deployment ---
// /instances/:id/deploy (POST) - Request body
export const DeploymentCredentialsSchema = z.object({
    apiToken: z.string().optional(),
    accountId: z.string().optional(),
});
// /instances/:id/deploy (POST) - Response
export const DeploymentResultSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    deployedUrl: z.string().optional(),
    deploymentId: z.string().optional(),
    output: z.string().optional(),
    error: z.string().optional(),
});
// --- Webhook Event Types ---
// Base webhook event schema
export const WebhookEventBaseSchema = z.object({
    eventType: z.string(),
    instanceId: z.string(),
    timestamp: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? val : val.toISOString()),
    agentId: z.string().optional(),
});
// Runtime error webhook event - compatible with current runner service
export const WebhookRuntimeErrorEventSchema = WebhookEventBaseSchema.extend({
    eventType: z.literal('runtime_error'),
    payload: z.object({
        runId: z.string(),
        error: RuntimeErrorSchema,
        instanceInfo: z.object({
            templateName: z.string().optional(),
            serviceDirectory: z.string().optional(),
        }),
    }),
});
// Build status webhook event (for future use)
export const WebhookBuildStatusEventSchema = WebhookEventBaseSchema.extend({
    eventType: z.literal('build_status'),
    payload: z.object({
        status: z.enum(['started', 'completed', 'failed']),
        buildOutput: z.string().optional(),
        buildErrors: z.array(z.string()).optional(),
        duration: z.number().optional(),
    }),
});
// Deployment status webhook event (for future use)
export const WebhookDeploymentStatusEventSchema = WebhookEventBaseSchema.extend({
    eventType: z.literal('deployment_status'),
    payload: z.object({
        status: z.enum(['started', 'completed', 'failed']),
        deploymentType: z.enum(['preview', 'cloudflare_workers']).optional(),
        deployedUrl: z.string().optional(),
        deploymentId: z.string().optional(),
        error: z.string().optional(),
    }),
});
// Instance health webhook event (for future use)
export const WebhookInstanceHealthEventSchema = WebhookEventBaseSchema.extend({
    eventType: z.literal('instance_health'),
    payload: z.object({
        status: z.enum(['healthy', 'unhealthy', 'shutting_down']),
        uptime: z.number().optional(),
        memoryUsage: z.number().optional(),
        cpuUsage: z.number().optional(),
        lastActivity: z.union([z.string(), z.date()]).optional(),
        message: z.string().optional(),
    }),
});
// Command execution webhook event (for future use)
export const WebhookCommandExecutionEventSchema = WebhookEventBaseSchema.extend({
    eventType: z.literal('command_execution'),
    payload: z.object({
        status: z.enum(['started', 'completed', 'failed']),
        command: z.string(),
        output: z.string().optional(),
        error: z.string().optional(),
        exitCode: z.number().optional(),
        duration: z.number().optional(),
    }),
});
// Union type for all webhook events
export const WebhookEventSchema = z.discriminatedUnion('eventType', [
    WebhookRuntimeErrorEventSchema,
    WebhookBuildStatusEventSchema,
    WebhookDeploymentStatusEventSchema,
    WebhookInstanceHealthEventSchema,
    WebhookCommandExecutionEventSchema,
]);
// Webhook payload with authentication
export const WebhookPayloadSchema = z.object({
    signature: z.string().optional(),
    timestamp: z.union([z.string(), z.date()]),
    event: WebhookEventSchema,
});
// Current runner service payload (direct payload without wrapper)
export const RunnerServiceWebhookPayloadSchema = z.object({
    runId: z.string(),
    error: RuntimeErrorSchema,
    instanceInfo: z.object({
        templateName: z.string().optional(),
        serviceDirectory: z.string().optional(),
    }),
});
export const GitHubPushResponseSchema = z.object({
    success: z.boolean(),
    commitSha: z.string().optional(),
    error: z.string().optional(),
    details: z.object({
        operation: z.string().optional(),
        exitCode: z.number().optional(),
        stderr: z.string().optional(),
    }).optional(),
});
