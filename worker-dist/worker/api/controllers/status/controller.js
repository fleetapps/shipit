import { BaseController } from '../baseController';
export class StatusController extends BaseController {
    static async getPlatformStatus(_request, _env, _ctx, context) {
        const messaging = context.config.globalMessaging ?? { globalUserMessage: '', changeLogs: '' };
        const globalUserMessage = messaging.globalUserMessage ?? '';
        const changeLogs = messaging.changeLogs ?? '';
        const data = {
            globalUserMessage,
            changeLogs,
            hasActiveMessage: globalUserMessage.trim().length > 0,
        };
        return StatusController.createSuccessResponse(data);
    }
}
