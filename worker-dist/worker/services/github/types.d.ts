/**
 * GitHub service types and utilities
 * Extends Octokit types where possible to avoid duplication
 */
import { RestEndpointMethodTypes } from '@octokit/rest';
export type GitHubRepository = RestEndpointMethodTypes['repos']['get']['response']['data'];
export type GitHubUser = RestEndpointMethodTypes['users']['getByUsername']['response']['data'];
export type GitHubInstallation = RestEndpointMethodTypes['apps']['getInstallation']['response']['data'];
export type GitHubAppToken = RestEndpointMethodTypes['apps']['createInstallationAccessToken']['response']['data'];
export interface GitHubUserAccessToken {
    access_token: string;
    token_type: string;
    scope: string;
    refresh_token?: string;
    expires_in?: number;
}
export interface CreateRepositoryOptions {
    name: string;
    description?: string;
    private: boolean;
    auto_init?: boolean;
    token: string;
}
export interface CreateRepositoryResult {
    success: boolean;
    repository?: GitHubRepository;
    error?: string;
    alreadyExists?: boolean;
    repositoryName?: string;
}
export interface GitHubTokenResult {
    success: boolean;
    token?: string;
    expires_at?: string;
    error?: string;
}
export interface GitHubExportOptions {
    repositoryName: string;
    description?: string;
    isPrivate: boolean;
    installationId?: number;
}
export interface GitHubExportResult {
    success: boolean;
    repositoryUrl?: string;
    cloneUrl?: string;
    token?: string;
    error?: string;
}
export type GitHubTokenType = 'installation' | 'user_access' | 'oauth';
export interface GitHubServiceConfig {
    clientId?: string;
    clientSecret?: string;
}
export declare class GitHubServiceError extends Error {
    readonly code: string;
    readonly statusCode?: number | undefined;
    readonly originalError?: unknown | undefined;
    constructor(message: string, code: string, statusCode?: number | undefined, originalError?: unknown | undefined);
}
