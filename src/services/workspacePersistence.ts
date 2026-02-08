import type { WorkspaceSnapshot } from "../domain/workspace";
import { createDefaultWorkspaceSnapshot } from "../domain/workspace";

type PersistenceMode = "api" | "local";

interface LoadResult {
  snapshot: WorkspaceSnapshot;
  mode: PersistenceMode;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_TOKEN = import.meta.env.VITE_API_TOKEN ?? "";
const LOCAL_STORAGE_KEY = "touchless_workspace_v2";

function withAuthHeader(initHeaders: HeadersInit = {}): HeadersInit {
  if (!API_TOKEN) {
    return initHeaders;
  }

  return {
    ...initHeaders,
    "x-api-token": API_TOKEN,
  };
}

function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function safeParseWorkspace(raw: string | null): WorkspaceSnapshot | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as WorkspaceSnapshot;
    if (!parsed || !Array.isArray(parsed.notes) || !parsed.settings) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistLocal(snapshot: WorkspaceSnapshot): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage may be unavailable in private contexts
  }
}

export async function loadWorkspaceSnapshot(): Promise<LoadResult> {
  try {
    const response = await fetch(getApiUrl("/api/v1/workspace"), {
      method: "GET",
      headers: {
        ...withAuthHeader(),
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const snapshot = (await response.json()) as WorkspaceSnapshot;
      persistLocal(snapshot);
      return { snapshot, mode: "api" };
    }
  } catch {
    // fallback to local storage
  }

  const localSnapshot = safeParseWorkspace(window.localStorage.getItem(LOCAL_STORAGE_KEY));
  if (localSnapshot) {
    return { snapshot: localSnapshot, mode: "local" };
  }

  const defaultSnapshot = createDefaultWorkspaceSnapshot();
  persistLocal(defaultSnapshot);
  return { snapshot: defaultSnapshot, mode: "local" };
}

export async function saveWorkspaceSnapshot(
  snapshot: WorkspaceSnapshot,
): Promise<PersistenceMode> {
  persistLocal(snapshot);

  try {
    const response = await fetch(getApiUrl("/api/v1/workspace"), {
      method: "PUT",
      headers: {
        ...withAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(snapshot),
    });

    if (response.ok) {
      return "api";
    }
  } catch {
    // fallback kept in local storage
  }

  return "local";
}

export async function trackWorkspaceEvent(
  type:
    | "workspace_loaded"
    | "workspace_saved"
    | "tracking_paused"
    | "tracking_resumed"
    | "camera_error",
  payload: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  try {
    await fetch(getApiUrl("/api/v1/events"), {
      method: "POST",
      headers: {
        ...withAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        payload,
        occurredAt: new Date().toISOString(),
      }),
    });
  } catch {
    // telemetry is best-effort
  }
}
