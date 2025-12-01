# Authentication Files List

## Core Authentication Files

### 1. **worker/utils/authUtils.ts**
   - Token extraction (`extractToken`, `extractTokenWithMetadata`)
   - Cookie management (`createSecureCookie`, `setSecureAuthCookies`, `clearAuthCookies`)
   - Session ID extraction
   - **Recent fix**: Added domain extraction for cross-subdomain cookie sharing

### 2. **worker/middleware/auth/auth.ts**
   - `validateToken()` - JWT token validation
   - `authMiddleware()` - Main authentication middleware
   - Token extraction and user session creation

### 3. **worker/middleware/auth/routeAuth.ts**
   - Route-level authentication enforcement
   - `setAuthLevel()` - Set auth requirements per route
   - `enforceAuthRequirement()` - Check auth before route handler
   - Resource ownership checks

### 4. **worker/api/controllers/auth/controller.ts**
   - `register()` - User registration
   - `login()` - Email/password login
   - `getProfile()` - Get user profile
   - `updateProfile()` - Update user profile
   - `logout()` - Logout user
   - `getCsrfToken()` - Get CSRF token
   - OAuth handlers (Google, GitHub)

### 5. **worker/api/routes/authRoutes.ts**
   - Route definitions for all auth endpoints
   - Public routes: `/api/auth/csrf-token`, `/api/auth/login`, `/api/auth/register`
   - Protected routes: `/api/auth/profile`, `/api/auth/logout`

### 6. **worker/database/services/AuthService.ts**
   - `register()` - Create new user account
   - `login()` - Authenticate user credentials
   - `findOrCreateOAuthUser()` - OAuth user handling
   - `verifyEmail()` - Email verification
   - Password hashing and verification

### 7. **worker/database/services/SessionService.ts**
   - `createSession()` - Create user session
   - `validateSession()` - Validate session
   - `cleanupUserSessions()` - Clean expired sessions
   - JWT token generation

### 8. **worker/types/auth-types.ts**
   - Type definitions for auth-related data structures
   - `AuthUser`, `AuthSession`, `AuthResult`, etc.

### 9. **worker/api/controllers/auth/authSchemas.ts**
   - Zod schemas for auth request validation
   - `loginSchema`, `registerSchema`, etc.

## CSRF Protection Files

### 10. **worker/services/csrf/CsrfService.ts**
   - `generateToken()` - Generate CSRF token
   - `setTokenCookie()` - Set CSRF token cookie
   - `getTokenFromCookie()` - Extract token from cookie
   - `getTokenFromHeader()` - Extract token from header
   - `validateToken()` - Validate double-submit cookie pattern
   - `enforce()` - Middleware to enforce CSRF protection
   - **Issue**: Cookie domain not set for cross-subdomain access

### 11. **worker/config/security.ts**
   - `getCSRFConfig()` - CSRF configuration
   - `getCORSConfig()` - CORS configuration
   - Security headers configuration

### 12. **worker/app.ts**
   - CSRF middleware setup
   - Global CSRF enforcement for state-changing requests
   - GET request handling to establish CSRF tokens

## Frontend Authentication Files

### 13. **src/lib/api-client.ts**
   - `fetchCsrfToken()` - Fetch CSRF token from server
   - `getAuthHeaders()` - Get auth headers for requests
   - `ensureCsrfToken()` - Ensure CSRF token exists
   - `getProfile()` - Get user profile
   - `login()`, `register()`, `logout()` - Auth API calls

### 14. **src/contexts/auth-context.tsx**
   - `AuthProvider` - React context for auth state
   - `useAuth()` - Hook to access auth state
   - Token refresh logic
   - Session management

### 15. **src/routes/chat/hooks/use-chat.ts**
   - `getAuthToken()` - Extract auth token from cookies/localStorage
   - WebSocket authentication token passing

## Current Issues

### CSRF Validation Failure (403)
**Problem**: CSRF cookie is not being set with proper domain, causing validation to fail.

**Root Cause**: 
- `CsrfService.setTokenCookie()` doesn't extract domain from request
- Cookie is set without `Domain` attribute, so it's only available on exact domain
- Browser doesn't send cookie for cross-subdomain requests

**Solution**: 
- Update `CsrfService.setTokenCookie()` to accept optional `request` parameter
- Extract root domain from request (e.g., `.fleet.ke`)
- Pass domain to `createSecureCookie()` for cross-subdomain access

