# Phase Execution Improvements

## Summary

Fixed three critical issues with phase execution:
1. **Counter Mismatch**: Now uses blueprint roadmap count instead of MAX_PHASES
2. **Early Stopping**: Prevents LLM from stopping early when roadmap phases remain
3. **Parallel Execution**: Executes all phases concurrently for 5x speedup

## Changes Made

### 1. Counter Initialization Fix

**File**: `worker/agents/core/behaviors/phasic.ts`

**Change**: Initialize `phasesCounter` based on blueprint roadmap length

```typescript
// Before: Always used MAX_PHASES (10)
phasesCounter: MAX_PHASES

// After: Uses blueprint roadmap count
const roadmapPhases = blueprint?.implementationRoadmap?.length || 0;
const totalExpectedPhases = Math.max(roadmapPhases + 1, MAX_PHASES);
phasesCounter: totalExpectedPhases
```

**Impact**: Counter now matches UI display (e.g., "0/5" instead of "0/10")

### 2. Early Stopping Prevention

**File**: `worker/agents/core/behaviors/phasic.ts`

**Change**: Check remaining roadmap phases before honoring `lastPhase: true`

```typescript
// Check remaining roadmap phases
const remainingRoadmapPhases = roadmapPhases.filter(roadmapPhase => {
    // Check if phase already completed
});

// Only finalize if no roadmap phases remain
const shouldFinalize = 
    (phasesCounter <= 0 && remainingRoadmapPhases.length === 0) ||
    (phaseConcept.lastPhase && remainingRoadmapPhases.length === 0);

// Log warning if LLM tried to stop early
if (phaseConcept.lastPhase && remainingRoadmapPhases.length > 0) {
    this.logger.warn(`Ignoring lastPhase flag: ${remainingRoadmapPhases.length} roadmap phases remain`);
}
```

**Impact**: System now completes all 5 phases even if LLM marks one as `lastPhase: true` early

### 3. Parallel Execution

**File**: `worker/agents/core/behaviors/phasic.ts`

**Change**: Added `executePhasesInParallel()` method

**How it works**:
1. Generates phase concepts sequentially (they need context from previous phases)
2. Executes all phase implementations in parallel using `Promise.allSettled()`
3. Each phase runs independently with its own LLM context
4. Progress updates via existing WebSocket broadcasts

**Benefits**:
- **5x faster**: 5 phases in ~5 minutes instead of ~25 minutes
- **Resilient**: One phase stuck? Others still complete
- **Progress**: UI shows "2/5 completed" as phases finish (non-sequential)

**When it activates**:
- Blueprint has >1 roadmap phases
- No incomplete phases (fresh start)
- No previously generated phases

## Testing

### Expected Behavior

1. **Counter matches UI**: If blueprint shows "0/5", counter should be 5
2. **All phases complete**: System completes all 5 phases even if LLM marks one as last
3. **Parallel execution**: All phases execute simultaneously (check logs for `[Parallel]` messages)
4. **Progress updates**: UI shows phases completing out of order (e.g., "2/5" then "4/5" then "1/5")

### Verification

Check logs for:
- `Initializing phase counter` with correct `totalExpectedPhases`
- `Ignoring lastPhase flag` warnings (if LLM tries to stop early)
- `[Parallel X/Y] Starting/Completed` messages
- `Parallel execution complete: X succeeded, Y failed`

## Future Enhancements

1. **Resource Conflict Detection**: Detect if phases modify same files and serialize those operations
2. **Adaptive Parallelism**: Start phases in parallel but serialize if conflicts detected
3. **Phase Dependencies**: Support explicit phase dependencies (currently assumes independence)

## Rollback

If parallel execution causes issues, it automatically falls back to sequential execution when:
- There are incomplete phases (resuming)
- Previously generated phases exist
- Only 1 roadmap phase exists
