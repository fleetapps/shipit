import { ConfigurableSecuritySettings } from "./security";
export interface GlobalMessagingSettings {
    globalUserMessage: string;
    changeLogs: string;
}
export interface GlobalConfigurableSettings {
    security: ConfigurableSecuritySettings;
    globalMessaging: GlobalMessagingSettings;
}
export declare function getGlobalConfigurableSettings(env: Env): Promise<GlobalConfigurableSettings>;
export declare function getUserConfigurableSettings(env: Env, userId: string): Promise<GlobalConfigurableSettings>;
