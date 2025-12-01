/**
 * Model Test Service
 * Handles testing of model configurations with user API keys
 */
import { BaseService } from './BaseService';
import type { TestResult, ModelTestRequest, ModelTestResult } from '../types';
export declare class ModelTestService extends BaseService {
    /**
     * Test a model configuration by making a simple chat request using core inference
     */
    testModelConfig({ modelConfig, userApiKeys, testPrompt }: ModelTestRequest): Promise<ModelTestResult>;
    /**
     * Test a specific provider's API key using core inference
     */
    testProviderKey(provider: string, apiKey: string): Promise<TestResult>;
    /**
     * Get a simple test model for a given provider
     */
    private getTestModelForProvider;
}
