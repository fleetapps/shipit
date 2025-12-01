import z from 'zod';
export declare const TemplateSelectionSchema: z.ZodObject<{
    selectedTemplateName: z.ZodNullable<z.ZodString>;
    reasoning: z.ZodString;
    useCase: z.ZodNullable<z.ZodEnum<["SaaS Product Website", "Dashboard", "Blog", "Portfolio", "E-Commerce", "General", "Other"]>>;
    complexity: z.ZodNullable<z.ZodEnum<["simple", "moderate", "complex"]>>;
    styleSelection: z.ZodNullable<z.ZodEnum<["Minimalist Design", "Brutalism", "Retro", "Illustrative", "Kid_Playful", "Custom"]>>;
    projectName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reasoning: string;
    selectedTemplateName: string | null;
    useCase: "SaaS Product Website" | "Dashboard" | "Blog" | "Portfolio" | "E-Commerce" | "General" | "Other" | null;
    complexity: "simple" | "moderate" | "complex" | null;
    styleSelection: "Minimalist Design" | "Brutalism" | "Retro" | "Illustrative" | "Kid_Playful" | "Custom" | null;
    projectName: string;
}, {
    reasoning: string;
    selectedTemplateName: string | null;
    useCase: "SaaS Product Website" | "Dashboard" | "Blog" | "Portfolio" | "E-Commerce" | "General" | "Other" | null;
    complexity: "simple" | "moderate" | "complex" | null;
    styleSelection: "Minimalist Design" | "Brutalism" | "Retro" | "Illustrative" | "Kid_Playful" | "Custom" | null;
    projectName: string;
}>;
export declare const FileOutputSchema: z.ZodObject<{
    filePath: z.ZodString;
    fileContents: z.ZodString;
    filePurpose: z.ZodString;
}, "strip", z.ZodTypeAny, {
    filePath: string;
    fileContents: string;
    filePurpose: string;
}, {
    filePath: string;
    fileContents: string;
    filePurpose: string;
}>;
export declare const FileConceptSchema: z.ZodObject<{
    path: z.ZodString;
    purpose: z.ZodString;
    changes: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    purpose: string;
    changes: string | null;
}, {
    path: string;
    purpose: string;
    changes: string | null;
}>;
export declare const PhaseConceptSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        purpose: z.ZodString;
        changes: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        purpose: string;
        changes: string | null;
    }, {
        path: string;
        purpose: string;
        changes: string | null;
    }>, "many">;
    lastPhase: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    files: {
        path: string;
        purpose: string;
        changes: string | null;
    }[];
    lastPhase: boolean;
}, {
    name: string;
    description: string;
    files: {
        path: string;
        purpose: string;
        changes: string | null;
    }[];
    lastPhase: boolean;
}>;
export declare const PhaseConceptLiteSchema: z.ZodObject<Omit<{
    name: z.ZodString;
    description: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        purpose: z.ZodString;
        changes: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        purpose: string;
        changes: string | null;
    }, {
        path: string;
        purpose: string;
        changes: string | null;
    }>, "many">;
    lastPhase: z.ZodBoolean;
}, "files" | "lastPhase">, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
}, {
    name: string;
    description: string;
}>;
/**
 * Schema for file generation output
 */
export declare const FileGenerationOutput: z.ZodObject<{
    filePath: z.ZodString;
    fileContents: z.ZodString;
    filePurpose: z.ZodString;
} & {
    format: z.ZodEnum<["full_content", "unified_diff"]>;
}, "strip", z.ZodTypeAny, {
    format: "full_content" | "unified_diff";
    filePath: string;
    fileContents: string;
    filePurpose: string;
}, {
    format: "full_content" | "unified_diff";
    filePath: string;
    fileContents: string;
    filePurpose: string;
}>;
export declare const PhaseConceptGenerationSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        purpose: z.ZodString;
        changes: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        purpose: string;
        changes: string | null;
    }, {
        path: string;
        purpose: string;
        changes: string | null;
    }>, "many">;
    lastPhase: z.ZodBoolean;
} & {
    installCommands: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    files: {
        path: string;
        purpose: string;
        changes: string | null;
    }[];
    lastPhase: boolean;
    installCommands: string[];
}, {
    name: string;
    description: string;
    files: {
        path: string;
        purpose: string;
        changes: string | null;
    }[];
    lastPhase: boolean;
    installCommands: string[];
}>;
export declare const PhaseImplementationSchema: z.ZodObject<{
    files: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        fileContents: z.ZodString;
        filePurpose: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        filePath: string;
        fileContents: string;
        filePurpose: string;
    }, {
        filePath: string;
        fileContents: string;
        filePurpose: string;
    }>, "many">;
    deploymentNeeded: z.ZodBoolean;
    commands: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    files: {
        filePath: string;
        fileContents: string;
        filePurpose: string;
    }[];
    deploymentNeeded: boolean;
    commands: string[];
}, {
    files: {
        filePath: string;
        fileContents: string;
        filePurpose: string;
    }[];
    deploymentNeeded: boolean;
    commands: string[];
}>;
/**
 * Schema for code documentation fetch output
 */
