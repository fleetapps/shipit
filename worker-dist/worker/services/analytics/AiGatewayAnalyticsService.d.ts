/**
 * AI Gateway Analytics Service
 * Provides analytics data from Cloudflare AI Gateway GraphQL API
 */
import { AnalyticsData, UserAnalyticsData, ChatAnalyticsData } from './types';
export declare class AiGatewayAnalyticsService {
    private config;
    private logger;
    constructor(env: Env);
    /**
     * Initialize configuration from environment variables
     */
    private initializeConfig;
    /**
     * Parse AI Gateway URL to extract account ID and gateway name
     */
    private parseGatewayUrl;
    /**
     * Generate time range for analytics queries
     * If no days specified, returns maximum allowed range (30 days due to API limits)
     */
    private getTimeRange;
    /**
     * Execute GraphQL query against Cloudflare Analytics API
     */
    private executeQuery;
    /**
     * Build GraphQL query for specific filter type
     */
    private buildQuery;
    /**
     * Process raw analytics response into structured data
     */
    private processAnalyticsResponse;
    /**
     * Get analytics data for a specific user
     * @param userId - User ID to filter by
     * @param days - Number of days to query (optional, defaults to 30 days due to API limits)
     */
    getUserAnalytics(userId: string, days?: number): Promise<UserAnalyticsData>;
    /**
     * Get analytics data for a specific chat/agent
     * @param chatId - Chat/Agent ID to filter by
     * @param days - Number of days to query (optional, defaults to 30 days due to API limits)
     */
    getChatAnalytics(chatId: string, days?: number): Promise<ChatAnalyticsData>;
    /**
     * Get total gateway analytics (for debugging/admin purposes)
     * @param days - Number of days to query (optional, defaults to 30 days due to API limits)
     */
    getTotalAnalytics(days?: number): Promise<AnalyticsData>;
}
