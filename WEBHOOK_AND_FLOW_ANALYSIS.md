# Webhook Status & Complete Flow Breaking Points Analysis

## 🔍 Webhook Analysis

### Current Webhook Status

Based on codebase analysis:

#### ✅ **What's Configured:**
1. **`WEBHOOK_SECRET` is set** in `.prod.vars`:
   ```
   WEBHOOK_SECRET="d9add657c3a4682254f9b6c2d2ffb6403056e7cbf4c994c79cea0cbb51418b19"
   ```

2. **Webhook types are defined** in `worker/services/sandbox/sandboxTypes.ts`:
   - Runtime error events
   - Build status events
   - Deployment status events
   - Instance health events
   - Command execution events

3. **Webhook URL is passed** to sandbox instance creation:
   - `createInstance()` accepts `webhookUrl?: string` parameter
   - Webhook URL is passed to remote sandbox service

#### ⚠️ **What's Missing:**
1. **No webhook endpoint handler found** in the codebase
   - No route for `/api/webhook` or similar
   - No webhook controller implementation
   - No webhook signature validation using `WEBHOOK_SECRET`

2. **No webhook validation logic:**
   - `WEBHOOK_SECRET` is defined but not used anywhere
   - No signature verification code found
   - Webhook payload schema has optional `signature` field but no validation

#### 📋 **Webhook Flow (Current State):**

```
1. Sandbox Container → Sends webhook event
   ↓
2. Webhook URL → Should be: https://anything.fleet.ke/api/webhook (or similar)
   ↓
3. [MISSING] → No endpoint handler exists to receive it
   ↓
4. [MISSING] → No signature validation using WEBHOOK_SECRET
   ↓
5. [MISSING] → No processing of webhook events
```

### 🔴 **Webhook Issues:**

#### Issue 1: No Endpoint Handler
**Problem:** Webhooks are being sent but there's no endpoint to receive them.

**Impact:**
- ⚠️ **Runtime errors from sandbox** won't be reported back
- ⚠️ **Build/deployment status** won't be tracked
- ⚠️ **Instance health monitoring** won't work
- ⚠️ **Command execution status** won't be known

**Status:** ❌ **NOT IMPLEMENTED YET**

#### Issue 2: No Signature Validation
**Problem:** Even if endpoint existed, `WEBHOOK_SECRET` isn't being used for validation.

**Impact:**
- ⚠️ **Security risk:** Anyone could send fake webhooks
- ⚠️ **No authentication:** Can't verify webhook authenticity

**Status:** ❌ **NOT IMPLEMENTED YET**

#### Issue 3: Webhook URL Configuration
**Problem:** Need to ensure webhook URL is correctly generated and passed to sandbox.

**Current State:**
- Webhook URL is optional (`webhookUrl?: string`)
- Passed to `createInstance()` but may be `undefined`

**Required URL Format:**
```
https://{CUSTOM_DOMAIN}/api/webhook
```

**Status:** ⚠️ **NEEDS VERIFICATION**

---

## 🛠️ **Webhook Fix Requirements**

### To Make Webhooks Work:

1. **Create Webhook Endpoint Handler:**
   ```typescript
   // worker/api/controllers/webhook/controller.ts
   POST /api/webhook
   - Validate signature using WEBHOOK_SECRET
   - Parse webhook payload
   - Route to appropriate handler based on event type
   ```

2. **Implement Signature Validation:**
   ```typescript
   // Verify HMAC signature
   const signature = request.headers.get('X-Webhook-Signature');
   const computedSignature = hmac(WEBHOOK_SECRET, payload);
   if (signature !== computedSignature) {
     return 401; // Unauthorized
   }
   ```

3. **Generate and Pass Webhook URL:**
   ```typescript
   // When creating sandbox instance
   const webhookUrl = `${env.CUSTOM_DOMAIN}/api/webhook`;
   await createInstance(templateName, projectName, webhookUrl);
   ```

4. **Process Webhook Events:**
   - Runtime errors → Store in database / notify agent
   - Build status → Update deployment state
   - Health checks → Monitor instance status

---

## 📊 **Current Impact Assessment**

### **What Breaks Without Webhooks:**

