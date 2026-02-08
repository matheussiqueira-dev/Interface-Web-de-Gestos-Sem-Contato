import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { ZodError } from "zod";

import { createDefaultWorkspace } from "./defaults.js";
import { createRequestLogger } from "./logger.js";
import { eventSchema, settingsSchema, workspaceSchema } from "./validators.js";

function sanitizePayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.slice(0, 200)];
      }
      return [key, value];
    }),
  );
}

export function createApp({ store, clientOrigin }) {
  const app = express();
  const allowedOrigins = new Set([
    clientOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Origem nao autorizada"));
      },
      credentials: true,
    }),
  );

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 180,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "200kb" }));
  app.use(createRequestLogger());

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "touchless-interface-api",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/v1/workspace", async (_req, res, next) => {
    try {
      const workspace = await store.readWorkspace();
      res.json(workspace);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/v1/workspace", async (req, res, next) => {
    try {
      const workspace = workspaceSchema.parse(req.body);
      const persisted = await store.writeWorkspace({
        ...workspace,
        updatedAt: new Date().toISOString(),
      });
      res.json(persisted);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/v1/settings", async (req, res, next) => {
    try {
      const settingsPatch = settingsSchema.partial().parse(req.body);
      const currentWorkspace = await store.readWorkspace();
      const nextWorkspace = {
        ...currentWorkspace,
        settings: {
          ...currentWorkspace.settings,
          ...settingsPatch,
        },
        updatedAt: new Date().toISOString(),
      };

      const persisted = await store.writeWorkspace(nextWorkspace);
      res.json(persisted.settings);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/events", (req, res, next) => {
    try {
      const event = eventSchema.parse(req.body);
      const payload = sanitizePayload(event.payload);

      console.info(
        `[event] ${event.type} at ${event.occurredAt} payload=${JSON.stringify(payload)}`,
      );

      res.status(202).json({ status: "accepted" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/workspace/reset", async (_req, res, next) => {
    try {
      const resetWorkspace = {
        ...createDefaultWorkspace(),
        updatedAt: new Date().toISOString(),
      };
      const persisted = await store.writeWorkspace(resetWorkspace);
      res.json(persisted);
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({
      error: "not_found",
      message: "Endpoint nao encontrado",
    });
  });

  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: "validation_error",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    if (error instanceof Error && error.message === "Origem nao autorizada") {
      res.status(403).json({
        error: "forbidden_origin",
        message: error.message,
      });
      return;
    }

    console.error("[api-error]", error);
    res.status(500).json({
      error: "internal_error",
      message: "Erro interno do servidor",
    });
  });

  return app;
}
