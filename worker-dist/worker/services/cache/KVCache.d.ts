export interface KVCacheOptions {
    ttl?: number;
    prefix?: string;
}
export declare class KVCache {
    private kv;
    constructor(kv: KVNamespace);
    private generateKey;
    get<T>(prefix: string, key: string): Promise<T | null>;
    set<T>(prefix: string, key: string, value: T, ttl?: number): Promise<void>;
    delete(prefix: string, key: string): Promise<void>;
    deleteByPrefix(prefix: string): Promise<void>;
    invalidate(patterns: string[]): Promise<void>;
}
export declare function createKVCache(env: Env): KVCache;