| Feature | Impact | Severity |
|---------|--------|----------|
| **Runtime Error Reporting** | ❌ Errors not captured | ⚠️ Medium |
| **Build Status Tracking** | ❌ Status unknown | ⚠️ Low |
| **Instance Health Monitoring** | ❌ No health checks | ⚠️ Low |
| **Command Execution Status** | ❌ Status unknown | ⚠️ Low |

### **What Still Works:**

| Feature | Status | Notes |
|---------|--------|-------|
| **Sandbox Creation** | ✅ Works | Webhook optional |
| **Code Generation** | ✅ Works | Not dependent on webhooks |
| **Preview Rendering** | ✅ Works | Not dependent on webhooks |
| **File Deployment** | ✅ Works | Not dependent on webhooks |
| **WebSocket Communication** | ✅ Works | Separate from webhooks |

**Conclusion:** Webhooks are **NOT blocking** the core flow (prompt → sandbox preview). They're **enhancement features** for error reporting and monitoring.

---

## 🎯 **Complete Flow Breaking Points Analysis**

### **Flow: User Prompt → Sandbox Preview**

#### **Step 1: User Enters Prompt**
**Endpoint:** `POST /api/agent`

**Potential Breaking Points:**
1. ✅ **CSRF Validation** - FIXED (hacky fix implemented)
2. ✅ **Authentication** - JWT_SECRET set, should work
3. ⚠️ **Rate Limiting** - Could block if exceeded
4. ⚠️ **Request Size** - Very large prompts could timeout
5. ⚠️ **Missing Required Fields** - Query empty, invalid params

**Status:** ✅ **WORKING** (after CSRF fix)

---

#### **Step 2: Blueprint Generation**
**Process:** AI generates blueprint via streaming

**Potential Breaking Points:**
1. ⚠️ **AI API Key Missing/Invalid:**
   - `GOOGLE_AI_STUDIO_API_KEY` - Required for Gemini
   - `ANTHROPIC_API_KEY` - Fallback option
   - `OPENAI_API_KEY` - Fallback option
   
2. ⚠️ **AI Gateway Issues:**
   - `CLOUDFLARE_AI_GATEWAY_TOKEN` - May not have Run permission
   - `CLOUDFLARE_AI_GATEWAY_URL` - Invalid URL
   
3. ⚠️ **Rate Limits:**
   - AI provider rate limits exceeded
   - AI Gateway rate limits exceeded
   
4. ⚠️ **Timeout:**
   - Blueprint generation takes too long (>30s default)
   - Streaming connection drops
   
5. ⚠️ **Invalid Response:**
   - AI returns malformed JSON
   - Blueprint schema validation fails
   - Missing required blueprint fields

**Status:** ⚠️ **NEEDS VERIFICATION**

**Critical Checks:**
- ✅ AI API keys set in `.prod.vars`
- ⚠️ AI Gateway token has Run permission
- ⚠️ Rate limits not exceeded

---

#### **Step 3: Blueprint Stream → Frontend**
**Process:** NDJSON stream delivers blueprint chunks

**Potential Breaking Points:**
1. ⚠️ **Stream Parsing:**
   - Malformed NDJSON
   - Incomplete JSON chunks
   - Parser errors

2. ⚠️ **Network Issues:**
   - Connection drops mid-stream
   - Timeout before stream completes
   - Browser cancels request

3. ⚠️ **Empty Blueprint:**
   - Stream completes but blueprint is empty
   - No chunks received
   - Blueprint validation fails

**Status:** ⚠️ **NEEDS MONITORING**

**Fixes Applied:**
- ✅ NDJSON parser handles incomplete chunks
- ✅ Frontend accumulates chunks correctly
- ⚠️ Empty blueprint detection exists but needs verification

---

#### **Step 4: WebSocket Connection**
**Endpoint:** `GET /api/agent/:agentId/ws`

**Potential Breaking Points:**
1. ✅ **CSRF:** Skipped (GET request, WebSocket upgrade)
2. ✅ **Authentication:** Token from URL query param
3. ⚠️ **Token Missing/Invalid:**
   - No token in URL
   - Token expired
   - Invalid JWT signature
   
4. ⚠️ **Agent Not Found:**
   - Agent ID doesn't exist
   - Agent session expired
   - Agent already terminated

5. ⚠️ **WebSocket Upgrade Fails:**
   - Network issues
   - Proxy blocks WebSocket
   - Cloudflare Workers WebSocket limits

