import * as Diff from 'diff';
import { FileProcessing } from '../../domain/pure/FileProcessing';
/**
 * Manages file operations for code generation
 * Handles both template and generated files
 */
export class FileManager {
    stateManager;
    getTemplateDetailsFunc;
    git;
    constructor(stateManager, getTemplateDetailsFunc, git) {
        this.stateManager = stateManager;
        this.getTemplateDetailsFunc = getTemplateDetailsFunc;
        this.git = git;
        // Register callback with git to auto-sync after operations
        this.git.setOnFilesChangedCallback(() => {
            this.syncGeneratedFilesMapFromGit();
        });
    }
    /**
     * Sync generatedFilesMap from git HEAD
     * TODO: Remove in the future by making git fs the single source of truth
     */
    async syncGeneratedFilesMapFromGit() {
        console.log('[FileManager] Auto-syncing generatedFilesMap from git HEAD');
        try {
            // Get all files from HEAD commit
            const gitFiles = await this.git.getAllFilesFromHead();
            // Get old map to preserve purposes
            const oldMap = this.stateManager.getState().generatedFilesMap;
            // Build new map, preserving existing purposes
            const newMap = {};
            for (const file of gitFiles) {
                const existing = oldMap[file.filePath];
                newMap[file.filePath] = {
                    filePath: file.filePath,
                    fileContents: file.fileContents,
                    filePurpose: existing?.filePurpose || 'Generated file',
                    lastDiff: ''
                };
            }
            // Update state
            this.stateManager.setState({
                ...this.stateManager.getState(),
                generatedFilesMap: newMap
            });
            console.log('[FileManager] Sync complete', {
                filesCount: Object.keys(newMap).length,
                preservedPurposes: Object.values(newMap).filter(f => oldMap[f.filePath]?.filePurpose).length
            });
        }
        catch (error) {
            console.error('[FileManager] Failed to sync from git:', error);
            // Don't throw - keep existing state as fallback
        }
    }
    getGeneratedFile(path) {
        const state = this.stateManager.getState();
        return state.generatedFilesMap[path] || null;
    }
    /**
     * Get all files combining template and generated files
     * Template files are overridden by generated files with same path
     * @returns Array of all files. Only returns important template files, not all!
     */
    getAllRelevantFiles() {
        const state = this.stateManager.getState();
        return FileProcessing.getAllRelevantFiles(this.getTemplateDetailsFunc(), state.generatedFilesMap);
    }
    getAllFiles() {
        const state = this.stateManager.getState();
        return FileProcessing.getAllFiles(this.getTemplateDetailsFunc(), state.generatedFilesMap);
    }
    async saveGeneratedFile(file, commitMessage) {
        const results = await this.saveGeneratedFiles([file], commitMessage);
        return results[0];
    }
    async saveGeneratedFiles(files, commitMessage) {
        const filesMap = { ...this.stateManager.getState().generatedFilesMap };
        const fileStates = [];
        for (const file of files) {
            let lastDiff = '';
            const oldFile = filesMap[file.filePath];
            // Get comparison base: from generatedFilesMap, template/filesystem, or empty string for new files
            const oldFileContents = oldFile?.fileContents ?? (this.getFile(file.filePath)?.fileContents || '');
            // Generate diff if contents changed
            if (oldFileContents !== file.fileContents) {
                try {
                    lastDiff = Diff.createPatch(file.filePath, oldFileContents, file.fileContents);
                }
                catch (error) {
                    console.error(`Failed to generate diff for file ${file.filePath}:`, error);
                }
            }
            const fileState = {
                ...file,
                lasthash: '',
                lastmodified: Date.now(),
                unmerged: [],
                lastDiff
            };
            filesMap[file.filePath] = fileState;
            fileStates.push(fileState);
        }
        this.stateManager.setState({
            ...this.stateManager.getState(),
            generatedFilesMap: filesMap
        });
        try {
            const shouldCommit = fileStates.length > 0 && fileStates.some(fileState => fileState.lastDiff !== '');
            if (shouldCommit) {
                // If commit message is available, commit, else stage
                if (commitMessage) {
                    console.log(`[FileManager] Committing ${fileStates.length} files:`, commitMessage);
                    await this.git.commit(fileStates, commitMessage);
                    console.log(`[FileManager] Commit successful`);
                }
                else {
                    console.log(`[FileManager] Staging ${fileStates.length} files`);
                    await this.git.stage(fileStates);
                    console.log(`[FileManager] Stage successful`);
                }
            }
        }
        catch (error) {
            console.error(`[FileManager] Failed to commit files:`, error, commitMessage);
        }
        return fileStates;
    }
    deleteFiles(filePaths) {
        const newFilesMap = { ...this.stateManager.getState().generatedFilesMap };
        for (const filePath of filePaths) {
            delete newFilesMap[filePath];
        }
        this.stateManager.setState({
            ...this.stateManager.getState(),
            generatedFilesMap: newFilesMap
        });
    }
    fileExists(path) {
        return !!this.getGeneratedFile(path);
    }
    getGeneratedFilePaths() {
        const state = this.stateManager.getState();
        return Object.keys(state.generatedFilesMap);
    }
    getGeneratedFilesMap() {
        const state = this.stateManager.getState();
        return state.generatedFilesMap;
    }
    getGeneratedFiles() {
        const state = this.stateManager.getState();
        return Object.values(state.generatedFilesMap);
    }
    getTemplateFile(filePath) {
        try {
            const templateDetails = this.getTemplateDetailsFunc();
            const fileContents = templateDetails.allFiles[filePath];
            if (!fileContents) {
                return null;
            }
            return {
                filePath,
                fileContents,
                filePurpose: 'Bootstrapped template file',
            };
        }
        catch (error) {
            console.error(`[FileManager] Failed to get template file:`, error, filePath);
            return null;
        }
    }
    getFile(filePath) {
        // First search generated files
        const generatedFile = this.getGeneratedFile(filePath);
        if (generatedFile) {
            return generatedFile;
        }
        // Then search template files
        return this.getTemplateFile(filePath);
    }
}
