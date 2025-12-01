import { RateLimitType, RateLimitSettings } from './config';
import { AuthUser } from '../../types/auth-types';
import { AIModels } from '../../agents/inferutils/config.types';
export declare class RateLimitService {
    static logger: import("../../logger").StructuredLogger;
    static buildRateLimitKey(rateLimitType: RateLimitType, identifier: string): string;
    static getUserIdentifier(user: AuthUser): Promise<string>;
    static getRequestIdentifier(request: Request): Promise<string>;
    static getUniversalIdentifier(user: AuthUser | null, request: Request): Promise<string>;
    /**
     * Durable Object-based rate limiting using bucketed sliding window algorithm
     * Provides better consistency and performance compared to KV
     */
    private static enforceDORateLimit;
    static enforce(env: Env, key: string, config: RateLimitSettings, limitType: RateLimitType, incrementBy?: number): Promise<boolean>;
    static enforceGlobalApiRateLimit(env: Env, config: RateLimitSettings, user: AuthUser | null, request: Request): Promise<void>;
    static enforceAuthRateLimit(env: Env, config: RateLimitSettings, user: AuthUser | null, request: Request): Promise<void>;
    static enforceAppCreationRateLimit(env: Env, config: RateLimitSettings, user: AuthUser, request: Request): Promise<void>;
    static enforceLLMCallsRateLimit(env: Env, config: RateLimitSettings, userId: string, model: AIModels | string, suffix?: string): Promise<void>;
}
