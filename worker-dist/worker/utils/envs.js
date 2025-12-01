export function isProd(env) {
    return env.ENVIRONMENT === 'prod' || env.ENVIRONMENT === 'production';
}
export function isDev(env) {
    return env.ENVIRONMENT === 'dev' || env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'local';
}
