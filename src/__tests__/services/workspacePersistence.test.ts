import { beforeEach, describe, expect, it } from "vitest";

import { createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";
import {
  getBrowserStorage,
  LOCAL_STORAGE_KEY,
  loadWorkspaceSnapshot,
  saveWorkspaceSnapshot,
} from "@/services/workspacePersistence";
import type { WorkspaceSnapshot } from "@/types/workspace";

function makeSnapshot(overrides: Partial<WorkspaceSnapshot> = {}): WorkspaceSnapshot {
  return {
    notes: [
      {
        id: "note-1",
        x: 10,
        y: 20,
        text: "Revisar quadro",
        color: "#6eb9ff",
        createdAt: "2026-10-01T10:00:00.000Z",
        updatedAt: "2026-10-01T10:00:00.000Z",
      },
    ],
    settings: {
      drawingColor: "#6eb9ff",
      pinchSensitivity: 1,
      cursorResponsiveness: 1,
      particlesEnabled: false,
    },
    updatedAt: "2026-10-01T10:00:00.000Z",
    ...overrides,
  };
}

function failingStorage(): Pick<Storage, "getItem" | "setItem"> {
  return {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
}

describe("workspacePersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("exposes the browser localStorage", () => {
    expect(getBrowserStorage()).toBe(window.localStorage);
  });

  describe("loadWorkspaceSnapshot", () => {
    it("returns the default workspace when nothing is saved", () => {
      const result = loadWorkspaceSnapshot();
      expect(result.source).toBe("default");
      expect(result.snapshot.notes).toEqual(createDefaultWorkspaceSnapshot().notes);
    });

    it("returns the saved workspace when it passes validation", () => {
      const snapshot = makeSnapshot();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      expect(loadWorkspaceSnapshot()).toEqual({ snapshot, source: "saved" });
    });

    it("ignores corrupted JSON", () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, "{not json");
      expect(loadWorkspaceSnapshot().source).toBe("default");
    });

    it("drops a note that fails the schema and keeps the rest of the board", () => {
      const snapshot = makeSnapshot();
      snapshot.notes.push(
        { ...snapshot.notes[0], id: "note-markup", text: "<img src=x onerror=alert(1)>" },
        { ...snapshot.notes[0], id: "note-empty", text: "" },
        { ...snapshot.notes[0] },
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));

      const result = loadWorkspaceSnapshot();
      expect(result.source).toBe("recovered");
      expect(result.snapshot.notes.map((note) => note.id)).toEqual(["note-1"]);
      expect(result.snapshot.settings).toEqual(snapshot.settings);
    });

    it("recovers notes with default settings when settings are invalid", () => {
      const snapshot = { ...makeSnapshot(), settings: { pinchSensitivity: 99 } };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
      const result = loadWorkspaceSnapshot();
      expect(result.source).toBe("recovered");
      expect(result.snapshot.notes).toHaveLength(1);
      expect(result.snapshot.settings).toEqual(createDefaultWorkspaceSnapshot().settings);
    });

    it("falls back to the default when nothing can be recovered", () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ notes: [{ id: 1 }], settings: null }));
      expect(loadWorkspaceSnapshot().source).toBe("default");
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify("text"));
      expect(loadWorkspaceSnapshot().source).toBe("default");
    });

    it("falls back to the default when storage is unavailable or throws", () => {
      expect(loadWorkspaceSnapshot(null).source).toBe("default");
      expect(loadWorkspaceSnapshot(failingStorage()).source).toBe("default");
    });
  });

  describe("saveWorkspaceSnapshot", () => {
    it("writes the snapshot and reports success", () => {
      const snapshot = makeSnapshot();
      expect(saveWorkspaceSnapshot(snapshot)).toBe(true);
      expect(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null")).toEqual(snapshot);
    });

    it("reports failure when storage is unavailable or full", () => {
      expect(saveWorkspaceSnapshot(makeSnapshot(), null)).toBe(false);
      expect(saveWorkspaceSnapshot(makeSnapshot(), failingStorage())).toBe(false);
    });
  });
});
