/**
 * Authentication Middleware
 * Handles JWT validation and session management
 */
import { AuthUserSession } from '../../types/auth-types';
/**
 * Validate JWT token and return user
 */
export declare function validateToken(token: string, env: Env): Promise<AuthUserSession | null>;
/**
 * Authentication middleware
 */
export declare function authMiddleware(request: Request, env: Env): Promise<AuthUserSession | null>;
