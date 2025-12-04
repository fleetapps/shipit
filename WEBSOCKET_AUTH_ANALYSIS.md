# WebSocket Authentication Issue Analysis

## 🔍 Problem Identified

### **Root Cause**
The WebSocket route is configured as `public` (allowing anonymous users), but the handler **explicitly rejects anonymous users** with a 401 error.

### **Code Evidence**

**Route Configuration** (`worker/api/routes/codegenRoutes.ts:24`):
```typescript
app.get('/api/agent/:agentId/ws', setAuthLevel(AuthConfig.public), ...)
```
✅ Route is set to `public` - should allow anonymous users

**Handler Logic** (`worker/api/controllers/agent/controller.ts:214-217`):
```typescript
const user = context.user!;
if (!user) {
    return CodingAgentController.createErrorResponse('Missing user', 401);
}
```
❌ Handler rejects if no user exists - **CONFLICT!**

### **Error Flow**

1. User creates agent session (anonymous - no login)
2. Blueprint generation completes successfully
3. Frontend attempts WebSocket connection to `/api/agent/:agentId/ws`
4. Route auth middleware allows request (route is `public`)
5. Handler receives request but `context.user` is `null` (anonymous user)
6. Handler returns `401 Missing user` - **Connection fails**
7. Frontend retries 6 times, all fail
8. HTTP fallback also fails due to similar issue

### **User's Logs Evidence**

```
⚠️ No authentication token found in cookies or localStorage
📋 Full cookie string: _ga=...; sidebar_state=false
⚠️ No authentication token found in cookies, WebSocket may fail authentication
WebSocket connection to 'wss://anything.fleet.ke/api/agent/.../ws' failed
💥 WebSocket connection failed permanently after 6 attempts
```

**Confirmed:** User is anonymous (no `accessToken` cookie), so `context.user` is `null`.

---

## 🎯 Solution Strategy

### **Option 1: Allow Anonymous Users with Time-Based Verification** (Recommended)

For anonymous users accessing a WebSocket:
1. ✅ Allow connection if agent was created recently (< 1 hour ago)
2. ✅ Verify agent exists and is accessible
3. ✅ Log connection for rate limiting/security

**Benefits:**
- Supports anonymous user flow (main goal)
- Still provides security via time-based window
- Allows users to see their generated app without login

### **Option 2: Require Authentication for WebSocket**

Change route from `public` to `authenticated`:
- ❌ Breaks anonymous user flow
- ✅ More secure
- ❌ Users must login before seeing their generated app

### **Option 3: Session-Based Anonymous Access**

Store session token during agent creation:
- More complex implementation
- Better long-term solution
- Requires session token tracking

---

## 🔧 Implementation Plan

### **Step 1: Modify WebSocket Handler**

Remove hard user requirement and add anonymous user support:

```typescript
static async handleWebSocketConnection(...) {
    // ... existing validation ...
    
    const user = context.user; // Optional, don't require
    
    // For anonymous users, verify agent was created recently
    if (!user) {
        const canAccess = await this.verifyAnonymousAccess(chatId, env);
        if (!canAccess) {
            return CodingAgentController.createErrorResponse(
                'Anonymous access expired. Please log in or reconnect within 1 hour of creation.',
                401
            );
        }
    }
    
    // Continue with connection...
}
```

### **Step 2: Add Anonymous Access Verification**

```typescript
private static async verifyAnonymousAccess(
    agentId: string,
    env: Env
): Promise<boolean> {
    try {
        const appService = new AppService(env);
        const app = await appService.getAppDetails(agentId, null);
        
        if (!app) {
            return false; // Agent doesn't exist
        }
        
        // Check if agent was created recently (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const createdAt = app.createdAt?.getTime() || 0;
        
        // Allow if: anonymous user (userId is null) AND created recently
        return !app.userId && createdAt > oneHourAgo;
    } catch (error) {
        this.logger.error('Error verifying anonymous access', error);
        return false;
    }
}
```

### **Step 3: Update Logging**

Add logging to track anonymous vs authenticated connections:
```typescript
this.logger.info(`WebSocket connection request for chat: ${chatId}`, {
    userId: user?.id || 'anonymous',
    isAnonymous: !user
});
```

---

## 📋 Verification Steps

After fix:
1. ✅ Anonymous user creates agent session
2. ✅ Blueprint generation completes
3. ✅ WebSocket connection succeeds (agent created < 1 hour ago)
4. ✅ Code generation starts via WebSocket
5. ✅ Preview renders successfully

---

## 🔒 Security Considerations

### **Time Window (1 hour)**
- Limits anonymous access to recently created agents
- Prevents indefinite anonymous access
- Users can still login for permanent access

### **Agent Existence Check**
- Verifies agent exists before allowing connection
- Prevents accessing non-existent agents

### **Origin Validation**
- Already implemented via `validateWebSocketOrigin()`
- Prevents cross-origin attacks

---

## 🚨 Edge Cases

1. **Agent older than 1 hour:**
   - Anonymous users get 401 with helpful message
   - Prompt to login for permanent access

2. **Agent belongs to authenticated user:**
   - Normal ownership check applies
   - Only owner can connect

3. **Agent doesn't exist:**
   - Returns 404 (already handled)

---

## ✅ Expected Outcome

After fix:
- ✅ Anonymous users can connect to WebSocket for recently created agents
- ✅ Authenticated users still work normally
- ✅ Security maintained via time-based verification
- ✅ Clear error messages for expired anonymous access

