# End-to-End Flow Analysis: Prompt → Sandbox Rendering

## 🔍 Complete Flow Trace

### Step 1: User Enters Prompt → Agent Session Creation
**Endpoint:** `POST /api/agent`
- **CSRF Required:** ✅ YES (POST request)
- **Auth Required:** ✅ YES (`AuthConfig.authenticated`)
- **Blocks Flow:** ✅ **CRITICAL BLOCKER** - This is the only POST that starts everything
- **Status with CSRF bypass:** ✅ Will work

### Step 2: Blueprint Generation → HTTP Stream
**Endpoint:** Streaming response from `POST /api/agent`
- **CSRF Required:** ❌ NO (already passed, streaming response)
- **Auth Required:** ✅ YES (inherited from POST)
- **Blocks Flow:** ❌ No - streaming happens after session creation
- **Status with CSRF bypass:** ✅ Will work

### Step 3: Blueprint Display → UI Rendering
**Action:** Frontend renders blueprint from stream
- **CSRF Required:** ❌ NO (no API calls)
- **Auth Required:** ❌ NO (client-side)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

### Step 4: WebSocket Connection
**Endpoint:** `GET /api/agent/:agentId/ws`
- **CSRF Required:** ❌ NO (GET request, CSRF middleware skips GET)
- **WebSocket Upgrade:** ✅ Skipped by CSRF middleware (line 38-42)
- **Auth Required:** ✅ YES (`AuthConfig.ownerOnly`)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work (already works)

### Step 5: Code Generation → WebSocket Messages
**Communication:** WebSocket messages (no HTTP requests)
- **CSRF Required:** ❌ NO (WebSocket bypasses HTTP CSRF)
- **Auth Required:** ✅ YES (WebSocket validates token from URL)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

### Step 6: Sandbox Deployment → WebSocket Messages
**Communication:** WebSocket messages (`PREVIEW` message)
- **CSRF Required:** ❌ NO (WebSocket)
- **Auth Required:** ✅ YES (WebSocket auth)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

### Step 7: Sandbox Preview URL → GET Request
**Endpoint:** GET to sandbox URL (e.g., `https://3000-abc-xyz.anything.fleet.ke/`)
- **CSRF Required:** ❌ NO (GET request, handled by `handleUserAppRequest`)
- **Auth Required:** ❌ NO (sandbox requests bypass main app middleware)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

### Step 8: Preview Iframe → HEAD Request
**Endpoint:** HEAD request to preview URL
- **CSRF Required:** ❌ NO (HEAD request)
- **Auth Required:** ❌ NO (sandbox requests)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

### Step 9: User Follow-up Prompts → WebSocket Messages
**Communication:** WebSocket messages
- **CSRF Required:** ❌ NO (WebSocket)
- **Auth Required:** ✅ YES (WebSocket auth)
- **Blocks Flow:** ❌ No
- **Status with CSRF bypass:** ✅ Will work

---

## 🎯 Critical Finding

**ONLY ONE ENDPOINT BLOCKS THE FLOW:**
- ✅ `POST /api/agent` - Create agent session

**All other endpoints:**
- ❌ GET requests (no CSRF validation)
- ❌ WebSocket (explicitly skipped)
- ❌ Sandbox requests (separate routing)

---

## ✅ CSRF Bypass Impact Analysis

### **With CSRF Bypass in Dev:**

1. ✅ **POST /api/agent** - Will work (no CSRF check)
2. ✅ **Blueprint stream** - Will work (already works)
3. ✅ **Blueprint display** - Will work (client-side)
4. ✅ **WebSocket connection** - Will work (already works, GET request)
5. ✅ **Code generation** - Will work (WebSocket messages)
6. ✅ **Sandbox deployment** - Will work (WebSocket messages)
7. ✅ **Sandbox preview** - Will work (GET request)
8. ✅ **Preview rendering** - Will work (GET/HEAD requests)
9. ✅ **Follow-up prompts** - Will work (WebSocket messages)

### **Authentication Status:**
- ✅ Authentication is **separate** from CSRF
- ✅ Auth middleware runs **after** CSRF middleware
- ✅ Skipping CSRF **does not affect** authentication
- ✅ All auth-protected routes will still require login

---

## 🔒 Security Analysis

### **In Development (with bypass):**
- ✅ Authentication still required
- ✅ Rate limiting still active
- ✅ Authorization checks still active
- ⚠️ CSRF protection disabled (acceptable for dev)

### **In Production (no bypass):**
- ✅ Full CSRF protection enabled
- ✅ Full authentication required
- ✅ All security measures active

---

## ⚠️ Potential Issues Check

### Issue 1: Authentication Required for POST /api/agent
- **Status:** ✅ Not a problem
- **Reason:** Auth is separate from CSRF, will still be enforced

### Issue 2: WebSocket Authentication
- **Status:** ✅ Not a problem
- **Reason:** WebSocket uses token from URL query param, doesn't depend on CSRF

### Issue 3: Sandbox Routing
- **Status:** ✅ Not a problem
- **Reason:** Sandbox requests go through `handleUserAppRequest`, bypass main app middleware

### Issue 4: Preview Iframe CORS
- **Status:** ✅ Not a problem
- **Reason:** Uses GET/HEAD requests, no CSRF validation

---

## 📋 Implementation Safety Checklist

- ✅ Only bypasses CSRF (not authentication)
- ✅ Only in development environment
- ✅ Production fully protected
- ✅ No breaking changes to existing code
- ✅ Easy to remove later
- ✅ All other security measures intact

---

## 🎯 Conclusion

**✅ SAFE TO IMPLEMENT:**
- Option 1 (dev-only CSRF bypass) will **unblock the entire flow**
- **Only 1 endpoint** (POST /api/agent) is affected by CSRF
- **All other steps** are already CSRF-safe (GET/WebSocket)
- **Authentication remains** fully functional
- **No breaking points** in the flow

**Recommended:** Implement Option 1 immediately to unblock development.

