import { enforceAuthRequirement } from '../middleware/auth/routeAuth';
export function adaptController(controller, method) {
    return async (c) => {
        const authResult = await enforceAuthRequirement(c);
        if (authResult) {
            return authResult;
        }
        const routeContext = {
            user: c.get('user'),
            sessionId: c.get('sessionId'),
            config: c.get('config'),
            pathParams: c.req.param(),
            queryParams: new URL(c.req.url).searchParams,
        };
        return await method.call(controller, c.req.raw, c.env, c.executionCtx, routeContext);
    };
}
