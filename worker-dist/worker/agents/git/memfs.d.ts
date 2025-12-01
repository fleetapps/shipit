/**
 * In-memory filesystem for git clone operations
 * Full async implementation for isomorphic-git compatibility
 */
export declare class MemFS {
    private files;
    constructor();
    writeFile(path: string, data: string | Uint8Array): Promise<void>;
    readFile(path: string, options?: {
        encoding?: 'utf8' | string;
    }): Promise<Uint8Array | string>;
    readdir(dirPath: string): Promise<string[]>;
    stat(path: string): Promise<{
        type: 'file' | 'dir';
        mode: number;
        size: number;
        mtimeMs: number;
        ino: number;
        uid: number;
        gid: number;
        dev: number;
        ctime: Date;
        mtime: Date;
        ctimeMs: number;
        isFile: () => boolean;
        isDirectory: () => boolean;
        isSymbolicLink: () => boolean;
    }>;
    lstat(path: string): Promise<{
        type: "file" | "dir";
        mode: number;
        size: number;
        mtimeMs: number;
        ino: number;
        uid: number;
        gid: number;
        dev: number;
        ctime: Date;
        mtime: Date;
        ctimeMs: number;
        isFile: () => boolean;
        isDirectory: () => boolean;
        isSymbolicLink: () => boolean;
    }>;
    mkdir(_path: string, _options?: any): Promise<void>;
    rmdir(_path: string): Promise<void>;
    rename(oldPath: string, newPath: string): Promise<void>;
    chmod(_path: string, _mode: number): Promise<void>;
    readlink(_path: string): Promise<string>;
    symlink(_target: string, _path: string): Promise<void>;
    unlink(path: string): Promise<void>;
}
