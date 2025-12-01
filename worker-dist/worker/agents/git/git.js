/**
 * Git version control for Durable Objects using isomorphic-git
 */
import git from '@ashishkumar472/cf-git';
import { SqliteFS } from './fs-adapter';
import * as Diff from 'diff';
export class GitVersionControl {
    onFilesChangedCallback;
    fs;
    author;
    get gitConfig() {
        return { fs: this.fs, dir: '/' };
    }
    constructor(sql, author) {
        this.fs = new SqliteFS(sql);
        this.author = author || { name: 'Vibesdk', email: 'vibesdk-bot@cloudflare.com' };
        // Initialize SQLite table synchronously
        this.fs.init();
    }
    setOnFilesChangedCallback(callback) {
        this.onFilesChangedCallback = callback;
    }
    async getAllFilesFromHead() {
        try {
            const oid = await git.resolveRef({ ...this.gitConfig, ref: 'HEAD' });
            return await this.readFilesFromCommit(oid);
        }
        catch {
            return [];
        }
    }
    async init() {
        try {
            await git.init({ ...this.gitConfig, defaultBranch: 'main' });
            console.log('[Git] Repository initialized');
        }
        catch (error) {
            console.log('[Git] Repository already initialized:', error);
        }
    }
    /**
     * Stage files without committing them
     * Useful for batching multiple operations before a single commit
     */
    async stage(files) {
        if (!files.length) {
            console.log('[Git] No files to stage');
            return;
        }
        console.log(`[Git] Staging ${files.length} files`);
        for (const file of files) {
            try {
                const path = this.normalizePath(file.filePath);
                await this.fs.writeFile(path, file.fileContents);
                await git.add({ ...this.gitConfig, filepath: path, cache: {} });
            }
            catch (error) {
                console.error(`[Git] Failed to stage file ${file}:`, error);
                throw new Error(`Failed to stage file ${file}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        console.log(`[Git] Staged ${files.length} files`, files);
    }
    normalizePath(path) {
        return path.startsWith('/') ? path.slice(1) : path;
    }
    async commit(files, message) {
        console.log(`[Git] Starting commit with ${files.length} files`);
        if (files.length) {
            // Stage all files first
            await this.stage(files);
        }
        if (!await this.hasChanges()) {
            console.log('[Git] No changes to commit');
            return null;
        }
        console.log('[Git] Creating commit...');
        const oid = await git.commit({
            ...this.gitConfig,
            message: message || `Auto-checkpoint (${new Date().toISOString()})`,
            author: {
                name: this.author.name,
                email: this.author.email,
                timestamp: Math.floor(Date.now() / 1000)
            }
        });
        console.log(`[Git] Commit created: ${oid}`);
        return oid;
    }
    async hasChanges() {
        try {
            const status = await git.statusMatrix(this.gitConfig);
            return status.some(row => row[1] !== row[2]);
        }
        catch {
            return true;
        }
    }
    async log(limit = 50) {
        try {
            const commits = await git.log({ ...this.gitConfig, depth: limit, ref: 'main' });
            return commits.map(c => ({
                oid: c.oid,
                message: c.commit.message,
                author: `${c.commit.author.name} <${c.commit.author.email}>`,
                timestamp: new Date(c.commit.author.timestamp * 1000).toISOString()
            }));
        }
        catch {
            return [];
        }
    }
    async readFilesFromCommit(oid) {
        const { commit } = await git.readCommit({ ...this.gitConfig, oid });
        const files = [];
        await this.walkTree(commit.tree, '', files);
        return files;
    }
    async show(oid, options) {
        const { commit } = await git.readCommit({ ...this.gitConfig, oid });
        if (!commit.parent || commit.parent.length === 0) {
            const files = await git.listFiles({ ...this.gitConfig, ref: oid });
            return this.formatShowResult(commit, oid, files);
        }
        const parentOid = commit.parent[0];
        const { commit: parentCommit } = await git.readCommit({ ...this.gitConfig, oid: parentOid });
        const [currentFileOids, parentFileOids] = await Promise.all([
            this.collectTreeOids(commit.tree),
            this.collectTreeOids(parentCommit.tree)
        ]);
        const changedFiles = this.findChangedFiles(currentFileOids, parentFileOids);
        const diffs = options?.includeDiff
            ? await this.generateDiffs(changedFiles, currentFileOids, parentFileOids)
            : undefined;
        return this.formatShowResult(commit, oid, changedFiles, diffs);
    }
    findChangedFiles(currentFileOids, parentFileOids) {
        const allPaths = new Set([...currentFileOids.keys(), ...parentFileOids.keys()]);
        const changedFiles = [];
        for (const path of allPaths) {
            if (currentFileOids.get(path) !== parentFileOids.get(path)) {
                changedFiles.push(path);
            }
        }
        return changedFiles;
    }
    async generateDiffs(changedFiles, currentFileOids, parentFileOids) {
        const diffs = [];
        for (const path of changedFiles) {
            const [oldContent, newContent] = await Promise.all([
                this.readBlobContent(parentFileOids.get(path)),
                this.readBlobContent(currentFileOids.get(path))
            ]);
            if (oldContent !== newContent) {
                const diff = Diff.createPatch(path, oldContent, newContent);
                if (diff) {
                    diffs.push({ path, diff });
                }
            }
        }
        return diffs;
    }
    async readBlobContent(oid) {
        if (!oid)
            return '';
        const { blob } = await git.readBlob({ ...this.gitConfig, oid });
        return new TextDecoder('utf-8').decode(blob);
    }
    formatShowResult(commit, oid, fileList, diffs) {
        return {
            oid,
            message: commit.message,
            author: `${commit.author.name} <${commit.author.email}>`,
            timestamp: new Date(commit.author.timestamp * 1000).toISOString(),
            files: fileList.length,
            fileList,
            ...(diffs && { diffs })
        };
    }
    buildPath(prefix, name) {
        return prefix ? `${prefix}/${name}` : name;
    }
    /**
     * Efficiently collect file paths and their OIDs from a tree (no blob content read)
     */
    async collectTreeOids(treeOid, prefix = '') {
        const fileOids = new Map();
        const { tree } = await git.readTree({ ...this.gitConfig, oid: treeOid });
        for (const entry of tree) {
            const path = this.buildPath(prefix, entry.path);
            if (entry.type === 'blob') {
                fileOids.set(path, entry.oid);
            }
            else if (entry.type === 'tree') {
                const subtreeOids = await this.collectTreeOids(entry.oid, path);
                for (const [subpath, oid] of subtreeOids) {
                    fileOids.set(subpath, oid);
                }
            }
        }
        return fileOids;
    }
    async reset(ref, options) {
        const oid = await git.resolveRef({ ...this.gitConfig, ref });
        await git.writeRef({ ...this.gitConfig, ref: 'HEAD', value: oid, force: true });
        if (options?.hard !== false) {
            await git.checkout({ ...this.gitConfig, ref, force: true });
        }
        const files = await git.listFiles({ ...this.gitConfig, ref });
        this.onFilesChangedCallback?.();
        return { ref, filesReset: files.length };
    }
    async walkTree(treeOid, prefix, files) {
        const { tree } = await git.readTree({ ...this.gitConfig, oid: treeOid });
        for (const entry of tree) {
            const path = this.buildPath(prefix, entry.path);
            if (entry.type === 'blob') {
                const textContent = await this.tryReadTextBlob(entry.oid);
                if (textContent) {
                    files.push({ filePath: path, fileContents: textContent });
                }
            }
            else if (entry.type === 'tree') {
                await this.walkTree(entry.oid, path, files);
            }
        }
    }
    async tryReadTextBlob(oid) {
        try {
            const { blob } = await git.readBlob({ ...this.gitConfig, oid });
            const content = new TextDecoder('utf-8').decode(blob);
            return content.includes('\0') ? null : content;
        }
        catch {
            return null;
        }
    }
    async getHead() {
        try {
            let timeoutId = null;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('git.resolveRef timed out after 5 seconds'));
                }, 5000);
            });
            const resolvePromise = git.resolveRef({ ...this.gitConfig, ref: 'HEAD' });
            try {
                const result = await Promise.race([resolvePromise, timeoutPromise]);
                return result;
            }
            finally {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
            }
        }
        catch {
            return null;
        }
    }
    /**
     * Get storage statistics for monitoring and observability
     */
    getStorageStats() {
        return this.fs.getStorageStats();
    }
}
