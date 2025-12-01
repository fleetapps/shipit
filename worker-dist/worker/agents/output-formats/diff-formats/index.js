/**
 * Diff Format Implementations for LLM-generated code changes
 *
 * This module provides two different diff format implementations,
 * each with the same API but different approaches to handling changes.
 */
import { applyDiff as applyUnifiedDiff } from './udiff';
import { applyDiff as applySearchReplaceDiff, createSearchReplaceDiff, validateDiff as validateSearchReplaceDiff, MatchingStrategy } from './search-replace';
export { 
// Unified Diff Format (git-style)
applyUnifiedDiff, 
// Search/Replace Format (simpler, more reliable for LLMs)
applySearchReplaceDiff, createSearchReplaceDiff, validateSearchReplaceDiff, MatchingStrategy, };
