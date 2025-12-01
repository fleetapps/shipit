export class KVCache {
    kv;
    constructor(kv) {
        this.kv = kv;
    }
    generateKey(prefix, key) {
        return `cache-${prefix}:${key}`;
    }
    async get(prefix, key) {
        const fullKey = this.generateKey(prefix, key);
        const value = await this.kv.get(fullKey, 'json');
        return value;
    }
    async set(prefix, key, value, ttl) {
        const fullKey = this.generateKey(prefix, key);
        const options = {};
        if (ttl) {
            options.expirationTtl = ttl;
        }
        await this.kv.put(fullKey, JSON.stringify(value), options);
    }
    async delete(prefix, key) {
        const fullKey = this.generateKey(prefix, key);
        await this.kv.delete(fullKey);
    }
    async deleteByPrefix(prefix) {
        let cursor = undefined;
        do {
            const list = await this.kv.list({ prefix: `cache-${prefix}:`, cursor });
            await Promise.all(list.keys.map((key) => this.kv.delete(key.name)));
            cursor = list.list_complete ? undefined : list.cursor;
        } while (cursor);
    }
    async invalidate(patterns) {
        await Promise.all(patterns.map(pattern => this.deleteByPrefix(pattern)));
    }
}
export function createKVCache(env) {
    const kv = env.VibecoderStore;
    return new KVCache(kv);
}
