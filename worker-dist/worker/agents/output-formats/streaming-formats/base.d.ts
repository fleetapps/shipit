import { FileGenerationOutputType } from "../../schemas";
/**
 * A Chunk of llm output can contain partial contents of multiple files
 * the chunk can be very large and therefore multiple entire files can be present in the chunk
 * along with the partial ending contents of the last file and the beginning contents of the next file
 */
export interface ParsingState {
    currentMode: 'idle' | 'file_creation' | 'diff_patch';
    currentFile: string | null;
    currentFileFormat: 'full_content' | 'unified_diff' | null;
    contentBuffer: string;
    eofMarker: string | null;
    insideEofBlock: boolean;
    openedFiles: Set<string>;
    closedFiles: Set<string>;
    partialLineBuffer: string;
    commandBuffer: string;
    parsingMultiLineCommand: boolean;
    potentialEofBuffer: string;
    tailBuffer: string;
    lastChunkEndedWithNewline: boolean;
    betweenFilesBuffer: string;
    extractedInstallCommands: string[];
}
export interface CodeGenerationStreamingState {
    accumulator: string;
    completedFiles: Map<string, FileGenerationOutputType>;
    parsingState: ParsingState;
}
export declare abstract class CodeGenerationFormat {
    constructor();
    abstract parseStreamingChunks(chunk: string, state: CodeGenerationStreamingState, onFileOpen: (filePath: string) => void, // To be called when a new file is opened
    onFileChunk: (filePath: string, chunk: string, format: 'full_content' | 'unified_diff') => void, // To be called to pass the chunk of a file
    onFileClose: (filePath: string) => void): CodeGenerationStreamingState;
    abstract serialize(files: FileGenerationOutputType[]): string;
    abstract deserialize(serialized: string): FileGenerationOutputType[];
    abstract formatInstructions(): string;
}
