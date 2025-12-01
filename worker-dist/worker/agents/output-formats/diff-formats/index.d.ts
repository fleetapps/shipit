/**
 * Diff Format Implementations for LLM-generated code changes
 *
 * This module provides two different diff format implementations,
 * each with the same API but different approaches to handling changes.
 */
import { applyDiff as applyUnifiedDiff } from './udiff';
import { applyDiff as applySearchReplaceDiff, createSearchReplaceDiff, validateDiff as validateSearchReplaceDiff, ApplyResult, FailedBlock, MatchingStrategy } from './search-replace';
export { applyUnifiedDiff, applySearchReplaceDiff, createSearchReplaceDiff, validateSearchReplaceDiff, type ApplyResult, type FailedBlock, MatchingStrategy, };
