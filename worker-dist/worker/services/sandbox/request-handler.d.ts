import { type Sandbox } from "@cloudflare/sandbox";
export interface SandboxEnv {
    Sandbox: DurableObjectNamespace<Sandbox>;
}
export interface RouteInfo {
    port: number;
    sandboxId: string;
    path: string;
    token: string;
}
export declare function proxyToSandbox<E extends SandboxEnv>(request: Request, env: E): Promise<Response | null>;
export declare function isLocalhostPattern(hostname: string): boolean;
