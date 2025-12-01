import { SmartCodeGeneratorAgent } from './agents/core/smartGeneratorAgent';
import { DORateLimitStore as BaseDORateLimitStore } from './services/rate-limit/DORateLimitStore';
export { UserAppSandboxService, DeployerService } from './services/sandbox/sandboxSdkClient';
export declare const CodeGeneratorAgent: typeof SmartCodeGeneratorAgent;
export declare const DORateLimitStore: typeof BaseDORateLimitStore;
/**
 * Main Worker fetch handler with robust, secure routing.
 */
declare const worker: {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
};
export default worker;