export declare const DocumentationOutput: z.ZodObject<{
    content: z.ZodString;
    source: z.ZodString;
}, "strip", z.ZodTypeAny, {
    content: string;
    source: string;
}, {
    content: string;
    source: string;
}>;
/**
 * Schema for code review output
 */
export declare const CodeReviewOutput: z.ZodObject<{
    dependenciesNotMet: z.ZodArray<z.ZodString, "many">;
    issuesFound: z.ZodBoolean;
    frontendIssues: z.ZodArray<z.ZodString, "many">;
    backendIssues: z.ZodArray<z.ZodString, "many">;
    filesToFix: z.ZodArray<z.ZodObject<{
        filePath: z.ZodString;
        issues: z.ZodArray<z.ZodString, "many">;
        require_code_changes: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        filePath: string;
        require_code_changes: boolean;
    }, {
        issues: string[];
        filePath: string;
        require_code_changes: boolean;
    }>, "many">;
    commands: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    commands: string[];
    dependenciesNotMet: string[];
    issuesFound: boolean;
    frontendIssues: string[];
    backendIssues: string[];
    filesToFix: {
        issues: string[];
        filePath: string;
        require_code_changes: boolean;
    }[];
}, {
    commands: string[];
    dependenciesNotMet: string[];
    issuesFound: boolean;
    frontendIssues: string[];
    backendIssues: string[];
    filesToFix: {
        issues: string[];
        filePath: string;
        require_code_changes: boolean;
    }[];
}>;
export declare const BlueprintSchema: z.ZodObject<{
    title: z.ZodString;
    projectName: z.ZodString;
    detailedDescription: z.ZodString;
    description: z.ZodString;
    colorPalette: z.ZodArray<z.ZodString, "many">;
    views: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
    }, {
        name: string;
        description: string;
    }>, "many">;
    userFlow: z.ZodObject<{
        uiLayout: z.ZodString;
        uiDesign: z.ZodString;
        userJourney: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    }, {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    }>;
    dataFlow: z.ZodString;
    architecture: z.ZodObject<{
        dataFlow: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        dataFlow: string;
    }, {
        dataFlow: string;
    }>;
    pitfalls: z.ZodArray<z.ZodString, "many">;
    frameworks: z.ZodArray<z.ZodString, "many">;
    implementationRoadmap: z.ZodArray<z.ZodObject<{
        phase: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        phase: string;
    }, {
        description: string;
        phase: string;
    }>, "many">;
    initialPhase: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        files: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            purpose: z.ZodString;
            changes: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            purpose: string;
            changes: string | null;
        }, {
            path: string;
            purpose: string;
            changes: string | null;
        }>, "many">;
        lastPhase: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    }, {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    projectName: string;
    description: string;
    title: string;
    detailedDescription: string;
    colorPalette: string[];
    views: {
        name: string;
        description: string;
    }[];
    userFlow: {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    };
    dataFlow: string;
    architecture: {
        dataFlow: string;
    };
    pitfalls: string[];
    frameworks: string[];
    implementationRoadmap: {
        description: string;
        phase: string;
    }[];
    initialPhase: {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    };
}, {
    projectName: string;
    description: string;
    title: string;
    detailedDescription: string;
    colorPalette: string[];
    views: {
        name: string;
        description: string;
    }[];
    userFlow: {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    };
    dataFlow: string;
    architecture: {
        dataFlow: string;
    };
    pitfalls: string[];
    frameworks: string[];
    implementationRoadmap: {
        description: string;
        phase: string;
    }[];
    initialPhase: {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    };
}>;
export declare const BlueprintSchemaLite: z.ZodObject<Omit<{
    title: z.ZodString;
    projectName: z.ZodString;
    detailedDescription: z.ZodString;
    description: z.ZodString;
    colorPalette: z.ZodArray<z.ZodString, "many">;
    views: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
    }, {
        name: string;
        description: string;
    }>, "many">;
    userFlow: z.ZodObject<{
        uiLayout: z.ZodString;
        uiDesign: z.ZodString;
        userJourney: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    }, {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    }>;
    dataFlow: z.ZodString;
    architecture: z.ZodObject<{
        dataFlow: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        dataFlow: string;
    }, {
        dataFlow: string;
    }>;
    pitfalls: z.ZodArray<z.ZodString, "many">;
    frameworks: z.ZodArray<z.ZodString, "many">;
    implementationRoadmap: z.ZodArray<z.ZodObject<{
        phase: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        phase: string;
    }, {
        description: string;
        phase: string;
    }>, "many">;
    initialPhase: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        files: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            purpose: z.ZodString;
            changes: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            purpose: string;
            changes: string | null;
        }, {
            path: string;
            purpose: string;
            changes: string | null;
        }>, "many">;
        lastPhase: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    }, {
        name: string;
        description: string;
        files: {
            path: string;
            purpose: string;
            changes: string | null;
        }[];
        lastPhase: boolean;
    }>;
}, "initialPhase">, "strip", z.ZodTypeAny, {
    projectName: string;
    description: string;
    title: string;
    detailedDescription: string;
    colorPalette: string[];
    views: {
        name: string;
        description: string;
    }[];
    userFlow: {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    };
    dataFlow: string;
    architecture: {
        dataFlow: string;
    };
    pitfalls: string[];
    frameworks: string[];
    implementationRoadmap: {
        description: string;
        phase: string;
    }[];
}, {
    projectName: string;
    description: string;
    title: string;
    detailedDescription: string;
    colorPalette: string[];
    views: {
        name: string;
        description: string;
    }[];
    userFlow: {
        uiLayout: string;
        uiDesign: string;
        userJourney: string;
    };
    dataFlow: string;
    architecture: {
        dataFlow: string;
    };
    pitfalls: string[];
    frameworks: string[];
    implementationRoadmap: {
        description: string;
        phase: string;
    }[];
}>;
export declare const SetupCommandsSchema: z.ZodObject<{
    commands: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    commands: string[];
}, {
    commands: string[];
}>;
export declare const ScreenshotAnalysisSchema: z.ZodObject<{
    hasIssues: z.ZodBoolean;
    issues: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    uiCompliance: z.ZodObject<{
        matchesBlueprint: z.ZodBoolean;
        deviations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        matchesBlueprint: boolean;
        deviations: string[];
    }, {
        matchesBlueprint: boolean;
        deviations: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    issues: string[];
    hasIssues: boolean;
    suggestions: string[];
    uiCompliance: {
        matchesBlueprint: boolean;
        deviations: string[];
    };
}, {
    issues: string[];
    hasIssues: boolean;
    suggestions: string[];
    uiCompliance: {
        matchesBlueprint: boolean;
        deviations: string[];
    };
}>;
export type TemplateSelection = z.infer<typeof TemplateSelectionSchema>;
export type Blueprint = z.infer<typeof BlueprintSchema>;
export type FileConceptType = z.infer<typeof FileConceptSchema>;
export type PhaseConceptType = z.infer<typeof PhaseConceptSchema>;
export type PhaseConceptLiteType = z.infer<typeof PhaseConceptLiteSchema>;
export type FileOutputType = z.infer<typeof FileOutputSchema>;
export type PhaseConceptGenerationSchemaType = z.infer<typeof PhaseConceptGenerationSchema>;
export type PhaseImplementationSchemaType = z.infer<typeof PhaseImplementationSchema>;
export type FileGenerationOutputType = z.infer<typeof FileGenerationOutput>;
export type DocumentationOutputType = z.infer<typeof DocumentationOutput>;
export type CodeReviewOutputType = z.infer<typeof CodeReviewOutput>;
export type SetupCommandsType = z.infer<typeof SetupCommandsSchema>;
export type ScreenshotAnalysisType = z.infer<typeof ScreenshotAnalysisSchema>;
export declare const ConversationalResponseSchema: z.ZodObject<{
    userResponse: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userResponse: string;
}, {
    userResponse: string;
}>;
export type ConversationalResponseType = z.infer<typeof ConversationalResponseSchema>;
