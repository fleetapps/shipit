/**
 * Supported image MIME types for upload
 * Limited to most common web formats for reliability
 */
export const SUPPORTED_IMAGE_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
];
/**
 * Utility to check if a MIME type is supported
 */
export function isSupportedImageType(mimeType) {
    return SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType);
}
/**
 * Utility to get file extension from MIME type
 */
export function getFileExtensionFromMimeType(mimeType) {
    const map = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/webp': 'webp',
    };
    return map[mimeType] || 'jpg';
}
/**
 * Maximum file size for images (10MB)
 */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
/**
 * Maximum number of images per message
 */
export const MAX_IMAGES_PER_MESSAGE = 2;
