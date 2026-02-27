import { createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";
import { workspaceSchema } from "@/lib/workspace/schema";
import type { WorkspaceSnapshot } from "@/types/workspace";

declare global {
  // eslint-disable-next-line no-var
  var __touchlessWorkspace: WorkspaceSnapshot | undefined;
}

function cloneSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    notes: snapshot.notes.map((note) => ({ ...note })),
    settings: { ...snapshot.settings },
  };
}

function getStore(): WorkspaceSnapshot {
  if (!globalThis.__touchlessWorkspace) {
    globalThis.__touchlessWorkspace = createDefaultWorkspaceSnapshot();
  }
  return globalThis.__touchlessWorkspace;
}

export function readWorkspace(): WorkspaceSnapshot {
  return cloneSnapshot(getStore());
}

export function writeWorkspace(nextSnapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  const validated = workspaceSchema.parse({
    ...nextSnapshot,
    updatedAt: new Date().toISOString(),
  });

  globalThis.__touchlessWorkspace = validated;
  return cloneSnapshot(validated);
}

export function resetWorkspace(): WorkspaceSnapshot {
  const snapshot = createDefaultWorkspaceSnapshot();
  globalThis.__touchlessWorkspace = snapshot;
  return cloneSnapshot(snapshot);
}
