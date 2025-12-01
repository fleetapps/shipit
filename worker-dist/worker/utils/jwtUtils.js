import { jwtVerify, SignJWT } from 'jose';
import { SecurityError, SecurityErrorType } from '../../shared/types/errors';
import { createLogger } from '../logger';
import { SessionService } from '../database/services/SessionService';
const logger = createLogger('JWTUtils');
export class JWTUtils {
    static instance = null;
    jwtSecret;
    algorithm = 'HS256';
    constructor(jwtSecret) {
        // this.validateJWTSecret(jwtSecret);
        // No need to validate jwt secrets for others 
        // as everyone else would 1 click deploy. And we would use secure secrets for our deployment anyways.
        this.jwtSecret = new TextEncoder().encode(jwtSecret);
    }
    static getInstance(env) {
        if (!env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }
        if (!JWTUtils.instance) {
            JWTUtils.instance = new JWTUtils(env.JWT_SECRET);
        }
        return JWTUtils.instance;
    }
    // private validateJWTSecret(secret: string): void {
    //     if (secret.length < 32) {
    //         throw new Error('JWT_SECRET must be at least 32 characters long for security');
    //     }
    //     const weakSecrets = ['default', 'secret', 'password', 'changeme', 'admin', 'test'];
    //     if (weakSecrets.includes(secret.toLowerCase())) {
    //         throw new Error('JWT_SECRET contains a weak/default value. Please use a cryptographically secure random string');
    //     }
    //     const hasLowercase = /[a-z]/.test(secret);
    //     const hasUppercase = /[A-Z]/.test(secret);
    //     const hasNumbers = /[0-9]/.test(secret);
    //     const hasSpecial = /[^a-zA-Z0-9]/.test(secret);
    //     const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecial].filter(Boolean).length;
    //     if (characterTypes < 3) {
    //         throw new Error('JWT_SECRET must contain at least 3 different character types');
    //     }
    //     const hasRepeatingChars = /(.)\1{3,}/.test(secret);
    //     if (hasRepeatingChars) {
    //         throw new Error('JWT_SECRET contains repetitive patterns');
    //     }
    // }
    async createToken(payload, expiresIn = 24 * 3600) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const jwt = new SignJWT({
                ...payload,
                iat: now,
                exp: now + expiresIn
            })
                .setProtectedHeader({ alg: this.algorithm })
                .setIssuedAt(now)
                .setExpirationTime(now + expiresIn);
            return await jwt.sign(this.jwtSecret);
        }
        catch (error) {
            logger.error('Error creating token', error);
            throw new SecurityError(SecurityErrorType.INVALID_TOKEN, 'Failed to create token', 500);
        }
    }
    async verifyToken(token) {
        try {
            const { payload } = await jwtVerify(token, this.jwtSecret);
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                return null;
            }
            if (!payload.sub || !payload.email || !payload.type || !payload.exp || !payload.iat) {
                return null;
            }
            return {
                sub: payload.sub,
                email: payload.email,
                type: payload.type,
                exp: payload.exp,
                iat: payload.iat,
                jti: payload.jti,
                sessionId: payload.sessionId
            };
        }
        catch (error) {
            return null;
        }
    }
    async createAccessToken(userId, email, sessionId) {
        const accessTokenExpiry = SessionService.config.sessionTTL;
        const payload = { sub: userId, email, sessionId };
        const accessToken = await this.createToken({
            ...payload,
            type: 'access',
        }, accessTokenExpiry);
        return { accessToken, expiresIn: accessTokenExpiry };
    }
    async hashToken(token) {
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(hash)));
    }
}
