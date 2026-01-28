# Parallel Phase Execution Design

## Overview
Execute all blueprint phases concurrently instead of sequentially, dramatically reducing total execution time.

## Architecture

### Implementation Approach

**Simple Integrated Approach**: Modified `PhasicCodingBehavior.launchStateMachine()` to:
1. Generate phase concepts sequentially (they need context from previous phases)
2. Execute all phase implementations in parallel using `Promise.allSettled()`
3. Reuse existing `implementPhase()` method (no new abstractions needed)

### Design Principles

1. **Sequential Generation, Parallel Execution**: Phase concepts generated one-by-one (need context), but implementation runs in parallel
2. **Resilience**: One phase failure doesn't block others (`Promise.allSettled`)
3. **Progress Tracking**: Real-time updates as phases complete (existing WebSocket broadcasts)
4. **Simplicity**: Reuses existing methods, minimal new code

## Flow

```
1. Blueprint generated with N phases (e.g., 5 phases)
2. Generate initial phase concept
3. Generate roadmap phase concepts sequentially (each sees previous context)
4. All phase implementations start simultaneously
5. Each phase:
   - Implements files independently
   - Validates and fixes code
   - Reports completion via WebSocket
6. Wait for all phases (Promise.allSettled)
7. Transition to review cycle
```

## Implementation Details

### Modified launchStateMachine()

```typescript
// In PhasicCodingBehavior
private async launchStateMachine() {
  // Check if parallel execution should be used
  const shouldUseParallel = roadmapPhases.length > 1 && !hasIncompletePhases;
  
  if (shouldUseParallel) {
    await this.executePhasesInParallel();
    return;
  }
  // ... sequential fallback
}
```

### executePhasesInParallel()

```typescript
private async executePhasesInParallel(): Promise<void> {
  // 1. Generate concepts sequentially
  for (const roadmapPhase of roadmap) {
    const concept = await this.generateNextPhase(...);
    allPhases.push(concept);
  }
  
  // 2. Execute all in parallel
  const promises = allPhases.map(phase => 
    this.implementPhase(phase, issues, undefined, false, true)
  );
  
  await Promise.allSettled(promises);
}
```

### Resource Conflict Handling

- **File writes**: Existing `fileManager.saveGeneratedFiles()` handles concurrent writes
- **Sandbox operations**: Existing deployment mutex pattern prevents conflicts
- **Git commits**: Each phase commits independently (no conflicts expected)

## Benefits

1. **Speed**: 5 phases in ~5 minutes instead of ~25 minutes (5x faster)
2. **Resilience**: Foundation phase stuck? Others still complete
3. **Progress**: UI shows "2/5 completed" as phases finish (non-sequential)
4. **Simplicity**: Coordinator just waits for Promise.all()

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| File conflicts | Detect overlapping file paths, serialize those operations |
| Sandbox conflicts | Use existing deployment mutex pattern |
| Memory overhead | Workers share read-only blueprint, lightweight |
| LLM rate limits | Existing rate limiting handles this |
| Phase dependencies | Blueprint phases are designed to be independent |

## Migration Path

1. **Phase 1**: Keep sequential as fallback, add parallel as opt-in
2. **Phase 2**: Make parallel default, sequential as fallback
3. **Phase 3**: Remove sequential path (if parallel proves stable)

## Example Execution

```
Time 0:00 - Coordinator spawns 5 workers
Time 0:00 - All 5 workers start generating concepts
Time 0:30 - Phase 2 completes → UI: "1/5 completed"
Time 1:00 - Phase 4 completes → UI: "2/5 completed"  
Time 1:30 - Phase 1 completes → UI: "3/5 completed"
Time 2:00 - Phase 3 completes → UI: "4/5 completed"
Time 2:30 - Phase 5 completes → UI: "5/5 completed"
Time 2:30 - Coordinator aggregates results, finalizes
```

Total time: ~2.5 minutes vs ~12.5 minutes sequential (5x speedup)
