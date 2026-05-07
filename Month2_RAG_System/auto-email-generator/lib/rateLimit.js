const buckets = new Map();

/**
 * Fixed window rate limit. Suitable for a single Node process.
 * For multi-instance production, use Redis (e.g. Upstash) instead.
 */
export function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return {
      ok: false,
      retryAfterMs: windowMs - (now - bucket.windowStart)
    };
  }
  return { ok: true };
}

export function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
