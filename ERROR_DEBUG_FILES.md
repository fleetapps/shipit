# 401 Unauthorized Error (Code 2009) - Debug File List

## Error Details
- **Error**: `401 [{"code":2009,"message":"Unauthorized"}]`
- **Endpoint**: `POST /api/agent`
- **Source**: Cloudflare AI Gateway authentication failure
- **Error Code 2009**: Cloudflare AI Gateway authentication error

## Exact Files Involved in Error Flow

### 1. Route Definition
**File**: `worker/api/routes/codegenRoutes.ts`
- **Line 16**: Route handler registration
```typescript
app.post('/api/agent', setAuthLevel(AuthConfig.authenticated), adaptController(CodingAgentController, CodingAgentController.startCodeGeneration));
```

### 2. Controller Entry Point
**File**: `worker/api/controllers/agent/controller.ts`
- **Lines 36-173**: `startCodeGeneration()` method
  - **Line 66**: User authentication check
  - **Line 78-85**: Agent initialization
  - **Line 137-148**: Calls `agentInstance.initialize()` which triggers inference

### 3. AI Gateway Configuration
**File**: `worker/agents/inferutils/core.ts`
- **Lines 189-214**: `buildGatewayUrl()` - Builds AI Gateway URL
  - Checks `env.CLOUDFLARE_AI_GATEWAY_URL`
  - Falls back to `env.AI.gateway(env.CLOUDFLARE_AI_GATEWAY)`
  
