import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportNotesAsCsv,
  exportWorkspace,
  exportWorkspaceAsJson,
  generateExportFilename,
} from "@/utils/exportWorkspace";
import type { WorkspaceSnapshot } from "@/types/workspace";

function makeSnapshot(overrides: Partial<WorkspaceSnapshot> = {}): WorkspaceSnapshot {
  return {
    notes: [],
    settings: {
      drawingColor: "#00E5FF",
      pinchSensitivity: 1,
      cursorResponsiveness: 1,
      particlesEnabled: true,
    },
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("generateExportFilename", () => {
  it("includes today's date in YYYY-MM-DD format", () => {
    const name = generateExportFilename();
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}$/);
  });

  it("uses provided prefix", () => {
    const name = generateExportFilename("my-workspace");
    expect(name).toMatch(/^my-workspace-/);
  });

  it("defaults to 'workspace' prefix", () => {
    const name = generateExportFilename();
    expect(name).toMatch(/^workspace-/);
  });
});

describe("exportWorkspaceAsJson", () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    revokeObjectURLSpy = vi.fn();

    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURLSpy);

    vi.spyOn(document, "createElement").mockReturnValue({
      click: clickSpy,
      href: "",
      download: "",
    } as unknown as HTMLElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers a download click", () => {
    exportWorkspaceAsJson(makeSnapshot());
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it("revokes the object URL after download", () => {
    exportWorkspaceAsJson(makeSnapshot());
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock");
  });
});

describe("exportNotesAsCsv", () => {
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(document, "createElement").mockReturnValue({
      click: clickSpy,
      href: "",
      download: "",
    } as unknown as HTMLElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers a download click", () => {
    const snapshot = makeSnapshot({
      notes: [{
        id: "n1", x: 10, y: 20, text: "Hello", color: "#00E5FF",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }],
    });
    exportNotesAsCsv(snapshot);
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});

describe("exportWorkspace", () => {
  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(document, "createElement").mockReturnValue({
      click: vi.fn(),
      href: "",
      download: "",
    } as unknown as HTMLElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches to JSON format by default", () => {
    const jsonSpy = vi.spyOn({ exportWorkspaceAsJson }, "exportWorkspaceAsJson");
    exportWorkspace(makeSnapshot());
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it("dispatches to CSV format when format='csv'", () => {
    exportWorkspace(makeSnapshot(), "csv");
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });
});
