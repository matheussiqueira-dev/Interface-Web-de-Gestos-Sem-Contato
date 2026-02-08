import type {
  WorkspaceNote,
  WorkspaceSettings,
  WorkspaceSnapshot,
} from "../../domain/workspace";
import { createDefaultWorkspaceSnapshot } from "../../domain/workspace";

export interface WorkspaceState {
  snapshot: WorkspaceSnapshot;
  trackingEnabled: boolean;
  clearSignal: number;
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
  | { type: "resetWorkspace" };

function withTimestamp(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    updatedAt: new Date().toISOString(),
  };
}

export function createInitialWorkspaceState(): WorkspaceState {
  return {
    snapshot: createDefaultWorkspaceSnapshot(),
    trackingEnabled: true,
    clearSignal: 0,
  };
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        snapshot: withTimestamp(action.payload),
      };

    case "setNotes":
      return {
        ...state,
        snapshot: withTimestamp({
          ...state.snapshot,
          notes: action.payload,
        }),
      };

    case "addNote":
      return {
        ...state,
        snapshot: withTimestamp({
          ...state.snapshot,
          notes: [...state.snapshot.notes, action.payload],
        }),
      };

    case "removeNote":
      return {
        ...state,
        snapshot: withTimestamp({
          ...state.snapshot,
          notes: state.snapshot.notes.filter((note) => note.id !== action.payload),
        }),
      };

    case "setSettings":
      return {
        ...state,
        snapshot: withTimestamp({
          ...state.snapshot,
          settings: action.payload,
        }),
      };

    case "patchSettings":
      return {
        ...state,
        snapshot: withTimestamp({
          ...state.snapshot,
          settings: {
            ...state.snapshot.settings,
            ...action.payload,
          },
        }),
      };

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
        clearSignal: state.clearSignal + 1,
      };

    default:
      return state;
  }
}
