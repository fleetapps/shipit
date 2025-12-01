/**
 * App Service - Database operations for apps
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
import type { EnhancedAppData, AppWithFavoriteStatus, FavoriteToggleResult, PaginatedResult, AppQueryOptions, PublicAppQueryOptions, OwnershipResult, AppVisibilityUpdateResult, PaginationParams } from '../types';
export declare class AppService extends BaseService {
    private readonly RANKING_WEIGHTS;
    /**
     * Create a new app
     */
    createApp(appData: schema.NewApp): Promise<schema.App>;
    /**
     * Get public apps with pagination and sorting
     */
    getPublicApps(options?: PublicAppQueryOptions): Promise<PaginatedResult<EnhancedAppData>>;
    /**
     * Helper to build common app filters (framework and search)
     * Used by both user apps and public apps to avoid duplication
     */
    private buildCommonAppFilters;
    /**
     * Helper to build public app query conditions
     */
    private buildPublicAppConditions;
    /**
     * Update app record in database
     */
    updateApp(appId: string, updates: Partial<typeof schema.apps.$inferInsert>): Promise<boolean>;
    /**
     * Update app deployment ID
     */
    updateDeploymentId(appId: string, deploymentId: string): Promise<boolean>;
    /**
     * Update app with GitHub repository URL and visibility
     */
    updateGitHubRepository(appId: string, repositoryUrl: string, repositoryVisibility: 'public' | 'private'): Promise<boolean>;
    /**
     * Update app with screenshot data
     */
    updateAppScreenshot(appId: string, screenshotUrl: string): Promise<boolean>;
    /**
     * Get user apps with favorite status
     * Optimized to fetch favorites separately to avoid subquery memory issues
     */
    getUserAppsWithFavorites(userId: string, options?: PaginationParams): Promise<AppWithFavoriteStatus[]>;
    /**
     * Get recent user apps with favorite status
     */
    getRecentAppsWithFavorites(userId: string, limit?: number): Promise<AppWithFavoriteStatus[]>;
    /**
     * Get only favorited apps for a user
     */
    getFavoriteAppsOnly(userId: string): Promise<AppWithFavoriteStatus[]>;
    /**
     * Toggle favorite status for an app
     */
    toggleAppFavorite(userId: string, appId: string): Promise<FavoriteToggleResult>;
    /**
     * Check if user owns an app
     */
    checkAppOwnership(appId: string, userId: string): Promise<OwnershipResult>;
    /**
     * Get single app with favorite status for user
     * Optimized to fetch favorite status separately
     */
    getSingleAppWithFavoriteStatus(appId: string, userId: string): Promise<AppWithFavoriteStatus | null>;
    /**
     * Update app visibility with ownership check
     */
    updateAppVisibility(appId: string, userId: string, visibility: 'private' | 'public'): Promise<AppVisibilityUpdateResult>;
    /**
     * Get app details with stats
     */
    getAppDetails(appId: string, userId?: string): Promise<EnhancedAppData | null>;
    /**
     * Toggle star status for an app (star/unstar)
     * Uses same pattern as toggleAppFavorite
     */
    toggleAppStar(userId: string, appId: string): Promise<{
        isStarred: boolean;
        starCount: number;
    }>;
    /**
     * Record app view with duplicate prevention
     */
    recordAppView(appId: string, userId: string): Promise<void>;
    /**
     * Get user apps with analytics data
     */
    getUserAppsWithAnalytics(userId: string, options?: Partial<AppQueryOptions>): Promise<EnhancedAppData[]>;
    /**
     * Get total count of user apps with filters (for pagination)
     */
    getUserAppsCount(userId: string, options?: Partial<AppQueryOptions>): Promise<number>;
    /**
     * Execute ranked query with subqueries for memory efficiency
     * Uses subqueries in ORDER BY to avoid loading all rows before pagination
     */
    private executeRankedQuery;
    private getCountSubqueries;
    private addUserSpecificAppData;
    /**
     * Get date threshold for time period filtering
     */
    private getTimePeriodThreshold;
    /**
     * Delete an app with ownership verification and cascade delete related records
     */
    deleteApp(appId: string, userId: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
