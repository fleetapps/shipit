import { KVRateLimitConfig } from './config';
import type { RateLimitResult } from './DORateLimitStore';
export declare class KVRateLimitStore {
    static logger: import("../../logger").StructuredLogger;
    static increment(kv: KVNamespace, key: string, config: KVRateLimitConfig, incrementBy?: number): Promise<RateLimitResult>;
    static getRemainingLimit(kv: KVNamespace, key: string, config: KVRateLimitConfig): Promise<number>;
    private static generateBucketKeys;
    private static incrementBucketWithRetry;
}
