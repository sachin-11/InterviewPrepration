import { isProduction } from './config.js';

export function logError(scope, err, extra = {}) {
  const payload = {
    scope,
    message: err?.message || String(err),
    stack: err?.stack,
    ...extra,
    at: new Date().toISOString()
  };
  console.error('[error]', JSON.stringify(payload));
}

export function logInfo(scope, data = {}) {
  console.log('[info]', JSON.stringify({ scope, ...data, at: new Date().toISOString() }));
}

export function userFacingMessage(err, fallback = 'Something went wrong') {
  return isProduction() ? fallback : err?.message || fallback;
}
