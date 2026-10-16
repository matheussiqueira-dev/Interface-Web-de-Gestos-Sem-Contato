import { afterEach, describe, expect, it, vi } from "vitest";

import { shortCommit, SITE } from "@/lib/site";
import { createId } from "@/utils/id";

describe("site metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exposes the package version and https author links", () => {
    expect(SITE.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(SITE.author.url.startsWith("https://")).toBe(true);
    expect(SITE.author.linkedin.endsWith("/")).toBe(false);
  });

  it("shortens the deployed commit and omits it locally", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "0123456789abcdef");
    expect(shortCommit()).toBe("0123456");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    expect(shortCommit()).toBeNull();
  });
});

describe("createId", () => {
  it("prefixes ids and keeps them unique", () => {
    const first = createId("note");
    expect(first).toMatch(/^note-[a-z0-9]+-[a-z0-9]+$/);
    expect(createId("note")).not.toBe(first);
  });
});
