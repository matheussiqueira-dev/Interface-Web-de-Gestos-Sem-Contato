export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ACTIVE_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

function write(level: LogLevel, message: string, metadata?: unknown): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[ACTIVE_LEVEL]) {
    return;
  }

  const tag = `[touchless:${level}]`;
  if (metadata === undefined) {
    console[level === "debug" ? "log" : level](`${tag} ${message}`);
    return;
  }

  console[level === "debug" ? "log" : level](`${tag} ${message}`, metadata);
}

export const logger = {
  debug: (message: string, metadata?: unknown) => write("debug", message, metadata),
  info: (message: string, metadata?: unknown) => write("info", message, metadata),
  warn: (message: string, metadata?: unknown) => write("warn", message, metadata),
  error: (message: string, metadata?: unknown) => write("error", message, metadata),
};