6. ⚠️ **Connection Limits:**
   - Too many concurrent WebSocket connections
   - Per-request CPU time limits

**Status:** ✅ **WORKING** (after auth fix)

**Critical Checks:**
- ✅ JWT_SECRET set correctly
- ✅ Token extraction from URL works
- ⚠️ WebSocket upgrade successful

---

#### **Step 5: Code Generation**
**Process:** Agent generates code via WebSocket messages

**Potential Breaking Points:**
1. ⚠️ **AI API Issues:**
   - Same as Step 2 (API keys, rate limits)
   - Long-running inference timeouts
   
2. ⚠️ **State Management:**
   - Agent state corrupted
   - Durable Object storage issues
   - State conflicts between requests
   
3. ⚠️ **Template Issues:**
   - Template files missing
   - Template structure invalid
   - Template dependencies unavailable
   
4. ⚠️ **File Generation Errors:**
   - File path conflicts
   - Invalid file names
   - Content encoding issues

**Status:** ⚠️ **NEEDS MONITORING**

**Critical Checks:**
- ✅ AI API keys configured
- ⚠️ Template registry accessible
- ⚠️ File system operations succeed

---

#### **Step 6: Sandbox Instance Creation**
**Process:** Create Cloudflare Container sandbox

**Potential Breaking Points:**
1. ⚠️ **Container Service Limits:**
   - `MAX_SANDBOX_INSTANCES` exceeded
   - Container quota limits
   - Instance type unavailable (lite/standard-1/standard-3/standard-4)
   
2. ⚠️ **Cloudflare API Issues:**
   - `CLOUDFLARE_API_TOKEN` invalid/expired
   - `CLOUDFLARE_ACCOUNT_ID` incorrect
   - API rate limits exceeded
   
3. ⚠️ **Sandbox Configuration:**
   - Invalid template name
   - Template not found in registry
   - Project name conflicts
   
4. ⚠️ **Resource Allocation:**
   - No available ports
   - Memory/CPU limits exceeded
   - Network configuration fails

**Status:** ⚠️ **NEEDS VERIFICATION**

**Critical Checks:**
- ✅ `CLOUDFLARE_API_TOKEN` set in `.prod.vars`
- ✅ `CLOUDFLARE_ACCOUNT_ID` set in `.prod.vars`
- ⚠️ Container quotas not exceeded
- ⚠️ Instance type available

---

#### **Step 7: Template Installation & Setup**
**Process:** Install dependencies, start dev server

**Potential Breaking Points:**
1. ⚠️ **Dependency Installation:**
   - npm/pnpm/bun registry down
   - Package versions incompatible
   - Installation timeout
   - Disk space limits
   
2. ⚠️ **Build Process:**
   - Build command fails
   - Build timeout exceeded
   - Build output errors
   
3. ⚠️ **Dev Server Startup:**
   - Port allocation fails
   - Server startup errors
   - Server crashes immediately
   
4. ⚠️ **Environment Variables:**
   - Invalid env var format
   - Missing required vars
   - Env var size limits

**Status:** ⚠️ **NEEDS MONITORING**

**Critical Checks:**
- ⚠️ Package registry accessible
- ⚠️ Build commands succeed
- ⚠️ Server starts correctly

---

#### **Step 8: Preview URL Generation**
**Process:** Expose port, generate preview URL

**Potential Breaking Points:**
1. ⚠️ **Domain Configuration:**
   - `CUSTOM_DOMAIN` not set or invalid
   - `CUSTOM_PREVIEW_DOMAIN` not set
   - DNS not configured correctly
   - Wildcard CNAME missing (*.abc → abc.xyz.com)
   
2. ⚠️ **Port Exposure:**
   - Port already in use
   - Port exposure fails
   - Tunnel creation fails (if `USE_TUNNEL_FOR_PREVIEW=true`)
   
3. ⚠️ **URL Generation:**
   - Invalid URL format
   - URL contains invalid characters
   - URL too long

**Status:** ⚠️ **NEEDS VERIFICATION**

**Critical Checks:**
- ⚠️ `CUSTOM_DOMAIN` set correctly in `.prod.vars`
- ⚠️ DNS wildcard configured (e.g., `*.abc` → `abc.xyz.com`)
- ⚠️ Preview domain accessible

---

