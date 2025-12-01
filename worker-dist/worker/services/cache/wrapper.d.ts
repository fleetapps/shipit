/**
 * Cache wrapper for controller methods without decorators
 */
import type { RouteContext } from '../../api/types/route-context';
import type { BaseController } from '../../api/controllers/baseController';
interface CacheOptions {
    ttlSeconds: number;
    tags?: string[];
}
type ControllerMethod<T extends BaseController> = (this: T, request: Request, env: Env, ctx: ExecutionContext, context: RouteContext) => Promise<Response>;
/**
 * Wraps a controller method with caching functionality
 * Works without experimental decorators - pure higher-order function
 */
export declare function withCache<T extends BaseController>(method: ControllerMethod<T>, options: CacheOptions): ControllerMethod<T>;
export {};
