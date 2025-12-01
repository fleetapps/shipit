/**
 * GitHub service for repository creation and export
 */
import { Octokit } from '@octokit/rest';
import { GitHubRepository, CreateRepositoryOptions, CreateRepositoryResult } from './types';
import { GitHubPushResponse, TemplateDetails } from '../sandbox/sandboxTypes';
export declare class GitHubService {
    private static readonly logger;
    static createOctokit(token: string): Octokit;
    /**
     * Create a new GitHub repository
     */
    static createUserRepository(options: CreateRepositoryOptions): Promise<CreateRepositoryResult>;
    /**
     * Get repository information from GitHub
     */
    static getRepository(options: {
        owner: string;
        repo: string;
        token: string;
    }): Promise<{
        success: boolean;
        repository?: GitHubRepository;
        error?: string;
    }>;
    /**
     * Check if repository exists on GitHub
     */
    static repositoryExists(options: {
        repositoryUrl: string;
        token: string;
    }): Promise<boolean>;
    /**
     * Parse owner and repo name from GitHub URL
     */
    static extractRepoInfo(url: string): {
        owner: string;
        repo: string;
    } | null;
    /**
     * Export git repository to GitHub using native git push protocol
     * Falls back to REST API if push fails
     */
    static exportToGitHub(options: {
        gitObjects: Array<{
            path: string;
            data: Uint8Array;
        }>;
        templateDetails: TemplateDetails | null;
        appQuery: string;
        appCreatedAt?: Date;
        token: string;
        repositoryUrl: string;
        username: string;
        email: string;
        useGitPush?: boolean;
    }): Promise<GitHubPushResponse>;
    /**
     * Replace [cloudflarebutton] placeholder with deploy button
     */
    private static modifyReadmeForGitHub;
    /**
     * Normalize commit message for comparison
     */
    private static normalizeCommitMessage;
    /**
     * Check if commit is system-generated
     */
    private static isSystemGeneratedCommit;
    /**
     * Find last common commit between local and remote
     * Returns index in reversed (oldest-first) local commits and GitHub SHA
     */
    private static findLastCommonCommit;
    /**
     * Push to GitHub using native git push protocol
     * Much simpler and faster than REST API approach
     * Automatically handles incremental sync and packfile optimization
     */
    private static pushViaGitProtocol;
    /**
     * Check remote repository status vs local commits
     * Builds local repo with template to match export structure
     */
    static checkRemoteStatus(options: {
        gitObjects: Array<{
            path: string;
            data: Uint8Array;
        }>;
        templateDetails: TemplateDetails | null;
        appQuery: string;
        appCreatedAt?: Date;
        repositoryUrl: string;
        token: string;
    }): Promise<{
        compatible: boolean;
        behindBy: number;
        aheadBy: number;
        divergedCommits: Array<{
            sha: string;
            message: string;
            author: string;
            date: string;
        }>;
    }>;
}
