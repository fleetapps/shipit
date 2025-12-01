/**
 * Session Service for managing user sessions in D1
 * Provides session creation, validation, and cleanup
 */
import { AuthSession } from '../../types/auth-types';
import { BaseService } from './BaseService';
/**
 * Session configuration
 */
interface SessionConfig {
    maxSessions: number;
    sessionTTL: number;
    cleanupInterval: number;
    maxConcurrentDevices: number;
}
/**
 * Session Service for D1-based session management
 */
export declare class SessionService extends BaseService {
    static readonly config: SessionConfig;
    private jwtUtils;
    constructor(env: Env);
    /**
     * Log security event for audit purposes
     */
    private logSecurityEvent;
    /**
     * Create a new session
     */
    createSession(userId: string, request: Request): Promise<{
        session: AuthSession;
        accessToken: string;
    }>;
    /**
     * Revoke session with ID and userID
     */
    revokeUserSession(sessionId: string, userId: string): Promise<void>;
    /**
     * Revoke all sessions for a user
     */
    revokeAllUserSessions(userId: string): Promise<void>;
    /**
     * Get all active sessions for a user
     */
    getUserSessions(userId: string): Promise<Array<{
        id: string;
        userAgent: string | null;
        ipAddress: string | null;
        lastActivity: Date;
        createdAt: Date;
        isCurrent?: boolean;
    }>>;
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Clean up old sessions for a user (keep only most recent)
     */
    private cleanupUserSessions;
    /**
     * Get user email (helper method)
     */
    private getUserEmail;
    /**
     * Get security status and recent events for a user
     */
    getUserSecurityStatus(userId: string): Promise<{
        activeSessions: number;
        recentSecurityEvents: number;
        lastSecurityEvent?: Date;
        riskLevel: 'low' | 'medium' | 'high';
        recommendations: string[];
    }>;
    /**
     * Revoke session by ID
     */
    revokeSessionId(sessionId: string): Promise<void>;
    /**
     * Force logout all sessions except current (for security)
     */
    forceLogoutAllOtherSessions(userId: string, currentSessionId: string): Promise<number>;
}
export {};
