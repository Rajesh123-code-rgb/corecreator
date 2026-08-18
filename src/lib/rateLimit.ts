/**
 * A small in-memory rate limiter for abuse-prone endpoints.
 *
 * Deliberately not Redis: this app runs as a single container, so a per-process
 * map is accurate here and adds no infrastructure. If the app is ever scaled to
 * multiple replicas each will hold its own counter and the effective limit
 * becomes (limit x replicas) - still a useful ceiling, but move this to a shared
 * store at that point.
 *
 * Aimed at endpoints where an unlimited caller costs money or reputation:
 * forgot-password sends an email per request, so without a limit it is both an
 * inbox-flooding tool aimed at any address and a way to burn the mail quota.
 */

interface Bucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** Drops expired buckets so the map cannot grow without bound. */
function sweep(now: number) {
    if (now - lastSweep < 60_000) return;
    lastSweep = now;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    /** Seconds until the window resets, for a Retry-After header. */
    retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    sweep(now);

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1, retryAfter: 0 };
    }

    existing.count += 1;
    const allowed = existing.count <= limit;
    return {
        allowed,
        remaining: Math.max(0, limit - existing.count),
        retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
}

/**
 * Best-effort client identity. Behind nginx the socket address is the proxy, so
 * the forwarded headers are what distinguish callers.
 */
export function clientKey(request: Request, scope: string): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    return `${scope}:${ip}`;
}
