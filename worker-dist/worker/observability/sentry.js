import * as Sentry from '@sentry/cloudflare';
import { HTTPException } from 'hono/http-exception';
export function sentryOptions(env) {
    let transportOptions = {};
    if (env.CF_ACCESS_ID && env.CF_ACCESS_SECRET) {
        transportOptions.headers = {
            'CF-Access-Client-Id': env.CF_ACCESS_ID,
            'CF-Access-Client-Secret': env.CF_ACCESS_SECRET,
        };
    }
    return {
        dsn: env.SENTRY_DSN,
        release: env.CF_VERSION_METADATA.id,
        environment: env.ENVIRONMENT,
        enableLogs: true,
        sendDefaultPii: true,
        tracesSampleRate: 1.0,
        transportOptions,
        allowUrls: [
            // Only capture errors from our API endpoints
            new RegExp(`^https://${env.CUSTOM_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/api/.*$`)
        ]
    };
}
export function initHonoSentry(app) {
    // Report unhandled exceptions from routes/middleware
    app.onError((err, c) => {
        Sentry.captureException(err);
        if (err instanceof HTTPException) {
            return err.getResponse();
        }
        return c.json({ error: 'Internal server error' }, 500);
    });
    // Light context binding for better traces
    app.use('*', async (c, next) => {
        try {
            const url = new URL(c.req.url);
            Sentry.setTag('http.method', c.req.method);
            Sentry.setTag('http.path', url.pathname);
            const cfRay = c.req.header('cf-ray');
            if (cfRay)
                Sentry.setTag('cf_ray', cfRay);
        }
        catch {
            console.error('Failed to set Sentry context');
        }
        return next();
    });
}
export function captureSecurityEvent(type, data = {}, options = {}) {
    try {
        const level = options.level ?? 'warning';
        Sentry.withScope((scope) => {
            scope.setTag('security_event', type);
            scope.setContext('security', data);
            scope.setLevel(level);
            Sentry.addBreadcrumb({
                category: 'security',
                level,
                data: { type, ...data },
            });
            if (options.error !== undefined) {
                Sentry.captureException(options.error, { level, extra: data });
            }
            else {
                Sentry.captureMessage(`[security] ${type}`, level);
            }
        });
    }
    catch {
        // no-op: telemetry must not break the app
        console.error('Failed to capture security event');
    }
}
export function captureException(error) {
    Sentry.captureException(error);
}
