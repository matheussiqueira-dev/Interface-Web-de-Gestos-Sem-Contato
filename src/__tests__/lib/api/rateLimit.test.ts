// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyRateLimit } from "@/lib/api/rateLimit";

const OPTIONS = { limit: 2, windowMs: 1000 };

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/v1/workspace", { headers });
}

describe("applyRateLimit", () => {
  let now: number;

  beforeEach(() => {
    globalThis.__rateLimitStore = undefined;
    now = 1_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.__rateLimitStore = undefined;
  });

  it("allows requests up to the limit", () => {
    const request = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    expect(applyRateLimit(request, OPTIONS)).toBeNull();
    expect(applyRateLimit(request, OPTIONS)).toBeNull();
  });

  it("returns 429 with rate-limit headers once the limit is exceeded", async () => {
    const request = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    applyRateLimit(request, OPTIONS);
    applyRateLimit(request, OPTIONS);

    now += 400;
    const response = applyRateLimit(request, OPTIONS);

    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("1");
    expect(response?.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(response?.headers.get("X-RateLimit-Remaining")).toBe("0");
    await expect(response?.json()).resolves.toMatchObject({ error: "too_many_requests" });
  });

  it("starts a new window after windowMs elapses", () => {
    const request = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    applyRateLimit(request, OPTIONS);
    applyRateLimit(request, OPTIONS);

    now += 1001;
    expect(applyRateLimit(request, OPTIONS)).toBeNull();
  });

  it("keys clients by the first x-forwarded-for address", () => {
    applyRateLimit(makeRequest({ "x-forwarded-for": "10.0.0.1, 172.16.0.1" }), OPTIONS);
    expect(globalThis.__rateLimitStore?.has("10.0.0.1")).toBe(true);
  });

  it("falls back to x-real-ip and then to 'unknown'", () => {
    applyRateLimit(makeRequest({ "x-real-ip": "192.168.0.9" }), OPTIONS);
    applyRateLimit(makeRequest(), OPTIONS);
    expect(globalThis.__rateLimitStore?.has("192.168.0.9")).toBe(true);
    expect(globalThis.__rateLimitStore?.has("unknown")).toBe(true);
  });

  it("tracks clients independently", () => {
    const a = makeRequest({ "x-forwarded-for": "10.0.0.1" });
    const b = makeRequest({ "x-forwarded-for": "10.0.0.2" });
    applyRateLimit(a, OPTIONS);
    applyRateLimit(a, OPTIONS);
    expect(applyRateLimit(a, OPTIONS)?.status).toBe(429);
    expect(applyRateLimit(b, OPTIONS)).toBeNull();
  });

  it("prunes expired entries once the store grows past 5000 clients", () => {
    const store = new Map<string, { count: number; windowStart: number }>();
    for (let i = 0; i < 5001; i++) {
      store.set(`stale-${i}`, { count: 1, windowStart: now - 5000 });
    }
    store.set("fresh", { count: 1, windowStart: now });
    globalThis.__rateLimitStore = store;

    applyRateLimit(makeRequest({ "x-forwarded-for": "10.0.0.1" }), OPTIONS);

    expect(store.has("stale-0")).toBe(false);
    expect(store.has("fresh")).toBe(true);
    expect(store.has("10.0.0.1")).toBe(true);
    expect(store.size).toBe(2);
  });
});
