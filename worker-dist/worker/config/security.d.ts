/**
 * Centralized Security Configuration
 * Provides comprehensive security settings for Hono middleware
 */
import { RateLimitSettings } from "../services/rate-limit/config";
import { Context } from "hono";
export interface CORSConfig {
    origin: string | string[] | ((origin: string, c: Context) => string | undefined | null);
    allowMethods?: string[];
    allowHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
    exposeHeaders?: string[];
}
export interface CSRFConfig {
    origin: string | string[] | ((origin: string, c: Context) => boolean);
    tokenTTL: number;
    rotateOnAuth: boolean;
    cookieName: string;
    headerName: string;
}
export interface ConfigurableSecuritySettings {
    rateLimit: RateLimitSettings;
}
export declare function getConfigurableSecurityDefaults(): ConfigurableSecuritySettings;
/**
 * Get allowed origins based on environment
 */
export declare function getAllowedOrigins(env: Env): string[];
export declare function isOriginAllowed(env: Env, origin: string): boolean;
/**
 * CORS Configuration
 * Strict origin validation with environment-aware settings
 */
export declare function getCORSConfig(env: Env): CORSConfig;
/**
 * CSRF Protection Configuration
 * Double-submit cookie pattern with origin validation
 */
export declare function getCSRFConfig(env: Env): CSRFConfig;
interface ContentSecurityPolicyConfig {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    fontSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    frameSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    workerSrc?: string[];
    formAction?: string[];
    frameAncestors?: string[];
    baseUri?: string[];
    manifestSrc?: string[];
    upgradeInsecureRequests?: string[];
}
interface SecureHeadersConfig {
    contentSecurityPolicy?: ContentSecurityPolicyConfig;
    strictTransportSecurity?: string;
    xFrameOptions?: string | false;
    xContentTypeOptions?: string;
    xXssProtection?: string | false;
    referrerPolicy?: string;
    crossOriginEmbedderPolicy?: string | false;
    crossOriginResourcePolicy?: string | false;
    crossOriginOpenerPolicy?: string | false;
    originAgentCluster?: string;
    xDnsPrefetchControl?: string;
    xDownloadOptions?: string;
    xPermittedCrossDomainPolicies?: string;
    permissionsPolicy?: Record<string, string[]>;
}
/**
 * Secure Headers Configuration
 * Comprehensive security headers with CSP
 */
export declare function getSecureHeadersConfig(env: Env): SecureHeadersConfig;
export {};
