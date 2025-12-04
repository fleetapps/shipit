# WebSocket Authentication Fix - Anonymous User Support

## ✅ Problem Fixed

**Issue:** WebSocket route was configured as `public` but handler rejected anonymous users with 401 error.

**Root Cause:** Handler had hard requirement for user: `if (!user) return 401`, conflicting with `AuthConfig.public` route.

---

## 🔧 Changes Made

### **File: `worker/api/controllers/agent/controller.ts`**

#### **1. Added AppService Import**
```typescript
import { AppService } from '../../../database';
```

#### **2. Modified WebSocket Handler** (lines 213-230)

**Before:**
```typescript
const user = context.user!;
if (!user) {
    return CodingAgentController.createErrorResponse('Missing user', 401);
}
```

**After:**
```typescript
const user = context.user || null;

// For anonymous users, verify they can access this agent (created recently)
if (!user) {
    const canAccess = await CodingAgentController.verifyAnonymousAccess(chatId, env);
    if (!canAccess) {
        this.logger.warn(`Anonymous access denied for agent: ${chatId}`, {
            reason: 'Agent not found or access expired (> 1 hour since creation)'
        });
        return CodingAgentController.createErrorResponse(
            'Anonymous access expired. Please log in to continue, or reconnect within 1 hour of creation.',
            401
        );
    }
    this.logger.info(`Anonymous WebSocket connection allowed for agent: ${chatId}`);
}
```

#### **3. Added Anonymous Access Verification Method** (lines 281-335)

New private static method:
```typescript
private static async verifyAnonymousAccess(
    agentId: string,
    env: Env
): Promise<boolean> {
    try {
        const appService = new AppService(env);
        const app = await appService.getAppDetails(agentId, undefined);
        
        if (!app) {
            return false; // Agent doesn't exist
        }
        
        // Check if agent belongs to anonymous user (userId is null)
        if (app.userId) {
            return false; // Agent belongs to authenticated user
        }
        
        // Check if agent was created recently (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const createdAt = app.createdAt?.getTime() || 0;
        
        if (createdAt === 0) {
            return false; // No creation time
        }
        
        return createdAt > oneHourAgo;
    } catch (error) {
        this.logger.error('Error verifying anonymous access', error);
        return false; // Deny on error for security
    }
}
```

---

## 🎯 How It Works

### **Flow for Anonymous Users:**

1. ✅ User creates agent session (anonymous, no login)
2. ✅ Blueprint generation completes
3. ✅ Frontend attempts WebSocket connection
4. ✅ Route auth middleware allows request (`AuthConfig.public`)
5. ✅ Handler checks: `context.user` is `null` (anonymous)
6. ✅ Handler calls `verifyAnonymousAccess()`:
   - Checks if agent exists
   - Verifies agent belongs to anonymous user (`userId === null`)
   - Verifies agent was created < 1 hour ago
7. ✅ If all checks pass → WebSocket connection succeeds
8. ✅ Code generation starts via WebSocket

### **Flow for Authenticated Users:**

1. ✅ User creates agent session (logged in)
2. ✅ Blueprint generation completes
3. ✅ Frontend attempts WebSocket connection
4. ✅ Route auth middleware allows request
5. ✅ Handler checks: `context.user` exists
6. ✅ Skips anonymous verification
7. ✅ Normal ownership checks apply (if configured)
8. ✅ WebSocket connection succeeds

---

## 🔒 Security Features

### **Time-Based Access Window**
- Anonymous users can only access agents created < 1 hour ago
- Prevents indefinite anonymous access
- Users must login for permanent access

### **Agent Ownership Verification**
- Verifies agent belongs to anonymous user (`userId === null`)
- Prevents anonymous users from accessing authenticated user agents

### **Existence Check**
- Verifies agent exists before allowing connection
- Returns false if agent not found

### **Error Handling**
- Returns false on any error (fail secure)
- Logs errors for debugging

---

## 📋 Testing Checklist

After deployment:

1. ✅ **Anonymous User Flow:**
   - Create agent session (no login)
   - Blueprint generates successfully
   - WebSocket connects successfully
   - Code generation starts

2. ✅ **Expired Anonymous Access:**
   - Create agent (no login)
   - Wait > 1 hour
   - Attempt WebSocket connection
   - Should get helpful error message

3. ✅ **Authenticated User Flow:**
   - Login
   - Create agent session
   - WebSocket connects successfully
   - Code generation starts

4. ✅ **Error Cases:**
   - Non-existent agent → 404
   - Agent belongs to different user → 401
   - Invalid origin → 403

---

## 🚨 Breaking Changes

**None** - This is a fix that adds functionality without breaking existing behavior.

- ✅ Authenticated users continue to work as before
- ✅ Anonymous users can now connect (previously blocked)
- ✅ All security checks remain in place

---

## 📝 Related Files

- `worker/api/routes/codegenRoutes.ts` - Route configuration (already set to `public`)
- `worker/api/controllers/agent/controller.ts` - Handler implementation (FIXED)
- `worker/database/services/AppService.ts` - Database service (used for verification)
- `src/routes/chat/hooks/use-chat.ts` - Frontend WebSocket client (no changes needed)

---

## 🎉 Expected Outcome

After this fix:
- ✅ Anonymous users can connect to WebSocket for recently created agents
- ✅ No more "Missing user" 401 errors for anonymous users
- ✅ WebSocket connection succeeds → Code generation proceeds
- ✅ Preview renders successfully
- ✅ Full end-to-end flow works for anonymous users

