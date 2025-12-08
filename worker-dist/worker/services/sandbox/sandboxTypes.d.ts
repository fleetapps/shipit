import * as z from 'zod';
export interface FileTreeNode {
    path: string;
    type: 'file' | 'directory';
    children?: FileTreeNode[];
}
export declare const FileTreeNodeSchema: z.ZodType<FileTreeNode>;
export declare const TemplateFileSchema: z.ZodObject<{
    filePath: z.ZodString;
    fileContents: z.ZodString;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    fileContents: string;
}, {
    filePath: string;
    fileContents: string;
}>;
export type TemplateFile = z.infer<typeof TemplateFileSchema>;
export declare const TemplateDetailsSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodObject<{
        selection: z.ZodString;
        usage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        selection: string;
        usage: string;
    }, {
        selection: string;
        usage: string;
    }>;
    fileTree: z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>;
    allFiles: z.ZodRecord<z.ZodString, z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    deps: z.ZodRecord<z.ZodString, z.ZodString>;
    frameworks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    importantFiles: z.ZodArray<z.ZodString, "many">;
    dontTouchFiles: z.ZodArray<z.ZodString, "many">;
    redactedFiles: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    description: {
        selection: string;
        usage: string;
    };
    name: string;
    fileTree: FileTreeNode;
    allFiles: Record<string, string>;
    deps: Record<string, string>;
    importantFiles: string[];
    dontTouchFiles: string[];
    redactedFiles: string[];
    language?: string | undefined;
    frameworks?: string[] | undefined;
}, {
    description: {
        selection: string;
        usage: string;
    };
    name: string;
    fileTree: FileTreeNode;
    allFiles: Record<string, string>;
    deps: Record<string, string>;
    importantFiles: string[];
    dontTouchFiles: string[];
    redactedFiles: string[];
    language?: string | undefined;
    frameworks?: string[] | undefined;
}>;
export type TemplateDetails = z.infer<typeof TemplateDetailsSchema>;
export declare const SimpleErrorSchema: z.ZodObject<{
    timestamp: z.ZodString;
    level: z.ZodNumber;
    message: z.ZodString;
    rawOutput: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    message: string;
    level: number;
    rawOutput: string;
}, {
    timestamp: string;
    message: string;
    level: number;
    rawOutput: string;
}>;
export type SimpleError = z.infer<typeof SimpleErrorSchema>;
export declare const StoredErrorSchema: z.ZodObject<{
    timestamp: z.ZodString;
    level: z.ZodNumber;
    message: z.ZodString;
    rawOutput: z.ZodString;
} & {
    id: z.ZodNumber;
    instanceId: z.ZodString;
    processId: z.ZodString;
    errorHash: z.ZodString;
    occurrenceCount: z.ZodNumber;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: number;
    timestamp: string;
    createdAt: string;
    message: string;
    level: number;
    rawOutput: string;
    instanceId: string;
    processId: string;
    errorHash: string;
    occurrenceCount: number;
}, {
    id: number;
    timestamp: string;
    createdAt: string;
    message: string;
    level: number;
    rawOutput: string;
    instanceId: string;
    processId: string;
    errorHash: string;
    occurrenceCount: number;
}>;
export type StoredError = z.infer<typeof StoredErrorSchema>;
export declare const RuntimeErrorSchema: z.ZodObject<{
    timestamp: z.ZodString;
    level: z.ZodNumber;
    message: z.ZodString;
    rawOutput: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    message: string;
    level: number;
    rawOutput: string;
}, {
    timestamp: string;
    message: string;
    level: number;
    rawOutput: string;
}>;
export type RuntimeError = z.infer<typeof RuntimeErrorSchema>;
export declare const InstanceDetailsSchema: z.ZodObject<{
    runId: z.ZodString;
    templateName: z.ZodString;
    startTime: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    uptime: z.ZodNumber;
    previewURL: z.ZodOptional<z.ZodString>;
    tunnelURL: z.ZodOptional<z.ZodString>;
    directory: z.ZodString;
    serviceDirectory: z.ZodString;
    fileTree: z.ZodOptional<z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>>;
    runtimeErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        level: z.ZodNumber;
        message: z.ZodString;
        rawOutput: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }>, "many">>;
    processId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    templateName: string;
    runId: string;
    directory: string;
    startTime: string | Date;
    uptime: number;
    serviceDirectory: string;
    fileTree?: FileTreeNode | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    runtimeErrors?: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }[] | undefined;
    processId?: string | undefined;
}, {
    templateName: string;
    runId: string;
    directory: string;
    startTime: string | Date;
    uptime: number;
    serviceDirectory: string;
    fileTree?: FileTreeNode | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    runtimeErrors?: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }[] | undefined;
    processId?: string | undefined;
}>;
export type InstanceDetails = z.infer<typeof InstanceDetailsSchema>;
export declare const CommandExecutionResultSchema: z.ZodObject<{
    command: z.ZodString;
    success: z.ZodBoolean;
    output: z.ZodString;
    error: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    output: string;
    command: string;
    error?: string | undefined;
    exitCode?: number | undefined;
}, {
    success: boolean;
    output: string;
    command: string;
    error?: string | undefined;
    exitCode?: number | undefined;
}>;
export type CommandExecutionResult = z.infer<typeof CommandExecutionResultSchema>;
export declare const TemplateInfoSchema: z.ZodObject<{
    name: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    frameworks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    description: z.ZodObject<{
        selection: z.ZodString;
        usage: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        selection: string;
        usage: string;
    }, {
        selection: string;
        usage: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: {
        selection: string;
        usage: string;
    };
    name: string;
    language?: string | undefined;
    frameworks?: string[] | undefined;
}, {
    description: {
        selection: string;
        usage: string;
    };
    name: string;
    language?: string | undefined;
    frameworks?: string[] | undefined;
}>;
export type TemplateInfo = z.infer<typeof TemplateInfoSchema>;
export declare const TemplateListResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    templates: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        language: z.ZodOptional<z.ZodString>;
        frameworks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodObject<{
            selection: z.ZodString;
            usage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            selection: string;
            usage: string;
        }, {
            selection: string;
            usage: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }, {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }>, "many">;
    count: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    count: number;
    templates: {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }[];
    error?: string | undefined;
}, {
    success: boolean;
    count: number;
    templates: {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }[];
    error?: string | undefined;
}>;
export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;
export declare const TemplateDetailsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    templateDetails: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodObject<{
            selection: z.ZodString;
            usage: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            selection: string;
            usage: string;
        }, {
            selection: string;
            usage: string;
        }>;
        fileTree: z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>;
        allFiles: z.ZodRecord<z.ZodString, z.ZodString>;
        language: z.ZodOptional<z.ZodString>;
        deps: z.ZodRecord<z.ZodString, z.ZodString>;
        frameworks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        importantFiles: z.ZodArray<z.ZodString, "many">;
        dontTouchFiles: z.ZodArray<z.ZodString, "many">;
        redactedFiles: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        fileTree: FileTreeNode;
        allFiles: Record<string, string>;
        deps: Record<string, string>;
        importantFiles: string[];
        dontTouchFiles: string[];
        redactedFiles: string[];
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }, {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        fileTree: FileTreeNode;
        allFiles: Record<string, string>;
        deps: Record<string, string>;
        importantFiles: string[];
        dontTouchFiles: string[];
        redactedFiles: string[];
        language?: string | undefined;
        frameworks?: string[] | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    templateDetails?: {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        fileTree: FileTreeNode;
        allFiles: Record<string, string>;
        deps: Record<string, string>;
        importantFiles: string[];
        dontTouchFiles: string[];
        redactedFiles: string[];
        language?: string | undefined;
        frameworks?: string[] | undefined;
    } | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    templateDetails?: {
        description: {
            selection: string;
            usage: string;
        };
        name: string;
        fileTree: FileTreeNode;
        allFiles: Record<string, string>;
        deps: Record<string, string>;
        importantFiles: string[];
        dontTouchFiles: string[];
        redactedFiles: string[];
        language?: string | undefined;
        frameworks?: string[] | undefined;
    } | undefined;
}>;
export type TemplateDetailsResponse = z.infer<typeof TemplateDetailsResponseSchema>;
export declare const GetTemplateFilesRequestSchema: z.ZodObject<{
    filePaths: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    filePaths: string[];
}, {
    filePaths: string[];
}>;
export type GetTemplateFilesRequest = z.infer<typeof GetTemplateFilesRequestSchema>;
export declare const GetTemplateFilesResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    files: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        fileContents: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        fileContents: string;
    }, {
        filePath: string;
        fileContents: string;
    }>, "many">;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        error: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        error: string;
        file: string;
    }, {
        error: string;
        file: string;
    }>, "many">>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    success: boolean;
    error?: string | undefined;
    errors?: {
        error: string;
        file: string;
    }[] | undefined;
}, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    success: boolean;
    error?: string | undefined;
    errors?: {
        error: string;
        file: string;
    }[] | undefined;
}>;
export type GetTemplateFilesResponse = z.infer<typeof GetTemplateFilesResponseSchema>;
export declare const BootstrapRequestSchema: z.ZodObject<{
    templateName: z.ZodString;
    projectName: z.ZodString;
    webhookUrl: z.ZodOptional<z.ZodString>;
    envVars: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    projectName: string;
    templateName: string;
    webhookUrl?: string | undefined;
    envVars?: Record<string, string> | undefined;
}, {
    projectName: string;
    templateName: string;
    webhookUrl?: string | undefined;
    envVars?: Record<string, string> | undefined;
}>;
export type BootstrapRequest = z.infer<typeof BootstrapRequestSchema>;
export declare const PreviewSchema: z.ZodObject<{
    runId: z.ZodOptional<z.ZodString>;
    previewURL: z.ZodOptional<z.ZodString>;
    tunnelURL: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    runId?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
}, {
    runId?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
}>;
export type PreviewType = z.infer<typeof PreviewSchema>;
export declare const BootstrapResponseSchema: z.ZodObject<{
    runId: z.ZodOptional<z.ZodString>;
    previewURL: z.ZodOptional<z.ZodString>;
    tunnelURL: z.ZodOptional<z.ZodString>;
} & {
    success: z.ZodBoolean;
    processId: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
    runId?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    processId?: string | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
    runId?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    processId?: string | undefined;
}>;
export type BootstrapResponse = z.infer<typeof BootstrapResponseSchema>;
export declare const BootstrapStatusResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    pending: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    previewURL: z.ZodOptional<z.ZodString>;
    tunnelURL: z.ZodOptional<z.ZodString>;
    processId: z.ZodOptional<z.ZodString>;
    isHealthy: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    pending: boolean;
    isHealthy: boolean;
    error?: string | undefined;
    message?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    processId?: string | undefined;
}, {
    success: boolean;
    pending: boolean;
    isHealthy: boolean;
    error?: string | undefined;
    message?: string | undefined;
    previewURL?: string | undefined;
    tunnelURL?: string | undefined;
    processId?: string | undefined;
}>;
export type BootstrapStatusResponse = z.infer<typeof BootstrapStatusResponseSchema>;
export declare const ListInstancesResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    instances: z.ZodArray<z.ZodObject<{
        runId: z.ZodString;
        templateName: z.ZodString;
        startTime: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        uptime: z.ZodNumber;
        previewURL: z.ZodOptional<z.ZodString>;
        tunnelURL: z.ZodOptional<z.ZodString>;
        directory: z.ZodString;
        serviceDirectory: z.ZodString;
        fileTree: z.ZodOptional<z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>>;
        runtimeErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            level: z.ZodNumber;
            message: z.ZodString;
            rawOutput: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }>, "many">>;
        processId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }, {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }>, "many">;
    count: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    count: number;
    instances: {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }[];
    error?: string | undefined;
}, {
    success: boolean;
    count: number;
    instances: {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }[];
    error?: string | undefined;
}>;
export type ListInstancesResponse = z.infer<typeof ListInstancesResponseSchema>;
export declare const GetInstanceResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    instance: z.ZodOptional<z.ZodObject<{
        runId: z.ZodString;
        templateName: z.ZodString;
        startTime: z.ZodUnion<[z.ZodString, z.ZodDate]>;
        uptime: z.ZodNumber;
        previewURL: z.ZodOptional<z.ZodString>;
        tunnelURL: z.ZodOptional<z.ZodString>;
        directory: z.ZodString;
        serviceDirectory: z.ZodString;
        fileTree: z.ZodOptional<z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>>;
        runtimeErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
            timestamp: z.ZodString;
            level: z.ZodNumber;
            message: z.ZodString;
            rawOutput: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }>, "many">>;
        processId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }, {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    instance?: {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    } | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    instance?: {
        templateName: string;
        runId: string;
        directory: string;
        startTime: string | Date;
        uptime: number;
        serviceDirectory: string;
        fileTree?: FileTreeNode | undefined;
        previewURL?: string | undefined;
        tunnelURL?: string | undefined;
        runtimeErrors?: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }[] | undefined;
        processId?: string | undefined;
    } | undefined;
}>;
export type GetInstanceResponse = z.infer<typeof GetInstanceResponseSchema>;
export declare const WriteFilesRequestSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        fileContents: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        fileContents: string;
    }, {
        filePath: string;
        fileContents: string;
    }>, "many">;
    commitMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    commitMessage?: string | undefined;
}, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    commitMessage?: string | undefined;
}>;
export type WriteFilesRequest = z.infer<typeof WriteFilesRequestSchema>;
export declare const GetFilesResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    files: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        fileContents: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        fileContents: string;
    }, {
        filePath: string;
        fileContents: string;
    }>, "many">;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        error: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        error: string;
        file: string;
    }, {
        error: string;
        file: string;
    }>, "many">>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    success: boolean;
    error?: string | undefined;
    errors?: {
        error: string;
        file: string;
    }[] | undefined;
}, {
    files: {
        filePath: string;
        fileContents: string;
    }[];
    success: boolean;
    error?: string | undefined;
    errors?: {
        error: string;
        file: string;
    }[] | undefined;
}>;
export type GetFilesResponse = z.infer<typeof GetFilesResponseSchema>;
export declare const WriteFilesResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    results: z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        success: z.ZodBoolean;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        file: string;
        error?: string | undefined;
    }, {
        success: boolean;
        file: string;
        error?: string | undefined;
    }>, "many">;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    results: {
        success: boolean;
        file: string;
        error?: string | undefined;
    }[];
    error?: string | undefined;
    message?: string | undefined;
}, {
    success: boolean;
    results: {
        success: boolean;
        file: string;
        error?: string | undefined;
    }[];
    error?: string | undefined;
    message?: string | undefined;
}>;
export type WriteFilesResponse = z.infer<typeof WriteFilesResponseSchema>;
export declare const GetLogsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    logs: z.ZodObject<{
        stdout: z.ZodString;
        stderr: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        stdout: string;
        stderr: string;
    }, {
        stdout: string;
        stderr: string;
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    logs: {
        stdout: string;
        stderr: string;
    };
    error?: string | undefined;
}, {
    success: boolean;
    logs: {
        stdout: string;
        stderr: string;
    };
    error?: string | undefined;
}>;
export type GetLogsResponse = z.infer<typeof GetLogsResponseSchema>;
export declare const ExecuteCommandsRequestSchema: z.ZodObject<{
    commands: z.ZodArray<z.ZodString, "many">;
    timeout: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    commands: string[];
    timeout?: number | undefined;
}, {
    commands: string[];
    timeout?: number | undefined;
}>;
export type ExecuteCommandsRequest = z.infer<typeof ExecuteCommandsRequestSchema>;
export declare const ExecuteCommandsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    results: z.ZodArray<z.ZodObject<{
        command: z.ZodString;
        success: z.ZodBoolean;
        output: z.ZodString;
        error: z.ZodOptional<z.ZodString>;
        exitCode: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        success: boolean;
        output: string;
        command: string;
        error?: string | undefined;
        exitCode?: number | undefined;
    }, {
        success: boolean;
        output: string;
        command: string;
        error?: string | undefined;
        exitCode?: number | undefined;
    }>, "many">;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    results: {
        success: boolean;
        output: string;
        command: string;
        error?: string | undefined;
        exitCode?: number | undefined;
    }[];
    error?: string | undefined;
    message?: string | undefined;
}, {
    success: boolean;
    results: {
        success: boolean;
        output: string;
        command: string;
        error?: string | undefined;
        exitCode?: number | undefined;
    }[];
    error?: string | undefined;
    message?: string | undefined;
}>;
export type ExecuteCommandsResponse = z.infer<typeof ExecuteCommandsResponseSchema>;
export declare const RuntimeErrorResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    errors: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodString;
        level: z.ZodNumber;
        message: z.ZodString;
        rawOutput: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }>, "many">;
    hasErrors: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    errors: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }[];
    hasErrors: boolean;
    error?: string | undefined;
}, {
    success: boolean;
    errors: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }[];
    hasErrors: boolean;
    error?: string | undefined;
}>;
export type RuntimeErrorResponse = z.infer<typeof RuntimeErrorResponseSchema>;
export declare const ClearErrorsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
}>;
export type ClearErrorsResponse = z.infer<typeof ClearErrorsResponseSchema>;
export declare const FixCodeResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    fixes: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        originalCode: z.ZodString;
        fixedCode: z.ZodString;
        explanation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        originalCode: string;
        fixedCode: string;
        explanation: string;
    }, {
        filePath: string;
        originalCode: string;
        fixedCode: string;
        explanation: string;
    }>, "many">;
    applied: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    failed: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    commands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    fixes: {
        filePath: string;
        originalCode: string;
        fixedCode: string;
        explanation: string;
    }[];
    error?: string | undefined;
    message?: string | undefined;
    commands?: string[] | undefined;
    failed?: string[] | undefined;
    applied?: string[] | undefined;
}, {
    success: boolean;
    fixes: {
        filePath: string;
        originalCode: string;
        fixedCode: string;
        explanation: string;
    }[];
    error?: string | undefined;
    message?: string | undefined;
    commands?: string[] | undefined;
    failed?: string[] | undefined;
    applied?: string[] | undefined;
}>;
export type FixCodeResponse = z.infer<typeof FixCodeResponseSchema>;
export declare const ShutdownResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
}>;
export type ShutdownResponse = z.infer<typeof ShutdownResponseSchema>;
export declare const PromoteToTemplateRequestSchema: z.ZodObject<{
    instanceId: z.ZodString;
    templateName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    instanceId: string;
    templateName?: string | undefined;
}, {
    instanceId: string;
    templateName?: string | undefined;
}>;
export type PromoteToTemplateRequest = z.infer<typeof PromoteToTemplateRequestSchema>;
export declare const PromoteToTemplateResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    templateName: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
    templateName?: string | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    message?: string | undefined;
    templateName?: string | undefined;
}>;
export type PromoteToTemplateResponse = z.infer<typeof PromoteToTemplateResponseSchema>;
export declare const GenerateTemplateRequestSchema: z.ZodObject<{
    prompt: z.ZodString;
    templateName: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        framework: z.ZodOptional<z.ZodString>;
        language: z.ZodOptional<z.ZodEnum<["javascript", "typescript"]>>;
        styling: z.ZodOptional<z.ZodEnum<["tailwind", "css", "scss"]>>;
        features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        framework?: string | undefined;
        language?: "typescript" | "javascript" | undefined;
        styling?: "css" | "tailwind" | "scss" | undefined;
        features?: string[] | undefined;
    }, {
        framework?: string | undefined;
        language?: "typescript" | "javascript" | undefined;
        styling?: "css" | "tailwind" | "scss" | undefined;
        features?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    templateName: string;
    prompt: string;
    options?: {
        framework?: string | undefined;
        language?: "typescript" | "javascript" | undefined;
        styling?: "css" | "tailwind" | "scss" | undefined;
        features?: string[] | undefined;
    } | undefined;
}, {
    templateName: string;
    prompt: string;
    options?: {
        framework?: string | undefined;
        language?: "typescript" | "javascript" | undefined;
        styling?: "css" | "tailwind" | "scss" | undefined;
        features?: string[] | undefined;
    } | undefined;
}>;
export type GenerateTemplateRequest = z.infer<typeof GenerateTemplateRequestSchema>;
export declare const GenerateTemplateResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    templateName: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    fileCount: z.ZodOptional<z.ZodNumber>;
    fileTree: z.ZodOptional<z.ZodType<FileTreeNode, z.ZodTypeDef, FileTreeNode>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    templateName: string;
    success: boolean;
    error?: string | undefined;
    fileTree?: FileTreeNode | undefined;
    summary?: string | undefined;
    fileCount?: number | undefined;
}, {
    templateName: string;
    success: boolean;
    error?: string | undefined;
    fileTree?: FileTreeNode | undefined;
    summary?: string | undefined;
    fileCount?: number | undefined;
}>;
export type GenerateTemplateResponse = z.infer<typeof GenerateTemplateResponseSchema>;
export declare const LintSeveritySchema: z.ZodEnum<["error", "warning", "info"]>;
export type LintSeverity = z.infer<typeof LintSeveritySchema>;
export declare const CodeIssueSchema: z.ZodObject<{
    message: z.ZodString;
    filePath: z.ZodString;
    line: z.ZodNumber;
    column: z.ZodOptional<z.ZodNumber>;
    severity: z.ZodEnum<["error", "warning", "info"]>;
    ruleId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    filePath: string;
    line: number;
    severity: "error" | "warning" | "info";
    source?: string | undefined;
    column?: number | undefined;
    ruleId?: string | undefined;
}, {
    message: string;
    filePath: string;
    line: number;
    severity: "error" | "warning" | "info";
    source?: string | undefined;
    column?: number | undefined;
    ruleId?: string | undefined;
}>;
export type CodeIssue = z.infer<typeof CodeIssueSchema>;
export declare const CodeIssueResponseSchema: z.ZodObject<{
    issues: z.ZodArray<z.ZodObject<{
        message: z.ZodString;
        filePath: z.ZodString;
        line: z.ZodNumber;
        column: z.ZodOptional<z.ZodNumber>;
        severity: z.ZodEnum<["error", "warning", "info"]>;
        ruleId: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        filePath: string;
        line: number;
        severity: "error" | "warning" | "info";
        source?: string | undefined;
        column?: number | undefined;
        ruleId?: string | undefined;
    }, {
        message: string;
        filePath: string;
        line: number;
        severity: "error" | "warning" | "info";
        source?: string | undefined;
        column?: number | undefined;
        ruleId?: string | undefined;
    }>, "many">;
    summary: z.ZodOptional<z.ZodObject<{
        errorCount: z.ZodNumber;
        warningCount: z.ZodNumber;
        infoCount: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        errorCount: number;
        warningCount: number;
        infoCount: number;
    }, {
        errorCount: number;
        warningCount: number;
        infoCount: number;
    }>>;
    rawOutput: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    issues: {
        message: string;
        filePath: string;
        line: number;
        severity: "error" | "warning" | "info";
        source?: string | undefined;
        column?: number | undefined;
        ruleId?: string | undefined;
    }[];
    rawOutput?: string | undefined;
    summary?: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
    } | undefined;
}, {
    issues: {
        message: string;
        filePath: string;
        line: number;
        severity: "error" | "warning" | "info";
        source?: string | undefined;
        column?: number | undefined;
        ruleId?: string | undefined;
    }[];
    rawOutput?: string | undefined;
    summary?: {
        errorCount: number;
        warningCount: number;
        infoCount: number;
    } | undefined;
}>;
export type CodeIssueResponse = z.infer<typeof CodeIssueResponseSchema>;
export declare const StaticAnalysisResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    lint: z.ZodObject<{
        issues: z.ZodArray<z.ZodObject<{
            message: z.ZodString;
            filePath: z.ZodString;
            line: z.ZodNumber;
            column: z.ZodOptional<z.ZodNumber>;
            severity: z.ZodEnum<["error", "warning", "info"]>;
            ruleId: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }, {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }>, "many">;
        summary: z.ZodOptional<z.ZodObject<{
            errorCount: z.ZodNumber;
            warningCount: z.ZodNumber;
            infoCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        }, {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        }>>;
        rawOutput: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    }, {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    }>;
    typecheck: z.ZodObject<{
        issues: z.ZodArray<z.ZodObject<{
            message: z.ZodString;
            filePath: z.ZodString;
            line: z.ZodNumber;
            column: z.ZodOptional<z.ZodNumber>;
            severity: z.ZodEnum<["error", "warning", "info"]>;
            ruleId: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }, {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }>, "many">;
        summary: z.ZodOptional<z.ZodObject<{
            errorCount: z.ZodNumber;
            warningCount: z.ZodNumber;
            infoCount: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        }, {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        }>>;
        rawOutput: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    }, {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    }>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    lint: {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    };
    typecheck: {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    };
    error?: string | undefined;
}, {
    success: boolean;
    lint: {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    };
    typecheck: {
        issues: {
            message: string;
            filePath: string;
            line: number;
            severity: "error" | "warning" | "info";
            source?: string | undefined;
            column?: number | undefined;
            ruleId?: string | undefined;
        }[];
        rawOutput?: string | undefined;
        summary?: {
            errorCount: number;
            warningCount: number;
            infoCount: number;
        } | undefined;
    };
    error?: string | undefined;
}>;
export type StaticAnalysisResponse = z.infer<typeof StaticAnalysisResponseSchema>;
export declare const DeploymentCredentialsSchema: z.ZodObject<{
    apiToken: z.ZodOptional<z.ZodString>;
    accountId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    accountId?: string | undefined;
    apiToken?: string | undefined;
}, {
    accountId?: string | undefined;
    apiToken?: string | undefined;
}>;
export type DeploymentCredentials = z.infer<typeof DeploymentCredentialsSchema>;
export declare const DeploymentResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    deployedUrl: z.ZodOptional<z.ZodString>;
    deploymentId: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    deploymentId?: string | undefined;
    error?: string | undefined;
    output?: string | undefined;
    deployedUrl?: string | undefined;
}, {
    message: string;
    success: boolean;
    deploymentId?: string | undefined;
    error?: string | undefined;
    output?: string | undefined;
    deployedUrl?: string | undefined;
}>;
export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;
export declare const WebhookEventBaseSchema: z.ZodObject<{
    eventType: z.ZodString;
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    eventType: string;
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    eventType: string;
    agentId?: string | undefined;
}>;
export declare const WebhookRuntimeErrorEventSchema: z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"runtime_error">;
    payload: z.ZodObject<{
        runId: z.ZodString;
        error: z.ZodObject<{
            timestamp: z.ZodString;
            level: z.ZodNumber;
            message: z.ZodString;
            rawOutput: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }>;
        instanceInfo: z.ZodObject<{
            templateName: z.ZodOptional<z.ZodString>;
            serviceDirectory: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        }, {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    }, {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    };
    eventType: "runtime_error";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    };
    eventType: "runtime_error";
    agentId?: string | undefined;
}>;
export type WebhookRuntimeErrorEvent = z.infer<typeof WebhookRuntimeErrorEventSchema>;
export declare const WebhookBuildStatusEventSchema: z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"build_status">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        buildOutput: z.ZodOptional<z.ZodString>;
        buildErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    }, {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    };
    eventType: "build_status";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    };
    eventType: "build_status";
    agentId?: string | undefined;
}>;
export type WebhookBuildStatusEvent = z.infer<typeof WebhookBuildStatusEventSchema>;
export declare const WebhookDeploymentStatusEventSchema: z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"deployment_status">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        deploymentType: z.ZodOptional<z.ZodEnum<["preview", "cloudflare_workers"]>>;
        deployedUrl: z.ZodOptional<z.ZodString>;
        deploymentId: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    }, {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    };
    eventType: "deployment_status";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    };
    eventType: "deployment_status";
    agentId?: string | undefined;
}>;
export type WebhookDeploymentStatusEvent = z.infer<typeof WebhookDeploymentStatusEventSchema>;
export declare const WebhookInstanceHealthEventSchema: z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"instance_health">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["healthy", "unhealthy", "shutting_down"]>;
        uptime: z.ZodOptional<z.ZodNumber>;
        memoryUsage: z.ZodOptional<z.ZodNumber>;
        cpuUsage: z.ZodOptional<z.ZodNumber>;
        lastActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    }, {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    };
    eventType: "instance_health";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    };
    eventType: "instance_health";
    agentId?: string | undefined;
}>;
export type WebhookInstanceHealthEvent = z.infer<typeof WebhookInstanceHealthEventSchema>;
export declare const WebhookCommandExecutionEventSchema: z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"command_execution">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        command: z.ZodString;
        output: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    }, {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    };
    eventType: "command_execution";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    };
    eventType: "command_execution";
    agentId?: string | undefined;
}>;
export type WebhookCommandExecutionEvent = z.infer<typeof WebhookCommandExecutionEventSchema>;
export declare const WebhookEventSchema: z.ZodDiscriminatedUnion<"eventType", [z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"runtime_error">;
    payload: z.ZodObject<{
        runId: z.ZodString;
        error: z.ZodObject<{
            timestamp: z.ZodString;
            level: z.ZodNumber;
            message: z.ZodString;
            rawOutput: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }, {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        }>;
        instanceInfo: z.ZodObject<{
            templateName: z.ZodOptional<z.ZodString>;
            serviceDirectory: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        }, {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    }, {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    };
    eventType: "runtime_error";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        error: {
            timestamp: string;
            message: string;
            level: number;
            rawOutput: string;
        };
        runId: string;
        instanceInfo: {
            templateName?: string | undefined;
            serviceDirectory?: string | undefined;
        };
    };
    eventType: "runtime_error";
    agentId?: string | undefined;
}>, z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"build_status">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        buildOutput: z.ZodOptional<z.ZodString>;
        buildErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    }, {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    };
    eventType: "build_status";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        duration?: number | undefined;
        buildOutput?: string | undefined;
        buildErrors?: string[] | undefined;
    };
    eventType: "build_status";
    agentId?: string | undefined;
}>, z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"deployment_status">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        deploymentType: z.ZodOptional<z.ZodEnum<["preview", "cloudflare_workers"]>>;
        deployedUrl: z.ZodOptional<z.ZodString>;
        deploymentId: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    }, {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    };
    eventType: "deployment_status";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        deploymentId?: string | undefined;
        error?: string | undefined;
        deployedUrl?: string | undefined;
        deploymentType?: "preview" | "cloudflare_workers" | undefined;
    };
    eventType: "deployment_status";
    agentId?: string | undefined;
}>, z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"instance_health">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["healthy", "unhealthy", "shutting_down"]>;
        uptime: z.ZodOptional<z.ZodNumber>;
        memoryUsage: z.ZodOptional<z.ZodNumber>;
        cpuUsage: z.ZodOptional<z.ZodNumber>;
        lastActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    }, {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    };
    eventType: "instance_health";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "healthy" | "unhealthy" | "shutting_down";
        message?: string | undefined;
        lastActivity?: string | Date | undefined;
        uptime?: number | undefined;
        memoryUsage?: number | undefined;
        cpuUsage?: number | undefined;
    };
    eventType: "instance_health";
    agentId?: string | undefined;
}>, z.ZodObject<{
    instanceId: z.ZodString;
    timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
    agentId: z.ZodOptional<z.ZodString>;
} & {
    eventType: z.ZodLiteral<"command_execution">;
    payload: z.ZodObject<{
        status: z.ZodEnum<["started", "completed", "failed"]>;
        command: z.ZodString;
        output: z.ZodOptional<z.ZodString>;
        error: z.ZodOptional<z.ZodString>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    }, {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    timestamp: string;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    };
    eventType: "command_execution";
    agentId?: string | undefined;
}, {
    timestamp: string | Date;
    instanceId: string;
    payload: {
        status: "completed" | "failed" | "started";
        command: string;
        duration?: number | undefined;
        error?: string | undefined;
        output?: string | undefined;
        exitCode?: number | undefined;
    };
    eventType: "command_execution";
    agentId?: string | undefined;
}>]>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;
export declare const WebhookPayloadSchema: z.ZodObject<{
    signature: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    event: z.ZodDiscriminatedUnion<"eventType", [z.ZodObject<{
        instanceId: z.ZodString;
        timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
        agentId: z.ZodOptional<z.ZodString>;
    } & {
        eventType: z.ZodLiteral<"runtime_error">;
        payload: z.ZodObject<{
            runId: z.ZodString;
            error: z.ZodObject<{
                timestamp: z.ZodString;
                level: z.ZodNumber;
                message: z.ZodString;
                rawOutput: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            }, {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            }>;
            instanceInfo: z.ZodObject<{
                templateName: z.ZodOptional<z.ZodString>;
                serviceDirectory: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            }, {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        }, {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        instanceId: string;
        payload: {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        };
        eventType: "runtime_error";
        agentId?: string | undefined;
    }, {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        };
        eventType: "runtime_error";
        agentId?: string | undefined;
    }>, z.ZodObject<{
        instanceId: z.ZodString;
        timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
        agentId: z.ZodOptional<z.ZodString>;
    } & {
        eventType: z.ZodLiteral<"build_status">;
        payload: z.ZodObject<{
            status: z.ZodEnum<["started", "completed", "failed"]>;
            buildOutput: z.ZodOptional<z.ZodString>;
            buildErrors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            duration: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        }, {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        };
        eventType: "build_status";
        agentId?: string | undefined;
    }, {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        };
        eventType: "build_status";
        agentId?: string | undefined;
    }>, z.ZodObject<{
        instanceId: z.ZodString;
        timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
        agentId: z.ZodOptional<z.ZodString>;
    } & {
        eventType: z.ZodLiteral<"deployment_status">;
        payload: z.ZodObject<{
            status: z.ZodEnum<["started", "completed", "failed"]>;
            deploymentType: z.ZodOptional<z.ZodEnum<["preview", "cloudflare_workers"]>>;
            deployedUrl: z.ZodOptional<z.ZodString>;
            deploymentId: z.ZodOptional<z.ZodString>;
            error: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        }, {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        };
        eventType: "deployment_status";
        agentId?: string | undefined;
    }, {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        };
        eventType: "deployment_status";
        agentId?: string | undefined;
    }>, z.ZodObject<{
        instanceId: z.ZodString;
        timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
        agentId: z.ZodOptional<z.ZodString>;
    } & {
        eventType: z.ZodLiteral<"instance_health">;
        payload: z.ZodObject<{
            status: z.ZodEnum<["healthy", "unhealthy", "shutting_down"]>;
            uptime: z.ZodOptional<z.ZodNumber>;
            memoryUsage: z.ZodOptional<z.ZodNumber>;
            cpuUsage: z.ZodOptional<z.ZodNumber>;
            lastActivity: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
            message: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        }, {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        };
        eventType: "instance_health";
        agentId?: string | undefined;
    }, {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        };
        eventType: "instance_health";
        agentId?: string | undefined;
    }>, z.ZodObject<{
        instanceId: z.ZodString;
        timestamp: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodDate]>, string, string | Date>;
        agentId: z.ZodOptional<z.ZodString>;
    } & {
        eventType: z.ZodLiteral<"command_execution">;
        payload: z.ZodObject<{
            status: z.ZodEnum<["started", "completed", "failed"]>;
            command: z.ZodString;
            output: z.ZodOptional<z.ZodString>;
            error: z.ZodOptional<z.ZodString>;
            exitCode: z.ZodOptional<z.ZodNumber>;
            duration: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        }, {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        };
        eventType: "command_execution";
        agentId?: string | undefined;
    }, {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        };
        eventType: "command_execution";
        agentId?: string | undefined;
    }>]>;
}, "strip", z.ZodTypeAny, {
    timestamp: string | Date;
    event: {
        timestamp: string;
        instanceId: string;
        payload: {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        };
        eventType: "runtime_error";
        agentId?: string | undefined;
    } | {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        };
        eventType: "build_status";
        agentId?: string | undefined;
    } | {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        };
        eventType: "deployment_status";
        agentId?: string | undefined;
    } | {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        };
        eventType: "instance_health";
        agentId?: string | undefined;
    } | {
        timestamp: string;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        };
        eventType: "command_execution";
        agentId?: string | undefined;
    };
    signature?: string | undefined;
}, {
    timestamp: string | Date;
    event: {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            error: {
                timestamp: string;
                message: string;
                level: number;
                rawOutput: string;
            };
            runId: string;
            instanceInfo: {
                templateName?: string | undefined;
                serviceDirectory?: string | undefined;
            };
        };
        eventType: "runtime_error";
        agentId?: string | undefined;
    } | {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            duration?: number | undefined;
            buildOutput?: string | undefined;
            buildErrors?: string[] | undefined;
        };
        eventType: "build_status";
        agentId?: string | undefined;
    } | {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            deploymentId?: string | undefined;
            error?: string | undefined;
            deployedUrl?: string | undefined;
            deploymentType?: "preview" | "cloudflare_workers" | undefined;
        };
        eventType: "deployment_status";
        agentId?: string | undefined;
    } | {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "healthy" | "unhealthy" | "shutting_down";
            message?: string | undefined;
            lastActivity?: string | Date | undefined;
            uptime?: number | undefined;
            memoryUsage?: number | undefined;
            cpuUsage?: number | undefined;
        };
        eventType: "instance_health";
        agentId?: string | undefined;
    } | {
        timestamp: string | Date;
        instanceId: string;
        payload: {
            status: "completed" | "failed" | "started";
            command: string;
            duration?: number | undefined;
            error?: string | undefined;
            output?: string | undefined;
            exitCode?: number | undefined;
        };
        eventType: "command_execution";
        agentId?: string | undefined;
    };
    signature?: string | undefined;
}>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export declare const RunnerServiceWebhookPayloadSchema: z.ZodObject<{
    runId: z.ZodString;
    error: z.ZodObject<{
        timestamp: z.ZodString;
        level: z.ZodNumber;
        message: z.ZodString;
        rawOutput: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }, {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    }>;
    instanceInfo: z.ZodObject<{
        templateName: z.ZodOptional<z.ZodString>;
        serviceDirectory: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        templateName?: string | undefined;
        serviceDirectory?: string | undefined;
    }, {
        templateName?: string | undefined;
        serviceDirectory?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    };
    runId: string;
    instanceInfo: {
        templateName?: string | undefined;
        serviceDirectory?: string | undefined;
    };
}, {
    error: {
        timestamp: string;
        message: string;
        level: number;
        rawOutput: string;
    };
    runId: string;
    instanceInfo: {
        templateName?: string | undefined;
        serviceDirectory?: string | undefined;
    };
}>;
export type RunnerServiceWebhookPayload = z.infer<typeof RunnerServiceWebhookPayloadSchema>;
/**
 * GitHub integration types for exporting generated applications
 */
interface GitHubUserInfo {
    token: string;
    email: string;
    username: string;
    isPrivate: boolean;
}
export interface GitHubPushRequest extends GitHubUserInfo {
    cloneUrl: string;
    repositoryHtmlUrl: string;
}
export declare const GitHubPushResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    commitSha: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodObject<{
        operation: z.ZodOptional<z.ZodString>;
        exitCode: z.ZodOptional<z.ZodNumber>;
        stderr: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        exitCode?: number | undefined;
        stderr?: string | undefined;
        operation?: string | undefined;
    }, {
        exitCode?: number | undefined;
        stderr?: string | undefined;
        operation?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    commitSha?: string | undefined;
    details?: {
        exitCode?: number | undefined;
        stderr?: string | undefined;
        operation?: string | undefined;
    } | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    commitSha?: string | undefined;
    details?: {
        exitCode?: number | undefined;
        stderr?: string | undefined;
        operation?: string | undefined;
    } | undefined;
}>;
export type GitHubPushResponse = z.infer<typeof GitHubPushResponseSchema>;
export {};
