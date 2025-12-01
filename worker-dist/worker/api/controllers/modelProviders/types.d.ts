/**
 * Model Providers API Types
 * Types for custom model provider CRUD operations
 */
import type { UserModelProvider } from '../../../database/schema';
import type { ApiResponse } from '../types';
export interface ModelProvidersListData {
    providers: UserModelProvider[];
}
export interface ModelProviderData {
    provider: UserModelProvider;
}
export interface ModelProviderCreateData {
    provider: UserModelProvider;
}
export interface ModelProviderUpdateData {
    provider: UserModelProvider;
}
export interface ModelProviderDeleteData {
    success: boolean;
    providerId: string;
}
export interface ModelProviderTestData {
    success: boolean;
    error?: string;
    responseTime?: number;
}
export interface CreateProviderRequest {
    name: string;
    baseUrl: string;
    apiKey: string;
}
export interface UpdateProviderRequest {
    name?: string;
    baseUrl?: string;
    apiKey?: string;
    isActive?: boolean;
}
export interface TestProviderRequest {
    providerId?: string;
    baseUrl?: string;
    apiKey?: string;
}
export type ModelProvidersListResponse = ApiResponse<ModelProvidersListData>;
export type ModelProviderResponse = ApiResponse<ModelProviderData>;
export type ModelProviderCreateResponse = ApiResponse<ModelProviderCreateData>;
export type ModelProviderUpdateResponse = ApiResponse<ModelProviderUpdateData>;
export type ModelProviderDeleteResponse = ApiResponse<ModelProviderDeleteData>;
export type ModelProviderTestResponse = ApiResponse<ModelProviderTestData>;
