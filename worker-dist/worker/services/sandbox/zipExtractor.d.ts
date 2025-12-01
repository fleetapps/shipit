import type { TemplateFile } from './sandboxTypes';
/**
 * In-memory zip extraction service for Cloudflare Workers
 * Extracts and encodes file contents as UTF-8 strings or base64 for binary data
 */
export declare class ZipExtractor {
    private static readonly MAX_UNCOMPRESSED_SIZE;
    private static readonly BINARY_EXTENSIONS;
    private static readonly utf8Decoder;
    /**
     * Extracts all files from a zip archive
     *
     * Text files are decoded as UTF-8. Binary files that cannot be decoded as UTF-8
     * are encoded as base64 with a "base64:" prefix.
     *
     * @param zipBuffer - ArrayBuffer containing the zip file
     * @returns Array of extracted files with paths and encoded contents
     * @throws Error if zip is invalid or exceeds size limits
     */
    static extractFiles(zipBuffer: ArrayBuffer): TemplateFile[];
    /**
     * Decodes file contents to bytes
     *
     * Handles both base64-encoded binary data and UTF-8 text
     *
     * @param fileContents - File content string (may be base64-prefixed)
     * @returns Byte array representation of the file
     */
    static decodeFileContents(fileContents: string): Uint8Array;
    /**
     * Checks if file contents are base64-encoded
     *
     * @param fileContents - File content string
     * @returns True if content is base64-encoded, false otherwise
     */
    static isBinaryContent(fileContents: string): boolean;
    /**
     * check if file extension is known binary type
     */
    private static isBinaryExtension;
    /**
     * base64 encoding
     */
    private static base64Encode;
}
