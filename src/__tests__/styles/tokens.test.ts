import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { BOARD_COLORS } from "@/lib/workspace/defaults";

// Canonical hash of ms-tokens.css v1.0 (padrao-projetos, Appendix A.2).
const MS_TOKENS_SHA256 = "4ee1fcd1e10a7592079aebe6ba675cf46d971ae3fdce64b54efadedef1a4fe99";

const tokensCss = readFileSync(resolve(process.cwd(), "src/app/ms-tokens.css"), "utf8");

describe("ms-tokens.css", () => {
  it("is the unmodified shared v1.0 file", () => {
    expect(createHash("sha256").update(tokensCss).digest("hex")).toBe(MS_TOKENS_SHA256);
  });

  it("matches the hex values stored for board colours", () => {
    for (const color of BOARD_COLORS) {
      const match = tokensCss.match(new RegExp(`${color.token}:\\s*(#[0-9a-f]{6})`, "i"));
      expect(match?.[1].toLowerCase(), color.token).toBe(color.value);
    }
  });
});

describe("app.css", () => {
  it("uses tokens instead of literal colours", () => {
    const appCss = readFileSync(resolve(process.cwd(), "src/styles/app.css"), "utf8");
    expect(appCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(appCss).not.toMatch(/rgba?\(/i);
  });
});
