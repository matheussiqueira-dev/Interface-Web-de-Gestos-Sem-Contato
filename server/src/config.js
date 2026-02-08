import path from "node:path";

const DEFAULT_PORT = 8787;
const DEFAULT_CLIENT_ORIGIN = "http://localhost:5173";

const resolvedPort = Number.parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10);

export const config = {
  port: Number.isFinite(resolvedPort) ? resolvedPort : DEFAULT_PORT,
  clientOrigin: process.env.CLIENT_ORIGIN ?? DEFAULT_CLIENT_ORIGIN,
  apiToken: process.env.API_TOKEN ?? "",
  dataFilePath:
    process.env.DATA_FILE_PATH ??
    path.resolve(process.cwd(), "server", "data", "workspace.json"),
};
