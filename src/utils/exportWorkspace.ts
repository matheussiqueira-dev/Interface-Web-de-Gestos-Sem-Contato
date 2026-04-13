import type { WorkspaceSnapshot } from "@/types/workspace";

export type ExportFormat = "json" | "csv";

/**
 * Triggers a browser file download with the given content, filename and MIME type.
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Serializes the workspace snapshot to a formatted JSON string and triggers a download.
 *
 * @param snapshot - The workspace state to export
 * @param filename - Target filename without extension (defaults to 'workspace-export')
 */
export function exportWorkspaceAsJson(
  snapshot: WorkspaceSnapshot,
  filename = "workspace-export",
): void {
  const content = JSON.stringify(snapshot, null, 2);
  triggerDownload(content, `${filename}.json`, "application/json");
}

/**
 * Serializes workspace notes to CSV format and triggers a download.
 * Settings and metadata are excluded; only note rows are included.
 *
 * @param snapshot - The workspace state to export
 * @param filename - Target filename without extension (defaults to 'workspace-notes')
 */
export function exportNotesAsCsv(
  snapshot: WorkspaceSnapshot,
  filename = "workspace-notes",
): void {
  const header = ["id", "text", "x", "y", "color", "createdAt", "updatedAt"].join(",");

  const rows = snapshot.notes.map((note) => {
    const safeText = `"${note.text.replace(/"/g, '""')}"`;
    return [note.id, safeText, note.x, note.y, note.color, note.createdAt, note.updatedAt].join(",");
  });

  const content = [header, ...rows].join("\n");
  triggerDownload(content, `${filename}.csv`, "text/csv;charset=utf-8;");
}

/**
 * Exports the workspace in the specified format, dispatching to the appropriate
 * format-specific handler.
 */
export function exportWorkspace(
  snapshot: WorkspaceSnapshot,
  format: ExportFormat = "json",
  filename?: string,
): void {
  if (format === "csv") {
    exportNotesAsCsv(snapshot, filename);
  } else {
    exportWorkspaceAsJson(snapshot, filename);
  }
}

/**
 * Generates a timestamped export filename in the format 'workspace-YYYY-MM-DD'.
 */
export function generateExportFilename(prefix = "workspace"): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}`;
}
