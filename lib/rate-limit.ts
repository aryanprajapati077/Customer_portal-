/** Best-effort in-memory rate limiter (per serverless instance). Softens brute-force; not a global quota. */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

function prune(now: number) {
  if (buckets.size < 2000) return
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k)
  }
}

/**
 * @returns null if allowed, or retry-after seconds if limited
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  prune(now)
  const cur = buckets.get(key)
  if (!cur || cur.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }
  if (cur.count >= limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) }
  }
  cur.count += 1
  return { ok: true }
}

export function clientIpFromRequest(request: Request): string {
  const xf = request.headers.get("x-forwarded-for")
  if (xf) return xf.split(",")[0]!.trim() || "unknown"
  return request.headers.get("x-real-ip") || "unknown"
}
