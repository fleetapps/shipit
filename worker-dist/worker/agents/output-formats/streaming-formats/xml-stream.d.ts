/**
 * General Purpose XML Streaming Format
 * Robust streaming parser for any XML structure with LLM error resilience
 * Extends the proven streaming infrastructure from SCOF format
 */
import { CodeGenerationFormat, CodeGenerationStreamingState, ParsingState } from './base';
import { FileGenerationOutputType } from "../../schemas";
export interface XmlParsingState extends ParsingState {
    xmlParserState: 'seeking_element' | 'in_element' | 'complete';
    elementStack: XmlElement[];
    currentElement: XmlElement | null;
    extractedElements: Map<string, XmlElement[]>;
    potentialTagBuffer: string;
    targetElements: Set<string>;
    streamingElements: Set<string>;
    hasParsingErrors: boolean;
    errorMessages: string[];
    rawXmlBuffer: string;
}
export interface XmlElement {
    tagName: string;
    attributes: Record<string, string>;
    content: string;
    isComplete: boolean;
    children: XmlElement[];
}
export interface XmlStreamingCallbacks {
    onElementStart?: (element: XmlElement) => void;
    onElementContent?: (tagName: string, content: string, isComplete: boolean) => void;
    onElementComplete?: (element: XmlElement) => void;
    onParsingError?: (error: string) => void;
}
export interface XmlParsingConfig {
    targetElements?: string[];
    streamingElements?: string[];
    preserveWhitespace?: boolean;
    maxBufferSize?: number;
}
/**
 * XmlStreamFormat - General purpose XML streaming parser
 * Uses the same reliability patterns as SCOF format for robust chunk handling
 */
export declare class XmlStreamFormat extends CodeGenerationFormat {
    parseStreamingChunks(_chunk: string, state: CodeGenerationStreamingState, _onFileOpen: (filePath: string) => void, _onFileChunk: (filePath: string, chunk: string, format: 'full_content' | 'unified_diff') => void, _onFileClose: (filePath: string) => void): CodeGenerationStreamingState;
    serialize(_files: FileGenerationOutputType[]): string;
    deserialize(_serialized: string): FileGenerationOutputType[];
    formatInstructions(): string;
    /**
     * Parse XML stream with robust error handling and fallback
     */
    parseXmlStream(chunk: string, state: XmlParsingState | null, callbacks: XmlStreamingCallbacks, config?: XmlParsingConfig): XmlParsingState;
    /**
     * Finalize XML parsing and return all extracted elements
     */
    finalizeXmlParsing(state: XmlParsingState): Map<string, XmlElement[]>;
    /**
     * Get specific element by tag name (returns first match)
     */
    getElement(state: XmlParsingState, tagName: string): XmlElement | null;
    /**
     * Get all elements by tag name
     */
    getElements(state: XmlParsingState, tagName: string): XmlElement[];
    private isValidXmlState;
    initializeXmlState(config: XmlParsingConfig): XmlParsingState;
    private processXmlContent;
    private findNextXmlTag;
    private extractAttributes;
    private processXmlTag;
    private handleOpeningTag;
    private handleClosingTag;
    private handleSelfClosingTag;
    private addContentToCurrentElement;
    private handlePartialContent;
    private storeElement;
    private handleParsingError;
    private attemptFallbackExtraction;
}
/**
 * Utility function to create XML stream parser
 */
export declare function createXmlStreamParser(_config?: XmlParsingConfig): XmlStreamFormat;
/**
 * Utility function to parse complete XML string
 */
export declare function parseXmlString(xmlString: string, config?: XmlParsingConfig): Map<string, XmlElement[]>;
