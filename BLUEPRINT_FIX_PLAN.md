# Blueprint Streaming Fix Plan

## Executive Summary

**Root Cause Identified:** Blueprint chunks are being received and accumulated in a buffer (`blueprintBuffer`), but the buffer is **never written to the `files` array**. The editor reads from the `files` array, so `Blueprint.md` stays empty.

**Solution:** Wire the existing `blueprintBuffer` to update the `files` array using the existing `updateFileInArray()` helper function. This will make `Blueprint.md` appear in the editor and update in real-time as chunks arrive.

**Key Finding:** The code already has:
- ✅ Buffer accumulation (`blueprintBuffer += chunk` at line 531)
- ✅ File update helper (`updateFileInArray` in `file-state-helpers.ts`)
- ✅ Files state management (`setFiles` hook)
- ❌ **Missing link:** Buffer → Files array update

---

## Problem Summary

### Issue #1: Blueprint Chunks Not Writing to Editor (CRITICAL)
- **Status:** NDJSON stream is working correctly (41 chunks received)
- **Problem:** Chunks are received but never written to `Blueprint.md` in the editor
- **Root Cause:** Frontend accumulates chunks but doesn't update the editor/file system
- **Impact:** User sees empty Blueprint.md despite successful streaming

### Issue #2: WebSocket Authentication Failure (SECONDARY)
- **Status:** WebSocket connection fails due to missing auth token
- **Problem:** No authentication cookie found, WebSocket can't connect
- **Root Cause:** Authentication cookies not being set/read properly
- **Impact:** Structured blueprint JSON and real-time updates via WebSocket unavailable

---

## Fix Plan Overview

### Priority 1: Direct NDJSON → Blueprint.md Binding (IMMEDIATE)
**Goal:** Make blueprint chunks write directly to the editor as they arrive

### Priority 2: WebSocket Authentication (LATER)
**Goal:** Restore WebSocket connectivity for structured updates

---

## Fix #1: Direct Blueprint.md Writing from NDJSON Stream

### Current Flow Analysis

**What's Working:**
1. ✅ NDJSON stream connection established
2. ✅ 41 blueprint chunks received successfully
3. ✅ Chunks are being parsed and logged
4. ✅ Blueprint buffer is accumulating chunks

**What's Broken:**
1. ❌ Chunks never reach the editor/file system
2. ❌ `Blueprint.md` remains empty
3. ❌ No visual feedback to user that blueprint is generating

### Root Cause Location

**File:** `src/routes/chat/hooks/use-chat.ts`

**Current Code Flow:**
```
Line 513: for await (const obj of ndjsonStream(response))
Line 516: if (obj.chunk) {
Line 517: blueprintChunkCount++
Line 528: parser.feed(obj.chunk)  // ← Only parsing, not writing!
Line 533: setBlueprint(partial)   // ← Only sets state, doesn't update file
```

**Problem:** 
- Chunks are parsed into a JSON object (`setBlueprint(partial)`)
- But the raw markdown text is never written to the file system
- The editor reads from file system, not from React state

### Solution Steps

#### Step 1.1: Add Blueprint Buffer Accumulation
**Location:** `src/routes/chat/hooks/use-chat.ts` (around line 502-503)

**Action:**
- Add a `useRef` to accumulate raw blueprint markdown text
- Initialize: `const blueprintMarkdownBuffer = useRef<string>('')`
- On each chunk: `blueprintMarkdownBuffer.current += obj.chunk`

**Why:** Need to accumulate the raw markdown text (not just parse JSON)

#### Step 1.2: Create File Update Function
**Location:** `src/routes/chat/hooks/use-chat.ts` (new function)

**Action:**
- Create a function to update `Blueprint.md` in the `files` array
- Use `setFiles` state setter (already available in hook)
- Use helper from `src/routes/chat/utils/file-state-helpers.ts`

**Implementation:**
```typescript
const updateBlueprintFile = useCallback((content: string) => {
  setFiles((prev) => {
    const existingIndex = prev.findIndex(f => f.filePath === 'Blueprint.md');
    const blueprintFile: FileType = {
      filePath: 'Blueprint.md',
      fileContents: content,
      language: 'markdown',
      status: 'completed',
      // Add other required FileType properties
    };
    
    if (existingIndex >= 0) {
      // Update existing file
      return prev.map((file, index) => 
        index === existingIndex ? blueprintFile : file
      );
    } else {
      // Add new file
      return [...prev, blueprintFile];
    }
  });
}, [setFiles]);
```

**Key Finding:**
- Files are managed via `files` state array (line 96: `const [files, setFiles] = useState<FileType[]>([])`)
- Editor reads from `files` array via `activeFile?.fileContents` (chat.tsx line 1320)
- Helper functions exist in `file-state-helpers.ts` for file updates

