import { config } from "./config.js";
import { createApp } from "./app.js";
import { createWorkspaceStore } from "./storage.js";

const store = createWorkspaceStore(config.dataFilePath);
const app = createApp({
  store,
  clientOrigin: config.clientOrigin,
  apiToken: config.apiToken,
});

const server = app.listen(config.port, () => {
  console.info(`[api] running on http://localhost:${config.port}`);
});

function shutdown(signal) {
  console.info(`[api] received ${signal}, stopping server...`);
  server.close((error) => {
    if (error) {
      console.error("[api] shutdown failed", error);
      process.exit(1);
      return;
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
