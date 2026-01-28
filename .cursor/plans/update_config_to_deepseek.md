# Update Config to Use DeepSeek Instead of Google

## Overview
Replace all Google AI Studio (Gemini) model references with DeepSeek models in the default agent configurations. This will make DeepSeek the default provider instead of Google.

## URL Fix (Already Completed)
- Updated DeepSeek base URL from `https://api.deepseek.com` to `https://api.deepseek.com/v1` for OpenAI SDK compatibility

## Model Mapping Strategy

### DeepSeek Models Available
- `DEEPSEEK_CHAT_V3_2` (`deepseek/deepseek-chat`) - Regular model, non-thinking mode
- `DEEPSEEK_REASONER_V3_2` (`deepseek/deepseek-reasoner`) - Large model, thinking mode (v3.2)

### Mapping Logic
- **For tasks with `reasoning_effort` set** (high/medium/low): Use `DEEPSEEK_REASONER_V3_2` to leverage thinking mode
- **For tasks without `reasoning_effort`** or lighter tasks: Use `DEEPSEEK_CHAT_V3_2`
- **For fallback models**: Use `DEEPSEEK_CHAT_V3_2` (lighter/faster)

### Specific Mappings
- `GEMINI_2_5_FLASH_LITE` → `DEEPSEEK_CHAT_V3_2` (for lighter/faster tasks)
- `GEMINI_2_5_FLASH` → `DEEPSEEK_REASONER_V3_2` (for tasks with reasoning) or `DEEPSEEK_CHAT_V3_2` (for regular tasks)

## Implementation Steps

### 1. Update COMMON_AGENT_CONFIGS
**File**: `worker/agents/inferutils/config.ts`

Replace Gemini models in `COMMON_AGENT_CONFIGS`:
- `screenshotAnalysis`: Use `DEEPSEEK_CHAT_V3_2` (no reasoning needed)
- `realtimeCodeFixer`: Use `DEEPSEEK_CHAT_V3_2` (fast response needed)
- `fastCodeFixer`: Use `DEEPSEEK_CHAT_V3_2` (fast response needed)
- `templateSelection`: Use `DEEPSEEK_CHAT_V3_2` (simple selection task)

### 2. Update SHARED_IMPLEMENTATION_CONFIG
**File**: `worker/agents/inferutils/config.ts`

- Change `fallbackModel` from `GEMINI_2_5_FLASH` to `DEEPSEEK_CHAT_V3_2`
- Note: `reasoning_effort: 'low'` is set, so consider using `DEEPSEEK_REASONER_V3_2` for the main model

### 3. Update PLATFORM_AGENT_CONFIG
**File**: `worker/agents/inferutils/config.ts`

Replace all Gemini model references:
- `blueprint`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'high'`)
- `projectSetup`: Use `DEEPSEEK_CHAT_V3_2` (has `reasoning_effort: 'low'`, but setup is straightforward)
- `phaseGeneration`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'low'`)
- `firstPhaseImplementation`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'low'`)
- `phaseImplementation`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'low'`)
- `conversationalResponse`: Use `DEEPSEEK_CHAT_V3_2` (no reasoning needed)
- `deepDebugger`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'high'`)
- `fileRegeneration`: Use `DEEPSEEK_CHAT_V3_2` (has `reasoning_effort: 'low'`, but regeneration is straightforward)
- `agenticProjectBuilder`: Use `DEEPSEEK_REASONER_V3_2` (has `reasoning_effort: 'medium'`)

### 4. Update DEFAULT_AGENT_CONFIG
**File**: `worker/agents/inferutils/config.ts`

Apply the same replacements as PLATFORM_AGENT_CONFIG for all agent actions.

### 5. Update AGENT_CONSTRAINTS
**File**: `worker/agents/inferutils/config.ts`

Update model constraints:
- `fastCodeFixer`: Change from `GEMINI_2_5_FLASH_LITE` to `DEEPSEEK_CHAT_V3_2`
- Other constraints use `LiteModels` or `AllModels` which will automatically include DeepSeek models

### 6. Update Comments and Documentation
**File**: `worker/agents/inferutils/config.ts`

- Update comment on line 110-112 to reflect DeepSeek instead of Claude/Gemini
- Update comment on line 50-54 if needed

## Detailed Model Assignments

### Tasks Using DEEPSEEK_REASONER_V3_2 (Thinking Mode)
- `blueprint` - High reasoning effort
- `phaseGeneration` - Low reasoning effort (but benefits from thinking)
- `firstPhaseImplementation` - Low reasoning effort (but benefits from thinking)
- `phaseImplementation` - Low reasoning effort (but benefits from thinking)
- `deepDebugger` - High reasoning effort
- `agenticProjectBuilder` - Medium reasoning effort

### Tasks Using DEEPSEEK_CHAT_V3_2 (Non-Thinking Mode)
- `screenshotAnalysis` - Simple analysis
- `realtimeCodeFixer` - Fast response needed
- `fastCodeFixer` - Fast response needed
- `templateSelection` - Simple selection
- `projectSetup` - Straightforward setup
- `conversationalResponse` - Simple conversation
- `fileRegeneration` - Straightforward regeneration

### Fallback Models
All fallback models should use `DEEPSEEK_CHAT_V3_2` for faster/cheaper fallback.

## Considerations

1. **Reasoning Effort Parameter**: DeepSeek Reasoner supports thinking mode, but the `reasoning_effort` parameter might not be directly applicable (it's an OpenAI/Anthropic concept). The thinking happens automatically with `deepseek-reasoner` model.

2. **Performance**: DeepSeek Reasoner may be slower than Chat due to thinking process, so use it where reasoning is beneficial.

3. **Cost**: DeepSeek Reasoner is larger (LARGE size) vs Chat (REGULAR size), so consider cost implications.

4. **Testing**: After changes, test each agent action to ensure models work correctly.

## Files to Modify

1. `worker/agents/inferutils/config.ts` - Main configuration file with all model references

## Example Changes

### Before:
```typescript
blueprint: {
    name: AIModels.GEMINI_2_5_FLASH,
    reasoning_effort: 'high',
    max_tokens: 20000,
    fallbackModel: AIModels.GEMINI_2_5_FLASH_LITE,
    temperature: 0.25,
},
```

### After:
```typescript
blueprint: {
    name: AIModels.DEEPSEEK_REASONER_V3_2,
    reasoning_effort: 'high', // Note: May not apply to DeepSeek, but kept for consistency
    max_tokens: 20000,
    fallbackModel: AIModels.DEEPSEEK_CHAT_V3_2,
    temperature: 0.25,
},
```
