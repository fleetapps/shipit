import { Context } from 'hono';
import { RouteContext } from './types/route-context';
import { AppEnv } from '../types/appenv';
import { BaseController } from './controllers/baseController';
type ControllerMethod<T extends BaseController> = (this: T, request: Request, env: Env, ctx: ExecutionContext, context: RouteContext) => Promise<Response>;
export declare function adaptController<T extends BaseController>(controller: T, method: ControllerMethod<T>): (c: Context<AppEnv>) => Promise<Response>;
export {};