- **Lines 227-257**: `getApiKey()` - Retrieves API key for provider
  - Checks provider-specific env vars (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
  - Falls back to `env.CLOUDFLARE_AI_GATEWAY_TOKEN`
  - **Line 252-254**: Validation and fallback logic
  
- **Lines 259-308**: `getConfigurationForModel()` - Main configuration function
  - **Line 292**: Calls `buildGatewayUrl()`
  - **Line 298**: Calls `getApiKey()`
  - **Lines 300-302**: Sets `defaultHeaders` with `cf-aig-authorization` if using AI Gateway token

### 4. Inference Call (Where Error is Thrown)
**File**: `worker/agents/inferutils/core.ts`
- **Lines 507-512**: Gets configuration and creates OpenAI client
  ```typescript
  const { apiKey, baseURL, defaultHeaders } = await getConfigurationForModel(modelName, env, metadata.userId);
  const client = new OpenAI({ apiKey, baseURL: baseURL, defaultHeaders });
  ```

- **Lines 592-612**: Makes request to AI Gateway
  ```typescript
  response = await client.chat.completions.create({
      // ... config
  }, {
      signal: abortSignal,
      headers: {
          "cf-aig-metadata": JSON.stringify({
              chatId: metadata.agentId,
              userId: metadata.userId,
              schemaName,
              actionKey,
          })
      }
  });
  ```

- **Lines 614-637**: Error handling (where error is caught and re-thrown)
  - **Line 624**: Logs error message (this is where your error format appears)
  - **Line 636**: Re-throws the error: `throw error;`

### 5. Agent Orchestration
**File**: `worker/agents/core/simpleGeneratorAgent.ts`
- **Lines 137-148**: `initialize()` method calls various operations
- Operations like `generateBlueprint()`, `PhaseGenerationOperation`, `PhaseImplementationOperation` all eventually call `infer()`

### 6. Error Propagation
**File**: `worker/agents/inferutils/infer.ts`
- **Lines 143-178**: `executeInference()` error handling
  - **Line 155-158**: Logs error
  - Retries with exponential backoff
  - **Line 180**: Returns `null` if all retries fail

## Root Cause Analysis

The error `401 [{"code":2009,"message":"Unauthorized"}]` indicates:

1. **AI Gateway Authentication Failure**: The request to Cloudflare AI Gateway is being rejected
2. **⚠️ IDENTIFIED ISSUE**: In `.prod.vars` line 12, `CLOUDFLARE_AI_GATEWAY_TOKEN=""` is **EMPTY**
   - This is the primary cause of the 401 error
   - AI Gateway requires authentication, and without a token, all requests are rejected
3. **Other Possible Causes**:
   - Missing or invalid provider API key (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)
   - AI Gateway not properly configured
   - Token expired or revoked
   - Incorrect `CLOUDFLARE_AI_GATEWAY` binding name

## Debug Checklist

### Environment Variables to Check:
1. `CLOUDFLARE_AI_GATEWAY_TOKEN` - AI Gateway authentication token
2. `CLOUDFLARE_AI_GATEWAY` - AI Gateway name/binding
3. `CLOUDFLARE_AI_GATEWAY_URL` - Optional direct URL override
4. Provider API keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_STUDIO_API_KEY`)

### Code Locations to Add Debug Logging:
1. **`worker/agents/inferutils/core.ts:249`** - Log API key lookup
2. **`worker/agents/inferutils/core.ts:292`** - Log gateway URL
3. **`worker/agents/inferutils/core.ts:507`** - Log final configuration before API call
4. **`worker/agents/inferutils/core.ts:624`** - Enhanced error logging (already present)

## Quick Fix Steps

1. **⚠️ FIX REQUIRED: Set AI Gateway Token**:
   - **File**: `.prod.vars` line 12
   - **Current**: `CLOUDFLARE_AI_GATEWAY_TOKEN=""` (EMPTY)
   - **Action**: Set a valid AI Gateway token
   - **How to get token**:
     ```bash
     # Option 1: Generate via Cloudflare Dashboard
     # Go to: https://dash.cloudflare.com → AI Gateway → Your Gateway → Settings → Authentication
     
     # Option 2: Use Cloudflare API (requires API token with AI Gateway permissions)
     curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai-gateway/{gateway_id}/tokens" \
       -H "Authorization: Bearer YOUR_API_TOKEN" \
       -H "Content-Type: application/json"
     ```
   - **Update `.prod.vars`**:
     ```bash
     CLOUDFLARE_AI_GATEWAY_TOKEN="your-actual-token-here"
     ```

2. **Verify AI Gateway Token** (after setting):
   ```bash
   # Check if token is set
   echo $CLOUDFLARE_AI_GATEWAY_TOKEN
   ```

2. **Check AI Gateway Configuration**:
   - Verify gateway exists in Cloudflare dashboard
   - Check if authentication is enabled
   - Verify token has correct permissions

3. **Verify Provider API Keys**:
   - Check if provider-specific API keys are set
   - Verify keys are valid and not expired

4. **Check Wrangler Configuration**:
   - Verify `wrangler.jsonc` has correct `CLOUDFLARE_AI_GATEWAY` binding
   - Check environment variables are set in production

## Related Files (For Context)

- `wrangler.jsonc` - Cloudflare Workers configuration
- `.prod.vars` - Production environment variables
- `scripts/deploy.ts` - Deployment script that sets up AI Gateway
- `scripts/setup.ts` - Setup script for AI Gateway

---

# 404 Model Not Found Error - Debug File List

## Error Details
- **Error**: `404 model: claude-3-5-sonnet-latest`
- **Endpoint**: `POST /api/agent`
- **Source**: Cloudflare AI Gateway model lookup failure
- **Model**: `anthropic/claude-3-5-sonnet-latest`

## Root Cause

The error occurs because:

1. **Provider Prefix Issue**: The model name `anthropic/claude-3-5-sonnet-latest` includes the provider prefix, but AI Gateway expects just the model name (`claude-3-5-sonnet-latest`) when using the `/compat` endpoint.

2. **Model Deprecation (Possible)**: The model `claude-3-5-sonnet-latest` may be deprecated. Anthropic deprecated Claude Sonnet 3.5 models in August 2025, with retirement on October 22, 2025.

## Fix Applied

**File**: `worker/agents/inferutils/core.ts`
**Lines**: 511-518

Added code to strip the provider prefix from model names before sending to AI Gateway:

```typescript
// Remove [*.] from model name
modelName = modelName.replace(/\[.*?\]/, '');

// Strip provider prefix (e.g., "anthropic/claude-3-5-sonnet-latest" -> "claude-3-5-sonnet-latest")
// AI Gateway expects just the model name, not the provider prefix
if (modelName.includes('/')) {
    const parts = modelName.split('/');
    if (parts.length > 1) {
        modelName = parts.slice(1).join('/');
    }
}
```

## Alternative Solutions

### Option 1: Update to Newer Model (Recommended)
If the model is deprecated, update the configuration to use a newer model:

**File**: `worker/agents/inferutils/config.ts`
- **Line 72**: Change `AIModels.CLAUDE_3_5_SONNET_LATEST` to `AIModels.CLAUDE_4_SONNET` or `AIModels.CLAUDE_3_7_SONNET_20250219`

### Option 2: Use Direct Anthropic API
If you want to bypass AI Gateway for Anthropic models, you can use the `[claude]` provider override format in model names, which routes directly to Anthropic's API.

### Option 3: Verify Model Availability
Check if the model is available in your AI Gateway:
1. Go to Cloudflare Dashboard → AI Gateway
2. Check the Models section
3. Verify `claude-3-5-sonnet-latest` is listed and enabled

## Files Involved

1. **`worker/agents/inferutils/core.ts`** (Lines 507-518) - Model name processing
2. **`worker/agents/inferutils/config.ts`** (Line 72) - Model configuration
3. **`worker/agents/inferutils/config.types.ts`** (Line 27) - Model enum definition

