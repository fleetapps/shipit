/**
 * Check if request is a Git protocol request
 */
export declare function isGitProtocolRequest(pathname: string): boolean;
/**
 * Main handler for Git protocol requests
 */
export declare function handleGitProtocolRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
