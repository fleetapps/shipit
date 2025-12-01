/**
 * ID Generation Utility
 * Simple wrapper around crypto.randomUUID() for consistent ID generation
 */
import { nanoid } from "nanoid";
export function generateId() {
    return crypto.randomUUID();
}
export function generateNanoId() {
    return nanoid();
}
