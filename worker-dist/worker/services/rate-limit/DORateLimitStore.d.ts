import { DurableObject } from 'cloudflare:workers';
export interface RateLimitBucket {
    count: number;
    timestamp: number;
}
export interface RateLimitState {
    buckets: Map<string, RateLimitBucket>;
    lastCleanup: number;
}
export interface RateLimitConfig {
    limit: number;
    period: number;
    burst?: number;
    burstWindow?: number;
    bucketSize?: number;
    dailyLimit?: number;
}
export interface RateLimitResult {
    success: boolean;
    remainingLimit?: number;
}
/**
 * DORateLimitStore - Durable Object-based rate limiting store
 *
 * Provides distributed rate limiting using bucketed sliding window algorithm
 * similar to the KV implementation but with better scalability, consistency and cost-effectiveness
 */
export declare class DORateLimitStore extends DurableObject<Env> {
    private state;
    private initialized;
    constructor(ctx: DurableObjectState, env: Env);
    increment(key: string, config: RateLimitConfig, incrementBy?: number): Promise<RateLimitResult>;
    getRemainingLimit(key: string, config: RateLimitConfig): Promise<number>;
    resetLimit(key?: string): Promise<void>;
    private getBucketsInWindow;
    private cleanup;
    private ensureInitialized;
    private persistState;
}
