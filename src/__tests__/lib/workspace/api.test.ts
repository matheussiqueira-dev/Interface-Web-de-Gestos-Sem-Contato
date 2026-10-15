// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { internalError, requireApiToken, validationError } from "@/lib/workspace/api";

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = token ? { "x-api-token": token } : {};
  return new NextRequest("http://localhost/api/v1/workspace", { headers });
}

describe("requireApiToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("closes writes with 503 when API_TOKEN is not configured", async () => {
    vi.stubEnv("API_TOKEN", "");
    const response = requireApiToken(makeRequest("anything"));
    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({ error: "writes_disabled" });
  });

  it("allows requests carrying the configured token", () => {
    vi.stubEnv("API_TOKEN", "test-token");
    expect(requireApiToken(makeRequest("test-token"))).toBeNull();
  });

  it.each([undefined, "wrong-token", "test-token-longer"])(
    "rejects token %s with 401",
    async (token) => {
      vi.stubEnv("API_TOKEN", "test-token");
      const response = requireApiToken(makeRequest(token));
      expect(response?.status).toBe(401);
      await expect(response?.json()).resolves.toMatchObject({ error: "unauthorized" });
    },
  );
});

describe("error responses", () => {
  it("validationError returns 400 with details", async () => {
    const response = validationError({ field: "text" });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "validation_error",
      details: { field: "text" },
    });
  });

  it("internalError returns 500", async () => {
    const response = internalError();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: "internal_error" });
  });
});