#### Step 1.3: Wire Chunks to File Updates
**Location:** `src/routes/chat/hooks/use-chat.ts` (line 516-540)

**Current State:**
- Line 502: `let blueprintBuffer = ''` - Buffer already exists!
- Line 531: `blueprintBuffer += chunk` - Chunks already being accumulated!
- **Missing:** Buffer is never written to `files` array

**Action:**
- After line 531 (`blueprintBuffer += chunk`), call `updateBlueprintFile(blueprintBuffer)`
- Add throttling to prevent excessive updates (every 100-200ms max)
- Use `useRef` for `blueprintBuffer` instead of `let` to persist across renders

**Throttling Implementation:**
```typescript
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 100;

if (obj.chunk) {
  blueprintMarkdownBuffer.current += obj.chunk;
  
  const now = Date.now();
  if (now - lastUpdateTime > UPDATE_THROTTLE_MS) {
    updateBlueprintFile(blueprintMarkdownBuffer.current);
    lastUpdateTime = now;
  }
}
```

#### Step 1.4: Final Update on Stream Complete
**Location:** `src/routes/chat/hooks/use-chat.ts` (after line 556, stream completion)

**Action:**
- After stream loop completes, ensure final update
- Call: `updateBlueprintFile(blueprintMarkdownBuffer.current)`
- This ensures last chunk is written even if throttling skipped it

#### Step 1.5: Verify Editor Reads from File System
**Location:** Editor component (likely `src/routes/chat/chat.tsx` or Monaco integration)

**Action:**
- Verify `Blueprint.md` is registered with Monaco editor
- Ensure editor reads from the file system (not just initial state)
- Check if file updates trigger editor refresh automatically

**If Editor Doesn't Auto-Refresh:**
- May need to manually trigger editor model update
- Or ensure file system changes propagate to Monaco model

### Implementation Checklist

- [ ] **Step 1.1:** Convert `blueprintBuffer` from `let` to `useRef` (line 502)
- [ ] **Step 1.2:** Create `updateBlueprintFile()` function using `setFiles`
- [ ] **Step 1.3:** Wire chunk accumulation to file updates (after line 531, with throttling)
- [ ] **Step 1.4:** Add final update on stream completion (after line 567)
- [ ] **Step 1.5:** Verify `Blueprint.md` appears in file explorer
- [ ] **Step 1.6:** Test with real stream to confirm Blueprint.md fills in

### Expected Behavior After Fix

1. User starts new app creation
2. NDJSON stream begins
3. First chunk arrives → `Blueprint.md` shows first characters
4. Subsequent chunks arrive → `Blueprint.md` grows incrementally (typewriter effect)
5. Stream completes → `Blueprint.md` contains full blueprint markdown
6. User can see blueprint being generated in real-time

---

## Fix #2: WebSocket Authentication (Secondary)

### Current Flow Analysis

