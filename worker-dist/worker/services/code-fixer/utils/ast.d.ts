/**
 * AST utility functions for parsing and generating code using Babel
 * Extracted from the working BabelASTProcessor to maintain exact functionality
 */
import { ParserOptions } from '@babel/parser';
import { Visitor } from '@babel/traverse';
import * as t from '@babel/types';
import { ParseOptions, GenerateOptions } from '../types';
/**
 * Get the standard parser options that work with TypeScript/JSX
 * Preserves exact configuration from working BabelASTProcessor
 */
export declare function getDefaultParseOptions(): ParserOptions;
/**
 * Merge custom options with defaults
 */
export declare function mergeParseOptions(custom?: ParseOptions): ParserOptions;
/**
 * Parse code string to Babel AST
 * Includes fallback to JavaScript parsing if TypeScript parsing fails
 */
export declare function parseCode(code: string, options?: ParseOptions): t.File;
/**
 * Traverse AST with visitor pattern
 * Direct wrapper around Babel traverse
 */
export declare function traverseAST(ast: t.Node, visitor: Visitor): void;
/**
 * Generate code from AST
 * Uses settings optimized for readable output
 */
export declare function generateCode(ast: t.Node, options?: GenerateOptions): {
    code: string;
};
/**
 * Check if a file path represents a script file (TypeScript/JavaScript)
 */
export declare function isScriptFile(filePath: string): boolean;
/**
 * Determine if code contains JSX based on usage analysis
 */
export declare function shouldUseJSXExtension(usageAnalysis: Array<{
    type: string;
}>): boolean;
/**
 * Get appropriate file extension based on usage
 */
export declare function getAppropriateExtension(usageAnalysis: Array<{
    type: string;
}>): string;
/**
 * Create a React import declaration for JSX files
 */
export declare function createReactImport(): t.ImportDeclaration;
/**
 * Create an export statement from a variable declaration
 */
export declare function createNamedExport(declaration: t.VariableDeclaration): t.ExportNamedDeclaration;
/**
 * Create a default export from an identifier
 */
export declare function createDefaultExport(identifier: t.Identifier): t.ExportDefaultDeclaration;
/**
 * Create a file AST with given statements
 */
export declare function createFileAST(statements: t.Statement[]): t.File;
/**
 * Validate that an AST node is a valid File node
 */
export declare function isValidFileAST(ast: t.Node): ast is t.File;
/**
 * Validate that generated code is syntactically correct
 */
export declare function validateGeneratedCode(code: string): boolean;
