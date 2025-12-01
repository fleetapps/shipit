/**
 * General Purpose XML Streaming Format
 * Robust streaming parser for any XML structure with LLM error resilience
 * Extends the proven streaming infrastructure from SCOF format
 */
import { CodeGenerationFormat } from './base';
/**
 * XmlStreamFormat - General purpose XML streaming parser
 * Uses the same reliability patterns as SCOF format for robust chunk handling
 */
export class XmlStreamFormat extends CodeGenerationFormat {
    parseStreamingChunks(_chunk, state, _onFileOpen, _onFileChunk, _onFileClose) {
        // This method is required by the abstract class but not used for XML parsing
        // The actual XML parsing is done via parseXmlStream method
        return state;
    }
    serialize(_files) {
        // Not directly applicable for XML format
        return '';
    }
    deserialize(_serialized) {
        // Not directly applicable for XML format
        return [];
    }
    formatInstructions() {
        return `
<XML OUTPUT FORMAT>
Structure your response using well-formed XML:

<element_name>
[Content here]
</element_name>

<another_element attribute="value">
[More content]
</another_element>

IMPORTANT:
- Use proper XML formatting with matching opening/closing tags
- Attributes should be quoted with double quotes
- Content can span multiple lines
- Nested elements are supported
- Self-closing tags: <element />
</XML OUTPUT FORMAT>
`;
    }
    /**
     * Parse XML stream with robust error handling and fallback
     */
    parseXmlStream(chunk, state, callbacks, config = {}) {
        // Initialize state if null or corrupted
        let workingState;
        if (!state || !this.isValidXmlState(state)) {
            workingState = this.initializeXmlState(config);
        }
        else {
            workingState = state;
        }
        // Add chunk to both content buffer and raw XML buffer
        workingState.contentBuffer += chunk;
        workingState.rawXmlBuffer += chunk;
        // Process the accumulated content
        this.processXmlContent(workingState, callbacks);
        return workingState;
    }
    /**
     * Finalize XML parsing and return all extracted elements
     */
    finalizeXmlParsing(state) {
        // Try final parsing attempt on remaining buffer or incomplete elements
        if (state.contentBuffer.length > 0 || state.elementStack.length > 0) {
            this.attemptFallbackExtraction(state);
        }
        return state.extractedElements;
    }
    /**
     * Get specific element by tag name (returns first match)
     */
    getElement(state, tagName) {
        const elements = state.extractedElements.get(tagName.toLowerCase());
        return elements && elements.length > 0 ? elements[0] : null;
    }
    /**
     * Get all elements by tag name
     */
    getElements(state, tagName) {
        return state.extractedElements.get(tagName.toLowerCase()) || [];
    }
    isValidXmlState(state) {
        return state &&
            typeof state.xmlParserState === 'string' &&
            Array.isArray(state.elementStack) &&
            state.extractedElements instanceof Map &&
            state.targetElements instanceof Set &&
            typeof state.contentBuffer === 'string' &&
            Array.isArray(state.errorMessages);
    }
    initializeXmlState(config) {
        return {
            // Base parsing state (required by interface)
            currentMode: 'idle',
            currentFile: null,
            currentFileFormat: null,
            contentBuffer: '',
            eofMarker: null,
            insideEofBlock: false,
            openedFiles: new Set(),
            closedFiles: new Set(),
            partialLineBuffer: '',
            commandBuffer: '',
            parsingMultiLineCommand: false,
            potentialEofBuffer: '',
            tailBuffer: '',
            lastChunkEndedWithNewline: false,
            betweenFilesBuffer: '',
            extractedInstallCommands: [],
            // XML-specific state
            xmlParserState: 'seeking_element',
            elementStack: [],
            currentElement: null,
            extractedElements: new Map(),
            potentialTagBuffer: '',
            targetElements: new Set((config.targetElements || []).map(t => t.toLowerCase())),
            streamingElements: new Set((config.streamingElements || []).map(t => t.toLowerCase())),
            hasParsingErrors: false,
            errorMessages: [],
            rawXmlBuffer: ''
        };
    }
    processXmlContent(state, callbacks) {
        let changed = true;
        let iterations = 0;
        const maxIterations = 1000; // Prevent infinite loops
        // Process buffer until no more changes or max iterations
        while (changed && state.xmlParserState !== 'complete' && iterations < maxIterations) {
            changed = false;
            iterations++;
            try {
                // Look for XML tags in the buffer
                const tagMatch = this.findNextXmlTag(state.contentBuffer);
                if (tagMatch) {
                    changed = this.processXmlTag(tagMatch, state, callbacks);
                }
                else {
                    // No complete tags found, handle partial content
                    this.handlePartialContent(state, callbacks);
                    break;
                }
            }
            catch (error) {
                this.handleParsingError(state, `XML processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, callbacks);
                break;
            }
        }
        // Prevent buffer from growing too large
        if (state.contentBuffer.length > state.maxBufferSize || 10000) {
            // Keep last portion in case we have partial tags
            const keepSize = Math.min(2000, state.contentBuffer.length);
            state.contentBuffer = state.contentBuffer.substring(state.contentBuffer.length - keepSize);
        }
    }
    findNextXmlTag(buffer) {
        // Regex for XML tags (opening, closing, or self-closing)
        const xmlTagRegex = /<\/?([a-zA-Z_][a-zA-Z0-9_-]*)[^>]*\/?>/;
        const match = buffer.match(xmlTagRegex);
        if (!match)
            return null;
        const fullMatch = match[0];
        const tagName = match[1];
        const index = match.index;
        // Determine tag type
        let type;
        if (fullMatch.startsWith('</')) {
            type = 'closing';
        }
        else if (fullMatch.endsWith('/>')) {
            type = 'self-closing';
        }
        else {
            type = 'opening';
        }
        // Extract attributes (simple implementation)
        const attributes = this.extractAttributes(fullMatch);
        return { type, tagName, attributes, fullMatch, index };
    }
    extractAttributes(tagString) {
        const attributes = {};
        // Simple attribute extraction (handles most cases)
        const attrRegex = /([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*["']([^"']*)["']/g;
        let match;
        while ((match = attrRegex.exec(tagString)) !== null) {
            attributes[match[1]] = match[2];
        }
        return attributes;
    }
    processXmlTag(tagMatch, state, callbacks) {
        const { type, tagName, attributes, fullMatch, index } = tagMatch;
        // Extract content before this tag
        const contentBefore = state.contentBuffer.substring(0, index);
        if (contentBefore && state.currentElement) {
            this.addContentToCurrentElement(state, contentBefore, callbacks);
        }
        // Remove processed content from buffer
        state.contentBuffer = state.contentBuffer.substring(index + fullMatch.length);
        if (type === 'opening') {
            return this.handleOpeningTag(tagName, attributes, state, callbacks);
        }
        else if (type === 'closing') {
            return this.handleClosingTag(tagName, state, callbacks);
        }
        else if (type === 'self-closing') {
            return this.handleSelfClosingTag(tagName, attributes, state, callbacks);
        }
        return false;
    }
    handleOpeningTag(tagName, attributes, state, callbacks) {
        // Create new element
        const element = {
            tagName: tagName.toLowerCase(),
            attributes: attributes,
            content: '',
            isComplete: false,
            children: []
        };
        // Add to parent element if we have one
        if (state.currentElement) {
            state.currentElement.children.push(element);
        }
        // Push to stack and set as current
        state.elementStack.push(element);
        state.currentElement = element;
        // Call callback if configured
        if (callbacks.onElementStart) {
            callbacks.onElementStart(element);
        }
        return true;
    }
    handleClosingTag(tagName, state, callbacks) {
        const normalizedTagName = tagName.toLowerCase();
        if (!state.currentElement) {
            this.handleParsingError(state, `Unexpected closing tag: ${tagName}`, callbacks);
            return false;
        }
        // Verify tag matching (case insensitive)
        if (state.currentElement.tagName.toLowerCase() !== normalizedTagName) {
            this.handleParsingError(state, `Mismatched closing tag: expected ${state.currentElement.tagName}, got ${tagName}`, callbacks);
            return false;
        }
        // Mark element as complete
        state.currentElement.isComplete = true;
        // Mark streaming as complete (don't re-stream content, just mark complete)
        if (state.streamingElements.has(normalizedTagName) && callbacks.onElementContent) {
            callbacks.onElementContent(tagName, '', true);
        }
        // Store completed element
        this.storeElement(state, state.currentElement);
        // Call completion callback
        if (callbacks.onElementComplete) {
            callbacks.onElementComplete(state.currentElement);
        }
        // Pop from stack
        state.elementStack.pop();
        state.currentElement = state.elementStack.length > 0 ? state.elementStack[state.elementStack.length - 1] : null;
        return true;
    }
    handleSelfClosingTag(tagName, attributes, state, callbacks) {
        // Create complete element
        const element = {
            tagName: tagName.toLowerCase(),
            attributes: attributes,
            content: '',
            isComplete: true,
            children: []
        };
        // Add to parent if we have one
        if (state.currentElement) {
            state.currentElement.children.push(element);
        }
        // Store element
        this.storeElement(state, element);
        // Call callbacks
        if (callbacks.onElementStart) {
            callbacks.onElementStart(element);
        }
        if (callbacks.onElementComplete) {
            callbacks.onElementComplete(element);
        }
        return true;
    }
    addContentToCurrentElement(state, content, callbacks) {
        if (!state.currentElement || !content)
            return;
        // Add content to current element
        state.currentElement.content += content;
        // Stream content if configured
        const normalizedTagName = state.currentElement.tagName.toLowerCase();
        if (state.streamingElements.has(normalizedTagName) && callbacks.onElementContent) {
            callbacks.onElementContent(state.currentElement.tagName, content, false);
        }
    }
    handlePartialContent(state, callbacks) {
        // Stream content immediately for responsive feedback
        if (state.currentElement && state.contentBuffer.length > 0) {
            // Check if buffer might end with partial tag
            const hasPartialTag = state.contentBuffer.includes('<');
            if (!hasPartialTag) {
                // Safe to process all content
                this.addContentToCurrentElement(state, state.contentBuffer, callbacks);
                state.contentBuffer = '';
            }
            else {
                // Process content before the last '<' character
                const lastTagIndex = state.contentBuffer.lastIndexOf('<');
                if (lastTagIndex > 0) {
                    const safeContent = state.contentBuffer.substring(0, lastTagIndex);
                    this.addContentToCurrentElement(state, safeContent, callbacks);
                    state.contentBuffer = state.contentBuffer.substring(lastTagIndex);
                }
            }
        }
    }
    storeElement(state, element) {
        const normalizedTagName = element.tagName.toLowerCase();
        // Store if it's a target element or if no targets specified
        if (state.targetElements.size === 0 || state.targetElements.has(normalizedTagName)) {
            if (!state.extractedElements.has(normalizedTagName)) {
                state.extractedElements.set(normalizedTagName, []);
            }
            state.extractedElements.get(normalizedTagName).push(element);
        }
    }
    handleParsingError(state, error, callbacks) {
        state.hasParsingErrors = true;
        state.errorMessages.push(error);
        if (callbacks.onParsingError) {
            callbacks.onParsingError(error);
        }
        // Try fallback extraction
        this.attemptFallbackExtraction(state);
    }
    attemptFallbackExtraction(state) {
        try {
            // Try to extract elements using lenient regex
            for (const targetElement of state.targetElements) {
                if (!state.extractedElements.has(targetElement)) {
                    const regex = new RegExp(`<${targetElement}[^>]*>(.*?)(?:<\\/${targetElement}>|$)`, 'is');
                    const match = state.rawXmlBuffer.match(regex);
                    if (match) {
                        const element = {
                            tagName: targetElement,
                            attributes: {},
                            content: match[1].trim(),
                            isComplete: true,
                            children: []
                        };
                        state.extractedElements.set(targetElement, [element]);
                    }
                }
            }
        }
        catch (error) {
            console.warn('Fallback XML extraction failed:', error);
        }
    }
}
/**
 * Utility function to create XML stream parser
 */
export function createXmlStreamParser(_config) {
    return new XmlStreamFormat();
}
/**
 * Utility function to parse complete XML string
 */
export function parseXmlString(xmlString, config) {
    const parser = new XmlStreamFormat();
    const state = parser.initializeXmlState(config || {});
    parser.parseXmlStream(xmlString, state, {}, config);
    return parser.finalizeXmlParsing(state);
}
