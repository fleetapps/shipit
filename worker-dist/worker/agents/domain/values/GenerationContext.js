import { DependencyManagement } from '../pure/DependencyManagement';
import { FileProcessing } from '../pure/FileProcessing';
/**
 * Immutable context for code generation operations
 * Contains all necessary data for generating code
 */
export class GenerationContext {
    query;
    blueprint;
    templateDetails;
    dependencies;
    allFiles;
    generatedPhases;
    commandsHistory;
    constructor(query, blueprint, templateDetails, dependencies, allFiles, generatedPhases, commandsHistory) {
        this.query = query;
        this.blueprint = blueprint;
        this.templateDetails = templateDetails;
        this.dependencies = dependencies;
        this.allFiles = allFiles;
        this.generatedPhases = generatedPhases;
        this.commandsHistory = commandsHistory;
        // Freeze to ensure immutability
        Object.freeze(this);
        Object.freeze(this.dependencies);
        Object.freeze(this.allFiles);
        Object.freeze(this.generatedPhases);
        Object.freeze(this.commandsHistory);
    }
    /**
     * Create context from current state
     */
    static from(state, templateDetails, logger) {
        const dependencies = DependencyManagement.mergeDependencies(templateDetails.deps || {}, state.lastPackageJson, logger);
        const allFiles = FileProcessing.getAllRelevantFiles(templateDetails, state.generatedFilesMap);
        return new GenerationContext(state.query, state.blueprint, templateDetails, dependencies, allFiles, state.generatedPhases, state.commandsHistory || []);
    }
    /**
     * Get formatted phases for prompt generation
     */
    getCompletedPhases() {
        return Object.values(this.generatedPhases.filter(phase => phase.completed));
    }
    getFileTree() {
        const builder = new FileTreeBuilder(this.templateDetails?.fileTree);
        for (const { filePath } of this.allFiles) {
            const normalized = FileTreeBuilder.normalizePath(filePath);
            if (normalized) {
                builder.addFile(normalized);
            }
        }
        return builder.build();
    }
}
class FileTreeBuilder {
    directoryIndex = new Map();
    fileIndex = new Set();
    root;
    constructor(templateTree) {
        this.root = this.createRoot();
        if (templateTree) {
            const clonedRoot = this.cloneNode(templateTree);
            if (clonedRoot?.type === 'directory') {
                this.root = clonedRoot;
            }
        }
        if (!this.directoryIndex.has(this.root.path)) {
            this.directoryIndex.set(this.root.path, this.root);
        }
    }
    static normalizePath(rawPath) {
        if (!rawPath) {
            return '';
        }
        let cleaned = rawPath.trim().replace(/\\/g, '/');
        while (cleaned.startsWith('./')) {
            cleaned = cleaned.slice(2);
        }
        cleaned = cleaned.replace(/^\/+/g, '');
        if (!cleaned) {
            return '';
        }
        const segments = [];
        for (const segment of cleaned.split('/')) {
            if (!segment || segment === '.') {
                continue;
            }
            if (segment === '..') {
                if (segments.length === 0) {
                    return null;
                }
                segments.pop();
                continue;
            }
            segments.push(segment);
        }
        return segments.join('/');
    }
    addFile(path) {
        if (this.fileIndex.has(path)) {
            return;
        }
        const directoryPath = this.parentPath(path);
        const directory = this.ensureDirectory(directoryPath);
        const existing = directory.children?.find(child => child.path === path);
        if (existing) {
            if (existing.type === 'file') {
                this.fileIndex.add(path);
            }
            return;
        }
        const fileNode = { path, type: 'file' };
        directory.children = directory.children || [];
        directory.children.push(fileNode);
        this.fileIndex.add(path);
    }
    build() {
        this.sortNode(this.root);
        return this.root;
    }
    cloneNode(node) {
        const normalizedPath = FileTreeBuilder.normalizePath(node.path);
        if (normalizedPath === null) {
            return null;
        }
        if (node.type === 'directory') {
            const cloned = {
                path: normalizedPath,
                type: 'directory',
                children: []
            };
            this.directoryIndex.set(normalizedPath, cloned);
            node.children?.forEach(child => {
                const clonedChild = this.cloneNode(child);
                if (clonedChild) {
                    cloned.children.push(clonedChild);
                }
            });
            return cloned;
        }
        if (!normalizedPath) {
            return null;
        }
        this.fileIndex.add(normalizedPath);
        return { path: normalizedPath, type: 'file' };
    }
    ensureDirectory(path) {
        if (!path) {
            return this.root;
        }
        const existing = this.directoryIndex.get(path);
        if (existing) {
            return existing;
        }
        const parent = this.ensureDirectory(this.parentPath(path));
        const directory = {
            path,
            type: 'directory',
            children: []
        };
        parent.children = parent.children || [];
        parent.children.push(directory);
        this.directoryIndex.set(path, directory);
        return directory;
    }
    sortNode(node) {
        if (!node.children || node.children.length === 0) {
            if (node.type === 'directory') {
                node.children = [];
            }
            else {
                delete node.children;
            }
            return;
        }
        node.children.sort((left, right) => {
            if (left.type !== right.type) {
                return left.type === 'directory' ? -1 : 1;
            }
            const leftName = this.basename(left.path);
            const rightName = this.basename(right.path);
            return leftName.localeCompare(rightName);
        });
        node.children.forEach(child => this.sortNode(child));
    }
    createRoot() {
        return { path: '', type: 'directory', children: [] };
    }
    parentPath(path) {
        if (!path.includes('/')) {
            return '';
        }
        return path.slice(0, path.lastIndexOf('/'));
    }
    basename(path) {
        const segments = path.split('/');
        return segments[segments.length - 1] || path;
    }
}
