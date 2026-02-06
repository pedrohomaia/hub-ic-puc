// src/lib/rateLimit.ts
type Bucket = { resetAt: number; count: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, opts: { windowMs: number; max: number }) {
  const now = Date.now();
  const b = buckets.get(key);

  if (!b || now >= b.resetAt) {
    const resetAt = now + opts.windowMs;
    buckets.set(key, { resetAt, count: 1 });
    return { ok: true, remaining: opts.max - 1, resetAt, limit: opts.max };
  }

  if (b.count >= opts.max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt, limit: opts.max };
  }

  b.count += 1;
  return { ok: true, remaining: Math.max(0, opts.max - b.count), resetAt: b.resetAt, limit: opts.max };
}

export function rateHeaders(info: { remaining: number; resetAt: number; limit: number }) {
  const resetSeconds = Math.ceil(info.resetAt / 1000);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const retryAfter = Math.max(0, resetSeconds - nowSeconds);

  return {
    "X-RateLimit-Limit": String(info.limit),
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": String(resetSeconds),
    "Retry-After": String(retryAfter),
  } satisfies Record<string, string>;
}
