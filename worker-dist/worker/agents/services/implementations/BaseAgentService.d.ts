import { IStateManager } from '../interfaces/IStateManager';
import { IFileManager } from '../interfaces/IFileManager';
import { StructuredLogger } from '../../../logger';
import { ServiceOptions } from '../interfaces/IServiceOptions';
/**
 * Base class for all agent services
 * Provides common dependencies and DO-compatible access patterns
 */
export declare abstract class BaseAgentService {
    protected readonly stateManager: IStateManager;
    protected readonly fileManager: IFileManager;
    protected readonly getLogger: () => StructuredLogger;
    protected readonly env: Env;
    constructor(options: ServiceOptions);
    /**
     * Get current agent state
     */
    protected getState(): Readonly<import("../../core/state").CodeGenState>;
    /**
     * Update agent state
     */
    protected setState(newState: ReturnType<IStateManager['getState']>): void;
    getAgentId(): string;
    /**
     * Get fresh logger instance (DO-compatible)
     */
    protected getLog(): StructuredLogger;
    /**
     * Execute an operation with a timeout
     */
    protected withTimeout<T>(operation: Promise<T>, timeoutMs: number, errorMsg: string, onTimeout?: () => void): Promise<T>;
}
