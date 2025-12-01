/**
 * Model Configuration Service
 * Handles CRUD operations for user model configurations
 */
import { BaseService } from './BaseService';
import { UserModelConfig } from '../schema';
import { AgentActionKey, ModelConfig } from '../../agents/inferutils/config.types';
import type { UserModelConfigWithMetadata } from '../types';
export declare class ModelConfigService extends BaseService {
    /**
     * Safely cast database string to ReasoningEffort type
     */
    private castToReasoningEffort;
    /**
     * Get all model configurations for a user (merged with defaults)
     */
    getUserModelConfigs(userId: string): Promise<Record<AgentActionKey, UserModelConfigWithMetadata>>;
    /**
     * Get a specific model configuration for a user (merged with defaults for UI display)
     */
    getUserModelConfig(userId: string, agentActionName: AgentActionKey): Promise<UserModelConfigWithMetadata>;
    /**
     * Get raw user model configuration without merging with defaults
     * Returns null if user has no custom config (for executeInference usage)
     */
    getRawUserModelConfig(userId: string, agentActionName: AgentActionKey): Promise<ModelConfig | null>;
    /**
     * Update or create a user model configuration
     */
    upsertUserModelConfig(userId: string, agentActionName: AgentActionKey, config: Partial<ModelConfig>): Promise<UserModelConfig>;
    /**
     * Delete/reset a user model configuration (revert to default)
     */
    deleteUserModelConfig(userId: string, agentActionName: AgentActionKey): Promise<boolean>;
    /**
     * Get default configurations (from AGENT_CONFIG)
     */
    getDefaultConfigs(): Record<AgentActionKey, ModelConfig>;
    /**
     * Reset all user configurations to defaults
     */
    resetAllUserConfigs(userId: string): Promise<number>;
}
