import { TokenPayload } from '../types/auth-types';
export declare class JWTUtils {
    private static instance;
    private jwtSecret;
    private readonly algorithm;
    private constructor();
    static getInstance(env: {
        JWT_SECRET: string;
    }): JWTUtils;
    createToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn?: number): Promise<string>;
    verifyToken(token: string): Promise<TokenPayload | null>;
    createAccessToken(userId: string, email: string, sessionId: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    hashToken(token: string): Promise<string>;
}
