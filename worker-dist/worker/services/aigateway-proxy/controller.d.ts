export declare function proxyToAiGateway(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response>;
export declare function generateAppProxyToken(appId: string, userId: string, env: Env, expiresInSeconds?: number): Promise<string>;
export declare function generateAppProxyUrl(env: Env): string;
