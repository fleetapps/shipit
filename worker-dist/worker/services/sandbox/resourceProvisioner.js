import { env } from 'cloudflare:workers';
export class ResourceProvisioner {
    logger;
    accountId;
    apiToken;
    constructor(logger) {
        this.logger = logger;
        this.accountId = env.CLOUDFLARE_ACCOUNT_ID;
        this.apiToken = env.CLOUDFLARE_API_TOKEN;
        if (!this.accountId || !this.apiToken) {
            this.logger.error('Missing required environment variables for resource provisioning', {
                hasAccountId: !!this.accountId,
                hasApiToken: !!this.apiToken
            });
            throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set for resource provisioning');
        }
        this.logger.info('ResourceProvisioner initialized successfully', {
            accountId: this.accountId.substring(0, 8) + '...'
        });
    }
    getCloudflareHeaders() {
        return {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
        };
    }
    async createKVNamespace(projectName) {
        try {
            this.logger.info(`Creating KV namespace for project: ${projectName}`);
            const namespaceName = `${projectName}-kv-${Date.now()}`;
            const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getCloudflareHeaders(),
                body: JSON.stringify({
                    title: namespaceName
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Failed to create KV namespace: HTTP ${response.status}`, { errorText });
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }
            const result = await response.json();
            if (!result.success || !result.result?.id) {
                this.logger.error('KV namespace creation failed', result.errors);
                return {
                    success: false,
                    error: `API error: ${JSON.stringify(result.errors)}`
                };
            }
            this.logger.info(`Successfully created KV namespace: ${result.result.id}`, {
                namespaceName,
                namespaceId: result.result.id
            });
            return {
                success: true,
                resourceId: result.result.id
            };
        }
        catch (error) {
            this.logger.error('Exception while creating KV namespace', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async createD1Database(projectName) {
        try {
            this.logger.info(`Creating D1 database for project: ${projectName}`);
            const databaseName = `${projectName}-db-${Date.now()}`;
            const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database`;
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getCloudflareHeaders(),
                body: JSON.stringify({
                    name: databaseName
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Failed to create D1 database: HTTP ${response.status}`, { errorText });
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`
                };
            }
            const result = await response.json();
            if (!result.success || !result.result?.uuid) {
                this.logger.error('D1 database creation failed', result.errors);
                return {
                    success: false,
                    error: `API error: ${JSON.stringify(result.errors)}`
                };
            }
            this.logger.info(`Successfully created D1 database: ${result.result.uuid}`, {
                databaseName,
                databaseId: result.result.uuid
            });
            return {
                success: true,
                resourceId: result.result.uuid
            };
        }
        catch (error) {
            this.logger.error('Exception while creating D1 database', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async provisionResource(resourceType, projectName) {
        switch (resourceType) {
            case 'KV':
                return this.createKVNamespace(projectName);
            case 'D1':
                return this.createD1Database(projectName);
            default:
                return {
                    success: false,
                    error: `Unsupported resource type: ${resourceType}`
                };
        }
    }
}
