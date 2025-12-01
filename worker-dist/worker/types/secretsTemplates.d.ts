/**
 * Secret template interface for getTemplates
 */
export interface SecretTemplate {
    id: string;
    displayName: string;
    envVarName: string;
    provider: string;
    icon: string;
    description: string;
    instructions: string;
    placeholder: string;
    validation: string;
    required: boolean;
    category: string;
}
export declare function getTemplatesData(): SecretTemplate[];
/**
 * Get BYOK templates dynamically
 */
export declare function getBYOKTemplates(): SecretTemplate[];
