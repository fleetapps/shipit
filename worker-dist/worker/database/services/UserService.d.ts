/**
 * User Service
 * Handles all user-related database operations including sessions, teams, and profiles
 */
import { BaseService } from './BaseService';
import * as schema from '../schema';
/**
 * User Service Class
 */
export declare class UserService extends BaseService {
    createUser(userData: schema.NewUser): Promise<schema.User>;
    /**
     * User lookup method
     */
    findUser(options: {
        id?: string;
        email?: string;
        provider?: {
            name: string;
            id: string;
        };
    }): Promise<schema.User | null>;
    updateUserActivity(userId: string): Promise<void>;
    createSession(sessionData: schema.NewSession): Promise<schema.Session>;
    findValidSession(sessionId: string): Promise<schema.Session | null>;
    cleanupExpiredSessions(): Promise<void>;
    /**
     * Update user profile directly
     */
    updateUserProfile(userId: string, profileData: {
        displayName?: string;
        username?: string;
        bio?: string;
        avatarUrl?: string;
        timezone?: string;
    }): Promise<void>;
    /**
     * Check if username is available
     */
    isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;
    /**
     * Update user profile with comprehensive validation
     */
    updateUserProfileWithValidation(userId: string, profileData: {
        username?: string;
        displayName?: string;
        bio?: string;
        theme?: 'light' | 'dark' | 'system';
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Get basic user statistics efficiently
     */
    getUserStatisticsBasic(userId: string): Promise<{
        totalApps: number;
        appsThisMonth: number;
    }>;
}
