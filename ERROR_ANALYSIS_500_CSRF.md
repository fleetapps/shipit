# 500 Error Analysis: CSRF Token Endpoint Crash

## Root Cause: Undefined Variable Reference

### The Problem

The error `CSRF token fetch failed with status: 500` was caused by a **ReferenceError** when trying to use an undefined `logger` variable.

### What Happened

In my previous fix, I added these lines to `getCsrfToken()` method:

```typescript
// ❌ BROKEN CODE (what I added):
logger.debug('CSRF token generated and cookie set', { ... });
logger.error('Error generating CSRF token:', error);
```

**Problem:** The variable `logger` doesn't exist in that scope!

### The Error Flow

1. **Request arrives:** `GET /api/auth/csrf-token`
2. **Code executes:** `getCsrfToken()` method runs
3. **Hit the bug:** Line 642 tries to call `logger.debug(...)`
4. **JavaScript error:** `ReferenceError: logger is not defined`
5. **Caught by try-catch:** Error handler tries to call `logger.error(...)`
6. **Another error:** `ReferenceError: logger is not defined` (crashes again)
7. **Server response:** Uncaught exception → **500 Internal Server Error**

### How I Found It

#### Step 1: Checked Error Location
- Error: `CSRF token fetch failed with status: 500`
- Endpoint: `/api/auth/csrf-token`
- File: `worker/api/controllers/auth/controller.ts`
- Method: `getCsrfToken()` (static method)

#### Step 2: Reviewed My Recent Changes
I added logging code:
```typescript
logger.debug(...)  // Line 642
logger.error(...)  // Line 650
```

#### Step 3: Checked Logger Usage Pattern
I searched the file for how logger is used elsewhere:

```typescript
// Instance methods use:
this.logger.debug(...)
this.logger.error(...)

// Static methods should use:
AuthController.logger.debug(...)
AuthController.logger.error(...)
```

#### Step 4: Found the Definition
```typescript
export class AuthController extends BaseController {
    static logger = createLogger('AuthController');  // Line 32
}
```

**Aha!** The logger is a **static property** of the class, not a standalone variable.

### The Fix

Changed from:
```typescript
❌ logger.debug(...)
❌ logger.error(...)
```

To:
```typescript
✅ AuthController.logger.debug(...)
✅ AuthController.logger.error(...)
```

### Why It Crashed with 500

When JavaScript tries to access an undefined variable:
```javascript
logger.debug(...)  // ReferenceError: logger is not defined
```

This throws a `ReferenceError`. Since it happened:
1. **Inside the try block** → Caught by catch block
2. **Inside the catch block** → Another ReferenceError → **Uncaught exception**
3. **Uncaught exception** → Worker crashes → **500 Internal Server Error**

### The Complete Fix

**File:** `worker/api/controllers/auth/controller.ts`

**Before (BROKEN):**
```typescript
logger.debug('CSRF token generated and cookie set', {...});
// ...
logger.error('Error generating CSRF token:', error);
```

**After (FIXED):**
```typescript
AuthController.logger.debug('CSRF token generated and cookie set', {...});
// ...
AuthController.logger.error('Error generating CSRF token:', error);
```

### Key Learning

**Static methods** in TypeScript/JavaScript classes must use:
- `ClassName.staticProperty` (not just `staticProperty`)
- Since `logger` is `static logger = ...`, we use `AuthController.logger`

**Instance methods** can use:
- `this.instanceProperty`
- But static methods don't have `this` context, so they need the class name

### Verification

After the fix:
- ✅ No more `ReferenceError`
- ✅ Logger calls work correctly
- ✅ 500 error resolved
- ✅ CSRF token endpoint should return 200 OK

---

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| 500 Error | `logger` variable not defined | Use `AuthController.logger` |
| ReferenceError | Trying to access undefined variable | Reference static property correctly |
| Uncaught Exception | Error in catch block | Fixed logger reference in catch block too |

The fix is simple but critical: always use the correct logger reference for static methods!

