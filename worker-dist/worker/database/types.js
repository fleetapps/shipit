/**
 * Centralized Database Types
 */
/**
 * Type guard to check if error is an object with message
 */
export function isErrorWithMessage(error) {
    return (typeof error === 'object' &&
        error !== null &&
        ('message' in error || ('error' in error && typeof error.error === 'object')));
}
