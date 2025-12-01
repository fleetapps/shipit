/**
 * Git clone service for building and serving repositories
 * Handles template rebasing and git HTTP protocol
 */
import { MemFS } from './memfs';
import type { TemplateDetails as SandboxTemplateDetails } from '../../services/sandbox/sandboxTypes';
export interface RepositoryBuildOptions {
    gitObjects: Array<{
        path: string;
        data: Uint8Array;
    }>;
    templateDetails: SandboxTemplateDetails | null | undefined;
    appQuery: string;
    appCreatedAt?: Date;
}
export declare class GitCloneService {
    /**
     * Build in-memory git repository by rebasing agent's git history on template files
     *
     * Strategy:
     * 1. Create base commit with template files
     * 2. Import exported git objects from agent
     * 3. Update refs to point to agent's commits
     *
     * Result: Template base + agent's commit history on top
     */
    static buildRepository(options: RepositoryBuildOptions): Promise<MemFS>;
    /**
     * Handle git info/refs request
     * Returns advertisement of available refs for git clone
     */
    static handleInfoRefs(fs: MemFS): Promise<string>;
    /**
     * Handle git upload-pack request (actual clone operation)
     * Only includes reachable objects from HEAD for optimal pack size
     */
    static handleUploadPack(fs: MemFS): Promise<Uint8Array>;
    /**
     * Format git packet line (4-byte hex length + data)
     */
    private static formatPacketLine;
    /**
     * Wrap packfile in sideband-64k format
     */
    private static wrapInSideband;
}
