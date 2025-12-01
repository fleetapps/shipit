/**
 * BYOK (Bring Your Own Key) Helper Functions
 * Handles provider discovery and model filtering for users with custom API keys
 * Completely dynamic - no hardcoded provider lists
 */
import { AIModels } from '../../../agents/inferutils/config.types';
import type { UserProviderStatus, ModelsByProvider } from './types';
/**
 * Get user's provider status for BYOK functionality
 */
export declare function getUserProviderStatus(userId: string, env: Env): Promise<UserProviderStatus[]>;
/**
 * Get models available for BYOK providers that user has keys for
 */
export declare function getByokModels(providerStatuses: UserProviderStatus[]): ModelsByProvider;
/**
 * Get providers that have platform API keys configured in environment
 */
export declare function getPlatformEnabledProviders(env: Env): string[];
/**
 * Get models available on platform based on environment configuration
 */
export declare function getPlatformAvailableModels(env: Env): AIModels[];
/**
 * Validate if a model can be accessed based on environment config and user BYOK status
 */
export declare function validateModelAccessForEnvironment(model: AIModels | string, env: Env, userProviderStatus: UserProviderStatus[]): boolean;
/**
 * Get provider name from model string
 */
export declare function getProviderFromModel(model: AIModels | string): string;
