import { createDefaultWorkspaceSnapshot, DEFAULT_WORKSPACE_SETTINGS } from "@/lib/workspace/defaults";
import { noteSchema, settingsSchema, workspaceSchema } from "@/lib/workspace/schema";
import type { WorkspaceSnapshot } from "@/types/workspace";

export const LOCAL_STORAGE_KEY = "touchless_workspace_v3";

export type LoadSource = "saved" | "recovered" | "default";

/**
 * Keeps every valid note and valid settings from data that failed the full
 * schema, so one bad note does not discard the whole board.
 */
function salvage(data: unknown): WorkspaceSnapshot | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const rawNotes = Array.isArray(record.notes) ? record.notes : [];
  const seen = new Set<string>();
  const notes = rawNotes.flatMap((raw) => {
    const parsed = noteSchema.safeParse(raw);
    if (!parsed.success || seen.has(parsed.data.id)) {
      return [];
    }
    seen.add(parsed.data.id);
    return [parsed.data];
  });

  const settings = settingsSchema.safeParse(record.settings);
  if (notes.length === 0 && !settings.success) {
    return null;
  }

  return {
    notes: notes.slice(0, 64),
    settings: settings.success ? settings.data : { ...DEFAULT_WORKSPACE_SETTINGS },
    updatedAt: new Date().toISOString(),
  };
}

export interface LoadResult {
  snapshot: WorkspaceSnapshot;
  source: LoadSource;
}

type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * Returns the browser's localStorage, or null when it is unavailable
 * (server rendering, private browsing, storage disabled by policy).
 */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Loads the workspace saved in this browser. Stored data is untrusted: it is
 * validated against the workspace schema and replaced by the default
 * workspace when missing, corrupted or from an incompatible version.
 */
export function loadWorkspaceSnapshot(
  storage: KeyValueStorage | null = getBrowserStorage(),
): LoadResult {
  let raw: string | null = null;
  try {
    raw = storage?.getItem(LOCAL_STORAGE_KEY) ?? null;
  } catch {
    raw = null;
  }

  if (raw) {
    let data: unknown = null;
    try {
      data = JSON.parse(raw);
    } catch {
      // corrupted JSON falls through to the default workspace
    }

    const parsed = workspaceSchema.safeParse(data);
    if (parsed.success) {
      return { snapshot: parsed.data, source: "saved" };
    }

    const recovered = salvage(data);
    if (recovered) {
      return { snapshot: recovered, source: "recovered" };
    }
  }

  return { snapshot: createDefaultWorkspaceSnapshot(), source: "default" };
}

/**
 * Saves the workspace in this browser. Returns false when storage is
 * unavailable or full, so the UI can say the change was not kept.
 */
export function saveWorkspaceSnapshot(
  snapshot: WorkspaceSnapshot,
  storage: KeyValueStorage | null = getBrowserStorage(),
): boolean {
  if (!storage) {
    return false;
  }

  try {
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}
