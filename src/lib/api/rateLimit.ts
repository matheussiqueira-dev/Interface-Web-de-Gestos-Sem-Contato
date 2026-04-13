import { NextResponse, type NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitOptions {
  /** Maximum number of requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__rateLimitStore) {
    globalThis.__rateLimitStore = new Map();
  }
  return globalThis.__rateLimitStore;
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
  return ip;
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>, now: number, windowMs: number): void {
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > windowMs) {
      store.delete(key);
    }
  }
}

/**
 * Applies a sliding window rate limit to the incoming request.
 * Returns a 429 NextResponse when the limit is exceeded, null otherwise.
 *
 * Uses an in-memory store backed by a global Map, which is suitable for
 * single-instance deployments. For distributed environments, replace the
 * store with a Redis-backed implementation.
 *
 * @param request - The incoming Next.js request
 * @param options - Rate limit configuration (limit and windowMs)
 */
export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): NextResponse | null {
  const { limit, windowMs } = options;
  const now = Date.now();
  const store = getStore();

  if (store.size > 5000) {
    pruneExpiredEntries(store, now, windowMs);
  }

  const key = getClientKey(request);
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return null;
  }

  entry.count += 1;

  if (entry.count > limit) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return NextResponse.json(
      { error: "too_many_requests", message: "Muitas requisicoes. Tente novamente em breve." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}
