import { Hono } from 'hono';
import { AppEnv } from './types/appenv';
export declare function createApp(env: Env): Hono<AppEnv>;
