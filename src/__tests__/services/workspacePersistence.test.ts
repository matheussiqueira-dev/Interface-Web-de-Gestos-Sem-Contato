import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
  trackWorkspaceEvent,
} from "@/services/workspacePersistence";
import type { WorkspaceSnapshot } from "@/types/workspace";

const LOCAL_STORAGE_KEY = "touchless_workspace_v3";

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

describe("workspacePersistence", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadWorkspaceSnapshot", () => {
    it("returns API snapshot and mode='api' on successful fetch", async () => {
      const snapshot = makeSnapshot({ notes: [{ id: "api-note", x: 0, y: 0, text: "API Note", color: "#00E5FF", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] });
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => snapshot,
      });

      const result = await loadWorkspaceSnapshot();
      expect(result.mode).toBe("api");
      expect(result.snapshot.notes[0].id).toBe("api-note");
    });

    it("persists API snapshot to localStorage", async () => {
      const snapshot = makeSnapshot();
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => snapshot,
      });

      await loadWorkspaceSnapshot();
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    it("falls back to localStorage when API returns non-ok response", async () => {
      const snapshot = makeSnapshot();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      fetchMock.mockResolvedValueOnce({ ok: false });

      const result = await loadWorkspaceSnapshot();
      expect(result.mode).toBe("local");
    });

    it("falls back to localStorage when API request throws", async () => {
      const snapshot = makeSnapshot();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadWorkspaceSnapshot();
      expect(result.mode).toBe("local");
    });

    it("returns default snapshot when both API and localStorage fail", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      localStorage.clear();

      const result = await loadWorkspaceSnapshot();
      expect(result.mode).toBe("local");
      expect(result.snapshot).toBeDefined();
      expect(Array.isArray(result.snapshot.notes)).toBe(true);
    });

    it("ignores corrupted localStorage data and returns default", async () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, "not-valid-json{{{");
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const result = await loadWorkspaceSnapshot();
      expect(result.snapshot).toBeDefined();
    });
  });

  describe("saveWorkspaceSnapshot", () => {
    it("always persists snapshot to localStorage", async () => {
      const snapshot = makeSnapshot();
      fetchMock.mockResolvedValueOnce({ ok: true });

      await saveWorkspaceSnapshot(snapshot);
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      expect(stored).not.toBeNull();
    });

    it("returns 'api' mode on successful PUT", async () => {
      const snapshot = makeSnapshot();
      fetchMock.mockResolvedValueOnce({ ok: true });

      const mode = await saveWorkspaceSnapshot(snapshot);
      expect(mode).toBe("api");
    });

    it("returns 'local' mode when API PUT fails", async () => {
      const snapshot = makeSnapshot();
      fetchMock.mockResolvedValueOnce({ ok: false });

      const mode = await saveWorkspaceSnapshot(snapshot);
      expect(mode).toBe("local");
    });

    it("returns 'local' mode when API throws", async () => {
      const snapshot = makeSnapshot();
      fetchMock.mockRejectedValueOnce(new Error("Network error"));

      const mode = await saveWorkspaceSnapshot(snapshot);
      expect(mode).toBe("local");
    });
  });

  describe("trackWorkspaceEvent", () => {
    it("sends POST request with event data", async () => {
      fetchMock.mockResolvedValueOnce({ ok: true });
      await trackWorkspaceEvent("workspace_saved", { noteCount: 3 });

      expect(fetchMock).toHaveBeenCalledOnce();
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string) as { type: string; payload: Record<string, unknown> };
      expect(body.type).toBe("workspace_saved");
      expect(body.payload.noteCount).toBe(3);
    });

    it("does not throw when API request fails", async () => {
      fetchMock.mockRejectedValueOnce(new Error("Network error"));
      await expect(trackWorkspaceEvent("camera_error")).resolves.toBeUndefined();
    });
  });
});
