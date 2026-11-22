/**
 * Sliding-window (log) in-memory rate limiter.
 *
 * NOTE: state is per server instance. On multi-instance / serverless
 * deployments this is a best-effort first line of defence; durable limits
 * (AI quota) are enforced in Postgres.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

const buckets = new Map<string, number[]>();
const MAX_KEYS = 10_000;
let lastSweep = 0;

function sweep(now: number, windowMs: number): void {
  if (now - lastSweep < 60_000 && buckets.size < MAX_KEYS) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
  // Hard cap: drop oldest keys if an attacker floods unique keys.
  if (buckets.size > MAX_KEYS) {
    const excess = buckets.size - MAX_KEYS;
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= excess) break;
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs);

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: Math.max(0, limit - hits.length), retryAfterMs: 0 };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Edge & Serverless distributed rate limiter backed by Upstash Redis REST pipeline
 * when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are configured, with
 * automatic zero-downtime fallback to the in-memory sliding-window limiter.
 */
export async function checkRateLimitAsync(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (redisUrl && redisToken) {
    try {
      const endpoint = `${redisUrl.replace(/\/+$/, "")}/pipeline`;
      const bucketKey = `rl:${key}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([
          ["INCR", bucketKey],
          ["PEXPIRE", bucketKey, String(windowMs), "NX"]
        ]),
        cache: "no-store",
        signal: AbortSignal.timeout(2000)
      });

      if (res.ok) {
        const data = (await res.json()) as Array<{ result?: number }>;
        const count = Number(data?.[0]?.result ?? 0);
        if (Number.isFinite(count) && count > 0) {
          return {
            allowed: count <= limit,
            remaining: Math.max(0, limit - count),
            retryAfterMs: count > limit ? windowMs : 0
          };
        }
      }
    } catch {
      // Fall back gracefully to local sliding-window rate limiter on Redis timeout/error.
    }
  }

  return checkRateLimit(key, limit, windowMs);
}
