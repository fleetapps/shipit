import { StructuredLogger } from '../../logger';
export interface ResourceProvisionResult {
    success: boolean;
    resourceId?: string;
    error?: string;
}
export interface CloudflareKVNamespaceResponse {
    success: boolean;
    errors: any[];
    messages: any[];
    result?: {
        id: string;
        title: string;
        supports_url_encoding: boolean;
    };
}
export interface CloudflareD1DatabaseResponse {
    success: boolean;
    errors: any[];
    messages: any[];
    result?: {
        uuid: string;
        name: string;
        version: string;
        num_tables: number;
        file_size: number;
        running_in_region: string;
    };
}
export declare class ResourceProvisioner {
    private logger;
    private accountId;
    private apiToken;
    constructor(logger: StructuredLogger);
    private getCloudflareHeaders;
    createKVNamespace(projectName: string): Promise<ResourceProvisionResult>;
    createD1Database(projectName: string): Promise<ResourceProvisionResult>;
    provisionResource(resourceType: 'KV' | 'D1', projectName: string): Promise<ResourceProvisionResult>;
}
