// Crypto utilities for Cloudflare Workers
/**
 * Secure base64url encoding for Cloudflare Workers
 * Prevents stack overflow and encoding corruption with large buffers
 */
export function base64url(buffer) {
    // Handle empty buffer
    if (buffer.length === 0) {
        return '';
    }
    // For large buffers, process in chunks to prevent stack overflow
    const CHUNK_SIZE = 8192; // 8KB chunks - safe for all JS engines
    let result = '';
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + CHUNK_SIZE);
        const chars = Array.from(chunk, byte => String.fromCharCode(byte));
        result += btoa(chars.join(''));
    }
    // Convert to base64url format (URL-safe)
    return result
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
export async function sha256Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return base64url(new Uint8Array(hashBuffer));
}
export async function timingSafeEqual(a, b) {
    const encoder = new TextEncoder();
    const aBuffer = encoder.encode(a);
    const bBuffer = encoder.encode(b);
    if (aBuffer.length !== bBuffer.length) {
        return false;
    }
    return crypto.subtle.timingSafeEqual(aBuffer, bBuffer);
}
export function timingSafeEqualBytes(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    return crypto.subtle.timingSafeEqual(a, b);
}
export function generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function generateApiKey() {
    const keyBytes = new Uint8Array(32);
    crypto.getRandomValues(keyBytes);
    const key = base64url(keyBytes);
    const keyHash = await sha256Hash(key);
    const keyPreview = `${key.slice(0, 8)}...${key.slice(-4)}`;
    return { key, keyHash, keyPreview };
}
export async function verifyApiKey(providedKey, storedHash) {
    try {
        const providedKeyHash = await sha256Hash(providedKey);
        return await timingSafeEqual(providedKeyHash, storedHash);
    }
    catch {
        return false;
    }
}
export async function pbkdf2(password, salt, iterations = 100000, keyLength = 32) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits({
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256'
    }, passwordKey, keyLength * 8);
    return new Uint8Array(derivedBits);
}
