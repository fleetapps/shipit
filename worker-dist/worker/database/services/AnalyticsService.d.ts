/**
 * Analytics and Count Queries Service
 */
import { BaseService } from './BaseService';
import type { UserStats, UserActivity, BatchAppStats } from '../types';
export declare class AnalyticsService extends BaseService {
    /**
     * Batch get statistics for multiple entities
     * More efficient when loading lists of items
     */
    batchGetAppStats(appIds: string[]): Promise<BatchAppStats>;
    /**
     * Get user statistics with all metrics
     */
    getUserStats(userId: string): Promise<UserStats>;
    /**
     * Calculate consecutive days of user activity
     * Based on app creation and update dates
     */
    private calculateUserStreak;
    /**
     * Get user activity timeline
     * Returns recent activities for user dashboard
     */
    getUserActivityTimeline(userId: string, limit?: number): Promise<UserActivity[]>;
}