**What's Failing:**
1. ❌ WebSocket connection attempts fail immediately
2. ❌ Error: "No authentication token found in cookies or localStorage"
3. ❌ Error: "App not found" (because auth fails, can't fetch app)
4. ❌ WebSocket retries 6 times then gives up

**What Should Work:**
1. ✅ User logs in via email/password
2. ✅ Server sets `accessToken` cookie
3. ✅ WebSocket reads token from cookie or query param
4. ✅ Connection succeeds, structured updates flow

### Root Cause Analysis

**From Previous Investigation:**
- Authentication system is working (JWT_SECRET now configured)
- Login endpoint sets cookies correctly (`setSecureAuthCookies`)
- Cookies are `HttpOnly: true` (can't be read by JavaScript)
- WebSocket needs token in query parameter (code already supports this)

**Problem:**
- Frontend `getAuthToken()` function can't read HttpOnly cookies
- WebSocket connection doesn't have token in URL query parameter
- Server rejects unauthenticated WebSocket connections

### Solution Steps

#### Step 2.1: Verify Login Sets Cookies
**Location:** `worker/api/controllers/auth/controller.ts` (line 135-138)

**Action:**
- Verify `setSecureAuthCookies()` is being called after successful login
- Check cookie is set with correct domain/path
- Test in browser DevTools → Application → Cookies after login

**Verification:**
- Login via email/password
- Check Network tab → Response Headers → `Set-Cookie: accessToken=...`
- Check Application tab → Cookies → Should see `accessToken` cookie

#### Step 2.2: Fix WebSocket Token Extraction
**Location:** `src/routes/chat/hooks/use-chat.ts` (line 234-273, `getAuthToken()`)

**Current Problem:**
- Function tries to read cookies via `document.cookie`
- But `accessToken` cookie is `HttpOnly: true` (not accessible to JavaScript)
- Function returns `null`, WebSocket has no token

**Solution Options:**

**Option A: Use Query Parameter Token (Recommended)**
- After login, store token in `sessionStorage` (not localStorage for security)
- Read from `sessionStorage` in `getAuthToken()`
- Pass token in WebSocket URL query parameter

**Option B: Server-Side Cookie Reading**
- WebSocket upgrade request should automatically include cookies
- Verify server-side WebSocket handler reads cookies from request
- Check `worker/utils/authUtils.ts` `extractToken()` handles WebSocket upgrade

**Option C: Hybrid Approach**
- Try reading from cookie (for HttpOnly cookies, browser sends automatically)
- Fallback to sessionStorage if cookie not accessible
- Pass token in query parameter for WebSocket

#### Step 2.3: Update WebSocket Connection Code
**Location:** `src/routes/chat/hooks/use-chat.ts` (line 276-300, `connectWithRetry()`)

**Current Code:**
```typescript
const authToken = getAuthToken();
let finalWsUrl = wsUrl;
if (authToken) {
  // Append token to URL
}
```

**Action:**
- Ensure `getAuthToken()` returns valid token
- Verify token is appended to WebSocket URL correctly
- Check format: `wss://domain/api/agent/{id}/ws?token={token}`

#### Step 2.4: Verify Server-Side WebSocket Auth
**Location:** `worker/api/routes/agentRoutes.ts` or WebSocket handler

**Action:**
- Verify WebSocket upgrade handler calls `extractToken()`
- Check token is validated before accepting connection
- Ensure WebSocket handler reads token from query parameter OR cookies

**Investigation Needed:**
- Find WebSocket route handler
- Check how it extracts authentication
- Verify it accepts query parameter tokens

#### Step 2.5: Test Authentication Flow
**Action:**
1. Login via email/password
2. Check cookies are set (DevTools)
3. Check `getAuthToken()` returns token (console.log)
4. Check WebSocket URL includes token (console.log)
5. Verify WebSocket connection succeeds
6. Verify structured blueprint updates arrive via WebSocket

### Implementation Checklist

- [ ] **Step 2.1:** Verify login sets cookies correctly
- [ ] **Step 2.2:** Fix `getAuthToken()` to return token (sessionStorage or cookie)
- [ ] **Step 2.3:** Verify WebSocket URL includes token
- [ ] **Step 2.4:** Verify server-side WebSocket auth handler
- [ ] **Step 2.5:** Test full authentication flow
- [ ] **Step 2.6:** Verify structured blueprint JSON arrives via WebSocket

### Expected Behavior After Fix

1. User logs in successfully
2. `accessToken` cookie is set (HttpOnly)
3. Token is available to frontend (via sessionStorage or cookie reading)
4. WebSocket connection includes token in URL
5. Server validates token and accepts connection
6. Structured blueprint JSON arrives via WebSocket
7. App details can be fetched (no more "App not found" errors)

---

## Implementation Priority

### Phase 1: Fix Blueprint.md Writing (IMMEDIATE)
**Time Estimate:** 2-4 hours
**Impact:** HIGH - Users can see blueprint being generated
**Dependencies:** Need to find file update mechanism

**Steps:**
1. Investigate file system/editor integration
2. Implement buffer accumulation
3. Wire chunks to file updates
4. Test and verify

### Phase 2: Fix WebSocket Auth (LATER)
**Time Estimate:** 3-6 hours
**Impact:** MEDIUM - Enables structured updates and app details
**Dependencies:** Authentication must be working (already fixed)

**Steps:**
1. Fix token extraction
2. Update WebSocket connection
3. Verify server-side auth
4. Test full flow

---

## Key Files to Modify

### Fix #1 (Blueprint Writing)
1. **`src/routes/chat/hooks/use-chat.ts`**
   - Line 502: Convert `let blueprintBuffer` to `useRef<string>('')`
   - Add `updateBlueprintFile()` function using `setFiles` and `updateFileInArray` helper
   - Line 531: After `blueprintBuffer.current += chunk`, call `updateBlueprintFile()` (with throttling)
   - Line 567: After stream completes, final `updateBlueprintFile()` call
   - Add throttling using `useRef` for last update timestamp

2. **Helper Function Available:**
   - `src/routes/chat/utils/file-state-helpers.ts` has `updateFileInArray()` function
   - Use this to update `Blueprint.md` in the `files` array
   - Editor automatically reads from `files` array - no additional changes needed

### Fix #2 (WebSocket Auth)
1. **`src/routes/chat/hooks/use-chat.ts`**
   - Fix `getAuthToken()` function
   - Update WebSocket URL construction

2. **`src/contexts/auth-context.tsx`** (possibly)
   - Store token in sessionStorage after login
   - Make token accessible to WebSocket code

3. **WebSocket Handler** (server-side, TBD - need to find)
   - Verify token extraction
   - Verify token validation

---

## Testing Plan

### Fix #1 Testing
1. Start new app creation
2. Monitor console for chunk logs
3. **Verify:** `Blueprint.md` file appears in editor
4. **Verify:** File content grows as chunks arrive
5. **Verify:** Final blueprint is complete after stream ends

### Fix #2 Testing
1. Login via email/password
2. Check cookies in DevTools
3. Start new app creation
4. **Verify:** WebSocket connection succeeds (no auth errors)
5. **Verify:** Structured blueprint JSON arrives
6. **Verify:** App details can be fetched

---

## Risk Assessment

### Fix #1 Risks
- **Low Risk:** Only affects blueprint display
- **Mitigation:** Can fall back to showing blueprint after stream completes
- **Rollback:** Easy - just remove file update calls

### Fix #2 Risks
- **Medium Risk:** Affects authentication flow
- **Mitigation:** Test thoroughly, keep existing cookie-based auth as fallback
- **Rollback:** Revert token extraction changes

---

## Success Criteria

### Fix #1 Success
✅ Blueprint.md file appears in editor during stream
✅ File content updates incrementally as chunks arrive
✅ User sees typewriter effect
✅ Final blueprint is complete and readable

### Fix #2 Success
✅ No "No authentication token" errors
✅ WebSocket connection succeeds
✅ Structured blueprint JSON arrives via WebSocket
✅ App details can be fetched without errors

---

## Exact Code Changes Needed

### Fix #1: Blueprint.md Writing

**File:** `src/routes/chat/hooks/use-chat.ts`

**Change 1: Convert buffer to useRef (Line ~502)**
```typescript
// BEFORE:
let blueprintBuffer = '';

// AFTER:
const blueprintBufferRef = useRef<string>('');
const lastUpdateTimeRef = useRef<number>(0);
const UPDATE_THROTTLE_MS = 100;
```

**Change 2: Add update function (After line ~159, near loadBootstrapFiles)**
```typescript
const updateBlueprintFile = useCallback((content: string) => {
  setFiles((prev) => {
    const existingIndex = prev.findIndex(f => f.filePath === 'Blueprint.md');
    const blueprintFile: FileType = {
      filePath: 'Blueprint.md',
      fileContents: content,
      language: 'markdown',
      isGenerating: isGeneratingBlueprint,
      needsFixing: false,
      hasErrors: false,
      explanation: '',
    };
    
    if (existingIndex >= 0) {
      return prev.map((file, index) => 
        index === existingIndex ? { ...file, fileContents: content } : file
      );
    } else {
      return [...prev, blueprintFile];
    }
  });
}, [setFiles, isGeneratingBlueprint]);
```

**Change 3: Wire chunks to file updates (Line ~531)**
```typescript
// BEFORE:
blueprintBuffer += chunk;

// AFTER:
blueprintBufferRef.current += chunk;

// Add throttled update
const now = Date.now();
if (now - lastUpdateTimeRef.current > UPDATE_THROTTLE_MS) {
  updateBlueprintFile(blueprintBufferRef.current);
  lastUpdateTimeRef.current = now;
}
```

**Change 4: Update all blueprintBuffer references (Lines 531, 570, 571, 576, 585, 590)**
```typescript
// Replace all instances of:
blueprintBuffer
// With:
blueprintBufferRef.current
```

**Change 5: Final update on stream complete (After line ~567)**
```typescript
// After stream loop completes, add:
if (blueprintBufferRef.current.trim().length > 0) {
  updateBlueprintFile(blueprintBufferRef.current);
}
```

**Change 6: Import helper (Top of file)**
```typescript
import { updateFileInArray } from '../utils/file-state-helpers';
// (Optional - can use directly or via updateBlueprintFile)
```

---

## Next Steps

1. **Immediate:** Implement Fix #1 (blueprint writing) - exact changes above
2. **Testing:** Verify Blueprint.md appears and updates in real-time
3. **Later:** Implement Fix #2 (WebSocket auth) after Fix #1 is working
4. **Final Testing:** Verify both fixes work together

---

## Notes

- Fix #1 is independent of Fix #2 - can be implemented separately
- Fix #1 will work even if WebSocket is broken
- Fix #2 requires authentication to be working (already fixed)
- Both fixes can be tested independently
- Recommend implementing Fix #1 first for immediate user value

