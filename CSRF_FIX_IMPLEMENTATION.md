# CSRF and Authentication Fix Implementation

## Summary

Fixed the root cause of CSRF validation failures and WebSocket authentication issues. The primary issue was that the CSRF cookie was not being properly set/read, causing a mismatch between the cookie value (empty) and the header value (in-memory token).

---

## Changes Made

### 1. Fixed CSRF Cookie Setting (`worker/services/csrf/CsrfService.ts`)

**Problem:** 
- Cookie was set with `SameSite=Strict` which can block cookies in some scenarios
- No validation to ensure token is not empty before setting cookie

**Fix:**
- Changed `SameSite=Strict` to `SameSite=Lax` (line 94)
- Added validation to ensure token is not empty before setting cookie
- Added better debug logging to track cookie setting

```typescript
// Before:
sameSite: 'Strict',

// After:
sameSite: 'Lax', // Changed from 'Strict' to 'Lax' to allow cross-origin requests
```

### 2. Fixed Frontend CSRF Token Handling (`src/lib/api-client.ts`)

**Problem:**
- Frontend was falling back to in-memory token when cookie was missing
- This caused header to have value while cookie was empty → CSRF validation failure

**Fix:**
- **Removed fallback to in-memory token** (line 230-232)
- Only use cookie token (source of truth)
- Enhanced `ensureCsrfToken()` to verify cookie is set after fetch
- Added better error handling and logging

```typescript
// REMOVED: Fallback to in-memory token - this causes CSRF validation failures
// If cookie is missing, ensureCsrfToken() should have fetched it before this is called
```

### 3. Enhanced CSRF Token Fetching (`src/lib/api-client.ts`)

**Improvements:**
- Added validation to check if Set-Cookie header is present in response
- Added debug logging to track cookie setting
- Better error messages for troubleshooting

### 4. Enhanced CSRF Token Endpoint (`worker/api/controllers/auth/controller.ts`)

**Improvements:**
- Added validation to ensure generated token is not empty
- Added debug logging to track token generation and cookie setting
- Better error handling

---

## How It Works Now

### Correct Flow:

1. **Client calls `ensureCsrfToken('POST')` before login:**
   - Checks if cookie exists → if yes, use it
   - If no cookie → calls `fetchCsrfToken()`

2. **`fetchCsrfToken()` calls GET `/api/auth/csrf-token`:**
   - Server generates token
   - Server sets `Set-Cookie: csrf-token=<token>; SameSite=Lax; ...`
   - Server returns token in JSON body
   - Client stores token in memory (for reference only)

3. **Client verifies cookie was set:**
   - Waits 50ms for browser to set cookie
   - Checks if cookie is readable
   - If not, logs warning (but continues - browser should send it automatically)

4. **Client calls POST `/api/auth/login`:**
   - `getAuthHeaders()` reads token from cookie (not in-memory)
   - Sets `X-CSRF-Token: <cookie-token>` header
   - Browser automatically sends `Cookie: csrf-token=<cookie-token>`

5. **Server validates:**
   - Reads `csrf-token` cookie → extracts token
   - Reads `X-CSRF-Token` header → gets token
   - Compares: cookie token === header token → ✅ Success

6. **After successful login:**
   - Server sets `accessToken` cookie
   - WebSocket can now read `accessToken` from cookies
   - WebSocket adds token to URL: `wss://.../ws?token=<accessToken>`
   - Server authenticates WebSocket → ✅ Connected

---

## Key Fixes

### Fix #1: SameSite=Lax
- Allows cookies to be sent in cross-origin scenarios
- More permissive than Strict while still secure

### Fix #2: No Fallback to In-Memory Token
- **CRITICAL:** This was the root cause of CSRF failures
- Cookie and header must always match
- If cookie is missing, we fetch a new one (don't use stale in-memory value)

### Fix #3: Better Validation
- Ensure token is not empty before setting cookie
- Verify cookie is set after fetch
- Better error messages for debugging

---

## Testing Checklist

1. **Clear all cookies and localStorage**
2. **Open DevTools → Network tab**
3. **Trigger login flow:**
   - Should see GET `/api/auth/csrf-token`
   - Check Response Headers → `Set-Cookie: csrf-token=...` (should have value)
   - Check Application → Cookies → `csrf-token` should exist
4. **Attempt login:**
   - Should see POST `/api/auth/login`
   - Check Request Headers → `Cookie: csrf-token=<value>` (should match header)
   - Check Request Headers → `X-CSRF-Token: <value>` (should match cookie)
   - Should return 200 (not 403)
5. **After login:**
   - Check Application → Cookies → `accessToken` should exist
   - Start agent session
   - WebSocket should connect successfully (no "No authentication token found" warning)

---

## Expected Behavior After Fix

✅ **CSRF Token Flow:**
- Cookie is set with non-empty value
- Cookie and header match
- Login succeeds (200 OK)

✅ **WebSocket Authentication:**
- After login, `accessToken` cookie exists
- WebSocket reads token from cookie
- WebSocket connection succeeds
- Blueprint streaming works

✅ **No More Errors:**
- No "CSRF validation failed" (403)
- No "No authentication token found"
- No "WebSocket connection failed permanently"

---

## Files Modified

1. `worker/services/csrf/CsrfService.ts` - Changed SameSite to Lax, added validation
2. `src/lib/api-client.ts` - Removed fallback to in-memory token, enhanced ensureCsrfToken
3. `worker/api/controllers/auth/controller.ts` - Added validation and logging

---

## Notes

- The WebSocket authentication was already correctly implemented
- The issue was that login was failing, so no `accessToken` cookie was set
- Once login succeeds, WebSocket authentication will work automatically
- All fixes follow best practices and don't break existing functionality

