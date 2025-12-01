import type { MemFS } from '../../agents/git/memfs';
import type { TemplateDetails as SandboxTemplateDetails } from '../../services/sandbox/sandboxTypes';
export declare class GitCache {
    constructor();
    private getTemplateHash;
    private getCacheKey;
    /**
     * Check if in-memory cache is valid and fresh (< 5 seconds old)
     */
    private checkMemoryCache;
    /**
     * Store repository in memory cache
     */
    private storeInMemory;
    /**
     * Get repository from in-memory cache
     */
    getRepository(appId: string, agentHeadOid: string, templateDetails: SandboxTemplateDetails | null | undefined): Promise<{
        repo: MemFS | null;
        source: 'memory' | 'miss';
    }>;
    /**
     * Store repository in memory cache
     */
    storeRepository(appId: string, repo: MemFS, agentHeadOid: string, templateDetails: SandboxTemplateDetails | null | undefined): void;
    /**
     * Clear cache for an app
     */
    clearCache(appId: string): void;
}
