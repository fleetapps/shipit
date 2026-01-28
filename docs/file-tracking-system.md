# File Tracking System for Generation Completion

## Overview
Ensures `generation_complete` is only sent when ALL expected files have been generated, with proper tracking and logging.

## Architecture

### File Tracking State
- `expectedFiles: Set<string>` - All files that should be generated (from all phases)
- `generatedFiles: Set<string>` - Files that have completed generation

### Flow

1. **Initialization** (`initializeFileTracking()`)
   - Collects all expected files from:
     - Initial phase files
     - Generated phases files
     - Roadmap phases (added as phases are generated)
   - Logs: `[File Tracking] File tracking initialized: X expected files`

2. **File Generation Start** (`fileGeneratingCallback`)
   - Tracks when a file starts generating
   - Adds to `expectedFiles` if not already tracked (for dynamically generated files)
   - Logs: `[File Tracking] File generating: path (X/Y done)`

3. **File Generation Complete** (`fileClosedCallback`)
   - Tracks when a file completes generation
   - Adds to `generatedFiles`
   - Logs: `[File Tracking] ✓ File generated: path (X/Y done)`
   - Broadcasts `FILE_GENERATED` websocket event

4. **Completion Check** (`waitForAllFilesToComplete()`)
   - Polls every 500ms until all files are complete
   - Max wait time: 30 seconds
   - Logs progress every 2 seconds
   - Only returns when all expected files are generated

5. **Generation Complete**
   - Only sent after `waitForAllFilesToComplete()` returns
   - Ensures all files are truly done before signaling completion

## Integration Points

### Parallel Execution
- Files from all phases tracked in parallel
- `waitForAllFilesToComplete()` called after all phases finish
- Handles concurrent file generation properly

### Sequential Execution
- Files tracked as phases complete
- `waitForAllFilesToComplete()` called after state machine completes
- Ensures no files are missed

## Logging

All file tracking operations log with `[File Tracking]` prefix:
- File tracking initialized
- File generating (with progress X/Y)
- File generated (with progress X/Y)
- Waiting for files (with pending list)
- All files completed

## Benefits

1. **Accurate Completion**: `generation_complete` only fires when ALL files are done
2. **Progress Tracking**: Real-time progress (X/Y files done)
3. **Debugging**: Clear logs show which files are pending
4. **Resilience**: Handles dynamically generated files
5. **Parallel Safe**: Works correctly with parallel phase execution

## Example Log Flow

```
[File Tracking] File tracking initialized: 15 expected files
[File Tracking] File generating: src/App.tsx (0/15 done)
[File Tracking] ✓ File generated: src/App.tsx (1/15 done)
[File Tracking] File generating: src/components/Header.tsx (1/15 done)
[File Tracking] ✓ File generated: src/components/Header.tsx (2/15 done)
...
[File Tracking] ✓ File generated: src/utils/helpers.ts (15/15 done)
[File Tracking] All 15 expected files have been generated
```
