import type { WorkspaceNote, WorkspaceSettings, WorkspaceSnapshot } from "@/types/workspace";
import { createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";

const MAX_HISTORY_SIZE = 30;

export interface WorkspaceState {
  snapshot: WorkspaceSnapshot;
  trackingEnabled: boolean;
  clearSignal: number;
  history: WorkspaceSnapshot[];
  future: WorkspaceSnapshot[];
}

type WorkspaceAction =
  | { type: "hydrate"; payload: WorkspaceSnapshot }
  | { type: "setNotes"; payload: WorkspaceNote[] }
  | { type: "addNote"; payload: WorkspaceNote }
  | { type: "removeNote"; payload: string }
  | { type: "setSettings"; payload: WorkspaceSettings }
  | { type: "patchSettings"; payload: Partial<WorkspaceSettings> }
  | { type: "toggleTracking" }
  | { type: "setTracking"; payload: boolean }
  | { type: "clearDrawing" }
  | { type: "resetWorkspace" }
  | { type: "undo" }
  | { type: "redo" };

function withTimestamp(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
}

function pushHistory(
  history: WorkspaceSnapshot[],
  current: WorkspaceSnapshot,
): WorkspaceSnapshot[] {
  const next = [...history, current];
  if (next.length > MAX_HISTORY_SIZE) {
    next.shift();
  }
  return next;
}

function applySnapshotChange(
  state: WorkspaceState,
  nextSnapshot: WorkspaceSnapshot,
): WorkspaceState {
  return {
    ...state,
    history: pushHistory(state.history, state.snapshot),
    future: [],
    snapshot: withTimestamp(nextSnapshot),
  };
}

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    snapshot: createDefaultWorkspaceSnapshot(),
    trackingEnabled: true,
    clearSignal: 0,
    history: [],
    future: [],
  };
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        snapshot: withTimestamp(action.payload),
        history: [],
        future: [],
      };

    case "setNotes":
      return applySnapshotChange(state, {
        ...state.snapshot,
        notes: action.payload,
      });

    case "addNote":
      return applySnapshotChange(state, {
        ...state.snapshot,
        notes: [...state.snapshot.notes, action.payload],
      });

    case "removeNote":
      return applySnapshotChange(state, {
        ...state.snapshot,
        notes: state.snapshot.notes.filter((note) => note.id !== action.payload),
      });

    case "setSettings":
      return applySnapshotChange(state, {
        ...state.snapshot,
        settings: action.payload,
      });

    case "patchSettings":
      return applySnapshotChange(state, {
        ...state.snapshot,
        settings: {
          ...state.snapshot.settings,
          ...action.payload,
        },
      });

    case "toggleTracking":
      return {
        ...state,
        trackingEnabled: !state.trackingEnabled,
      };

    case "setTracking":
      return {
        ...state,
        trackingEnabled: action.payload,
      };

    case "clearDrawing":
      return {
        ...state,
        clearSignal: state.clearSignal + 1,
      };

    case "resetWorkspace":
      return {
        ...state,
        snapshot: createDefaultWorkspaceSnapshot(),
        history: [],
        future: [],
        clearSignal: state.clearSignal + 1,
      };

    case "undo": {
      if (state.history.length === 0) {
        return state;
      }

      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        snapshot: previous,
        history: state.history.slice(0, -1),
        future: [state.snapshot, ...state.future],
      };
    }

    case "redo": {
      if (state.future.length === 0) {
        return state;
      }

      const next = state.future[0];
      return {
        ...state,
        snapshot: next,
        history: [...state.history, state.snapshot],
        future: state.future.slice(1),
      };
    }

    default:
      return state;
  }
}

export function canUndo(state: WorkspaceState): boolean {
  return state.history.length > 0;
}

export function canRedo(state: WorkspaceState): boolean {
  return state.future.length > 0;
}
