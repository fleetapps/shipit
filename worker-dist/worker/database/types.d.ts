/**
 * Centralized Database Types
 */
import * as schema from './schema';
import type { ModelConfig } from '../agents/inferutils/config.types';
export type Visibility = 'private' | 'public';
/**
 * Standard pagination interface used across all services
 */
export interface PaginationInfo {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
}
/**
 * Enhanced app data with user and social statistics
 */
export interface EnhancedAppData extends schema.App {
    userName: string | null;
    userAvatar: string | null;
    starCount: number;
    userStarred: boolean;
    userFavorited: boolean;
    viewCount?: number;
    forkCount?: number;
    likeCount?: number;
}
/**
 * App with favorite status for user-specific queries
 */
export interface AppWithFavoriteStatus extends schema.App {
    isFavorite: boolean;
    updatedAtFormatted: string;
}
/**
 * Favorite toggle operation result
 */
export interface FavoriteToggleResult {
    isFavorite: boolean;
}
/**
 * Generic paginated result wrapper
 */
export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationInfo;
}
/**
 * Pagination input parameters (for requests)
 */
export type PaginationParams = Partial<Pick<PaginationInfo, 'limit' | 'offset'>>;
/**
 * Time period for analytics and trending
 */
export type TimePeriod = 'today' | 'week' | 'month' | 'all';
/**
 * Sort options for app listings
 */
export type AppSortOption = 'recent' | 'popular' | 'trending' | 'starred';
/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';
/**
 * Base app query options with common filters and pagination
 */
export interface BaseAppQueryOptions extends PaginationParams {
    framework?: string;
    search?: string;
    sort?: AppSortOption;
    order?: SortOrder;
    period?: TimePeriod;
}
/**
 * User app query options with user-specific filters
 */
export interface AppQueryOptions extends BaseAppQueryOptions {
    status?: 'generating' | 'completed';
    visibility?: Visibility;
}
/**
 * Public app query options with user context for favorites/interactions
 */
export interface PublicAppQueryOptions extends BaseAppQueryOptions {
    userId?: string;
}
/**
 * App ownership verification result
 */
export interface OwnershipResult {
    exists: boolean;
    isOwner: boolean;
}
/**
 * App visibility update operation result
 */
export interface AppVisibilityUpdateResult {
    success: boolean;
    error?: string;
    app?: Pick<schema.App, 'id' | 'title' | 'visibility' | 'updatedAt'>;
}
/**
 * Simple app creation data
 */
export interface SimpleAppCreation {
    userId: string;
    title: string;
    description?: string;
    framework?: string;
    visibility?: Visibility;
}
/**
 * App for forking - includes permission check result
 */
export interface AppForForkResult {
    app: schema.App | null;
    canFork: boolean;
}
/**
 * User statistics with all metrics
 */
export interface UserStats {
    appCount: number;
    publicAppCount: number;
    favoriteCount: number;
    totalLikesReceived: number;
    totalViewsReceived: number;
    streakDays: number;
    achievements: string[];
}
/**
 * User activity timeline entry
 */
export interface UserActivity {
    type: 'created' | 'updated' | 'favorited';
    title: string;
    timestamp: Date | null;
    metadata: Record<string, unknown>;
}
/**
 * Batch app statistics for multiple apps
 */
export interface BatchAppStats {
    [appId: string]: AppStats;
}
/**
 * Team statistics
 */
export interface TeamStats {
    memberCount: number;
    appCount: number;
}
/**
 * Board statistics
 */
export interface BoardStats {
    memberCount: number;
    appCount: number;
}
/**
 * Individual app statistics
 */
export interface AppStats {
    viewCount: number;
    forkCount: number;
    likeCount: number;
}
/**
 * Raw Secret data for storage (before encryption)
 */
export interface SecretData extends Omit<schema.UserSecret, 'encryptedValue' | 'id' | 'isActive' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'userId' | 'usageCount' | 'keyPreview'> {
    value: string;
}
/**
 * Encrypted secret response (without sensitive data)
 */
export type EncryptedSecret = Omit<schema.UserSecret, 'encryptedValue'>;
/**
 * Model configuration with user override metadata
 */
export interface UserModelConfigWithMetadata extends ModelConfig {
    isUserOverride: boolean;
    userConfigId?: string;
}
/**
 * Model test result
 */
export interface TestResult {
    success: boolean;
    error?: string;
    model?: string;
    latencyMs?: number;
}
/**
 * Model test request parameters
 */
export interface ModelTestRequest {
    modelConfig: ModelConfig;
    userApiKeys?: Record<string, string>;
    testPrompt?: string;
}
/**
 * Complete model test result with metadata
 */
export interface ModelTestResult {
    success: boolean;
    error?: string;
    responsePreview?: string;
    latencyMs: number;
    modelUsed: string;
    timestamp?: Date;
}
/**
 * Structured error for database operations
 */
export interface DatabaseError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
/**
 * Operation result wrapper with error handling
 */
export interface OperationResult<T> {
    success: boolean;
    data?: T;
    error?: DatabaseError;
}
/**
 * Error object with optional nested error
 */
export interface ErrorWithMessage {
    message?: string;
    error?: {
        message?: string;
    };
}
/**
 * Type guard to check if error is an object with message
 */
export declare function isErrorWithMessage(error: unknown): error is ErrorWithMessage;
/**
 * Health check result
 */
export interface HealthStatusResult {
    healthy: boolean;
    timestamp: string;
    details?: Record<string, unknown>;
}
