/**
 * Centralized Authentication Utilities
 */
/**
 * Extract sessionId from cookie
*/
export function extractSessionId(request) {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
        return null;
    }
    const cookies = parseCookies(cookieHeader);
    return cookies['sessionId'];
}
/**
 * Token extraction priorities and methods
 */
export var TokenExtractionMethod;
(function (TokenExtractionMethod) {
    TokenExtractionMethod["AUTHORIZATION_HEADER"] = "authorization_header";
    TokenExtractionMethod["COOKIE"] = "cookie";
    TokenExtractionMethod["QUERY_PARAMETER"] = "query_parameter";
})(TokenExtractionMethod || (TokenExtractionMethod = {}));
/**
 * Extract JWT token from request with multiple fallback methods
 * Prioritizes Authorization header, then cookies, then query parameters
 */
export function extractToken(request) {
    const result = extractTokenWithMetadata(request);
    return result.token;
}
/**
 * Extract JWT token from request with extraction method metadata
 * Useful for security logging and analysis
 */
export function extractTokenWithMetadata(request) {
    // Priority 1: Authorization header (most secure)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token && token.length > 0) {
            return {
                token,
                method: TokenExtractionMethod.AUTHORIZATION_HEADER,
            };
        }
    }
    // Priority 2: Cookies (secure for browser requests)
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        // Check common cookie names in order of preference
        const cookieNames = ['accessToken', 'auth_token', 'jwt'];
        for (const cookieName of cookieNames) {
            if (cookies[cookieName]) {
                return {
                    token: cookies[cookieName],
                    method: TokenExtractionMethod.COOKIE,
                    cookieName,
                };
            }
        }
    }
    // Priority 3: Query parameter (for WebSocket connections and special cases)
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token') || url.searchParams.get('access_token');
    if (queryToken && queryToken.length > 0) {
        return {
            token: queryToken,
            method: TokenExtractionMethod.QUERY_PARAMETER,
        };
    }
    return { token: null };
}
/**
 * Parse cookie header into key-value pairs
 */
export function parseCookies(cookieHeader) {
    const cookies = {};
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
        const [key, value] = pair.trim().split('=');
        if (key && value) {
            cookies[key] = decodeURIComponent(value);
        }
    }
    return cookies;
}
/**
 * Clear authentication cookie using secure cookie options
 */
export function clearAuthCookie(name) {
    return createSecureCookie({
        name,
        value: '',
        maxAge: 0,
    });
}
/**
 * Clear all auth cookies from response using consolidated approach
 */
export function clearAuthCookies(response) {
    response.headers.append('Set-Cookie', clearAuthCookie('accessToken'));
    response.headers.append('Set-Cookie', clearAuthCookie('auth_token'));
}
/**
 * Create secure cookie string with all options
 */
export function createSecureCookie(options) {
    const { name, value, maxAge = 7 * 24 * 60 * 60, // 7 days default
    httpOnly = true, secure = true, sameSite = 'Lax', path = '/', domain, } = options;
    const parts = [`${name}=${encodeURIComponent(value)}`];
    if (maxAge > 0)
        parts.push(`Max-Age=${maxAge}`);
    if (path)
        parts.push(`Path=${path}`);
    if (domain)
        parts.push(`Domain=${domain}`);
    if (httpOnly)
        parts.push('HttpOnly');
    if (secure)
        parts.push('Secure');
    if (sameSite)
        parts.push(`SameSite=${sameSite}`);
    return parts.join('; ');
}
/**
 * Set auth cookies with proper security settings
 */
export function setSecureAuthCookies(response, tokens) {
    const { accessToken, accessTokenExpiry = 3 * 24 * 60 * 60, // 3 days
     } = tokens;
    // Set access token cookie
    response.headers.append('Set-Cookie', createSecureCookie({
        name: 'accessToken',
        value: accessToken,
        maxAge: accessTokenExpiry,
        httpOnly: true,
        sameSite: 'Lax',
    }));
}
/**
 * Extract comprehensive request metadata
 */
export function extractRequestMetadata(request) {
    const headers = request.headers;
    return {
        ipAddress: headers.get('CF-Connecting-IP') ||
            headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
            headers.get('X-Real-IP') ||
            'unknown',
        userAgent: headers.get('User-Agent') || 'unknown',
        referer: headers.get('Referer') || undefined,
        origin: headers.get('Origin') || undefined,
        acceptLanguage: headers.get('Accept-Language') || undefined,
        // Cloudflare-specific
        cfConnectingIp: headers.get('CF-Connecting-IP') || undefined,
        cfRay: headers.get('CF-Ray') || undefined,
        cfCountry: headers.get('CF-IPCountry') || undefined,
        cfTimezone: headers.get('CF-Timezone') || undefined,
    };
}
export function mapUserResponse(user) {
    // Handle AuthUser type - already in correct format
    if ('isAnonymous' in user) {
        return user;
    }
    // Map from User schema type
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName || undefined,
        username: user.username || undefined,
        avatarUrl: user.avatarUrl || undefined,
        bio: user.bio || undefined,
        timezone: user.timezone || undefined,
        provider: user.provider || undefined,
        emailVerified: user.emailVerified || undefined,
        createdAt: user.createdAt || undefined,
    };
}
export function formatAuthResponse(user, sessionId, expiresAt) {
    const response = { user, sessionId, expiresAt };
    return response;
}
