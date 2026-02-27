import { createDefaultWorkspaceSnapshot } from "@/lib/workspace/defaults";
import type { WorkspaceEventType, WorkspaceSnapshot } from "@/types/workspace";

type PersistenceMode = "api" | "local";

interface LoadResult {
  snapshot: WorkspaceSnapshot;
  mode: PersistenceMode;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? "";
const LOCAL_STORAGE_KEY = "touchless_workspace_v3";

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

function canUseStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function safeParseWorkspace(raw: string | null): WorkspaceSnapshot | null {
  if (!raw) {
    return null;
  }

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
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage may be unavailable in private browsing contexts
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
      cache: "no-store",
    });

    if (response.ok) {
      const snapshot = (await response.json()) as WorkspaceSnapshot;
      persistLocal(snapshot);
      return { snapshot, mode: "api" };
    }
  } catch {
    // fallback to local storage
  }

  const localSnapshot = canUseStorage()
    ? safeParseWorkspace(window.localStorage.getItem(LOCAL_STORAGE_KEY))
    : null;

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
    // fallback remains local
  }

  return "local";
}

export async function trackWorkspaceEvent(
  type: WorkspaceEventType,
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