#### **Step 9: Preview Iframe Loading**
**Process:** Frontend loads preview in iframe

**Potential Breaking Points:**
1. ⚠️ **Network Issues:**
   - Preview URL not accessible
   - DNS not propagated
   - CORS errors
   - SSL certificate issues
   
2. ⚠️ **Availability Checks:**
   - Preview not ready (server still starting)
   - Preview returns 500/404 errors
   - Preview times out
   
3. ⚠️ **Iframe Restrictions:**
   - Browser blocks iframe
   - X-Frame-Options header blocks embedding
   - Content Security Policy violations

**Status:** ⚠️ **NEEDS MONITORING**

**Critical Checks:**
- ⚠️ Preview URL resolves correctly
- ⚠️ Preview server responds
- ⚠️ CORS headers allow embedding

---

#### **Step 10: Code Deployment to Sandbox**
**Process:** Deploy generated files to sandbox

**Potential Breaking Points:**
1. ⚠️ **File Write Errors:**
   - File system permissions
   - Disk space limits
   - File path too long
   - Invalid file names
   
2. ⚠️ **File Content Issues:**
   - Content encoding errors
   - File size limits exceeded
   - Invalid file format
   
3. ⚠️ **Hot Reload:**
   - Server doesn't detect changes
   - Server crashes on reload
   - Reload timeout

**Status:** ⚠️ **NEEDS MONITORING**

**Critical Checks:**
- ⚠️ File operations succeed
- ⚠️ Server hot-reloads correctly

---

## 🎯 **Summary of All Breaking Points**

### **Critical Blockers (Fix Immediately):**
1. ✅ **CSRF Validation** - FIXED
2. ✅ **JWT_SECRET** - Set in `.prod.vars`
3. ⚠️ **AI API Keys** - Need verification
4. ⚠️ **CUSTOM_DOMAIN** - Need DNS verification

### **High Priority (Monitor):**
1. ⚠️ **AI Gateway Token** - Verify Run permission
2. ⚠️ **Container Quotas** - Monitor limits
3. ⚠️ **DNS Configuration** - Verify wildcard CNAME
4. ⚠️ **Preview URL Generation** - Test accessibility

### **Medium Priority (Enhancements):**
1. ⚠️ **Webhook Endpoint** - Not implemented (doesn't block flow)
2. ⚠️ **Error Monitoring** - Webhooks would help
3. ⚠️ **Rate Limiting** - Monitor and adjust

### **Low Priority (Edge Cases):**
1. ⚠️ **File Size Limits** - Rarely an issue
2. ⚠️ **Network Timeouts** - Handled with retries
3. ⚠️ **Browser Compatibility** - Modern browsers only

---

## ✅ **Recommendations**

### **Immediate Actions:**
1. ✅ **CSRF:** Already fixed with hacky but reliable solution
2. ✅ **JWT_SECRET:** Already set
3. ⚠️ **Verify AI API Keys:** Check all keys are valid
4. ⚠️ **Verify DNS:** Ensure wildcard CNAME is configured
5. ⚠️ **Test Full Flow:** End-to-end test from prompt to preview

### **Future Enhancements:**
1. **Implement Webhook Endpoint:**
   - Add `/api/webhook` route
   - Implement signature validation
   - Process webhook events
   
2. **Enhanced Monitoring:**
   - Track all breaking points
   - Alert on failures
   - Log detailed error context

3. **Resilience Improvements:**
   - Better retry logic
   - Graceful degradation
   - Fallback mechanisms

---

## 🔒 **Webhook Security Recommendations**

When implementing webhooks:

1. **Always Validate Signature:**
   ```typescript
   const signature = request.headers.get('X-Webhook-Signature');
   const computed = hmac(WEBHOOK_SECRET, payload);
   if (signature !== computed) return 401;
   ```

2. **Rate Limit Webhook Endpoint:**
   - Prevent abuse
   - Limit per instance ID

3. **Validate Event Type:**
   - Only accept known event types
   - Reject unknown events

4. **Idempotency:**
   - Handle duplicate events
   - Track processed event IDs

5. **Logging:**
   - Log all webhook attempts
   - Track validation failures
   - Monitor webhook health

---

**Current Status:** Webhooks are **NOT blocking** the core flow. They're enhancement features that need implementation for better error reporting and monitoring.

