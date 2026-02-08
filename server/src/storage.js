import fs from "node:fs/promises";
import path from "node:path";

import { createDefaultWorkspace } from "./defaults.js";
import { workspaceSchema } from "./validators.js";

function cloneWorkspace(workspace) {
  return {
    ...workspace,
    notes: workspace.notes.map((note) => ({ ...note })),
    settings: { ...workspace.settings },
  };
}

export function createWorkspaceStore(dataFilePath) {
  let cache = null;
  let writeQueue = Promise.resolve();

  async function ensureDataFile() {
    try {
      await fs.access(dataFilePath);
    } catch {
      await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
      const initialWorkspace = createDefaultWorkspace();
      await fs.writeFile(
        dataFilePath,
        JSON.stringify(initialWorkspace, null, 2),
        "utf8",
      );
    }
  }

  async function readWorkspace() {
    if (cache) {
      return cloneWorkspace(cache);
    }

    await ensureDataFile();
    const rawData = await fs.readFile(dataFilePath, "utf8");

    try {
      const parsed = JSON.parse(rawData);
      cache = workspaceSchema.parse(parsed);
      return cloneWorkspace(cache);
    } catch (error) {
      const fallback = createDefaultWorkspace();
      cache = fallback;
      await fs.writeFile(dataFilePath, JSON.stringify(fallback, null, 2), "utf8");
      return cloneWorkspace(fallback);
    }
  }

  async function writeWorkspace(nextWorkspace) {
    const validated = workspaceSchema.parse(nextWorkspace);
    cache = validated;

    writeQueue = writeQueue.then(() =>
      fs.writeFile(dataFilePath, JSON.stringify(validated, null, 2), "utf8"),
    );

    await writeQueue;
    return cloneWorkspace(validated);
  }

  return {
    readWorkspace,
    writeWorkspace,
  };
}
