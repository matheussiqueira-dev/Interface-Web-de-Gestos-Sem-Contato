import { z } from "zod";

const idRegex = /^[a-zA-Z0-9_-]{2,64}$/;
const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export const noteSchema = z.object({
  id: z.string().regex(idRegex, "id deve conter apenas letras, numeros, _ ou -"),
  x: z.number().finite().min(0).max(10000),
  y: z.number().finite().min(0).max(10000),
  text: z.string().trim().min(1).max(320),
  color: z.string().regex(hexColorRegex, "cor deve estar no formato hexadecimal"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const settingsSchema = z.object({
  drawingColor: z.string().regex(hexColorRegex, "cor de desenho invalida"),
  pinchSensitivity: z.number().min(0.6).max(1.7),
  cursorResponsiveness: z.number().min(0.6).max(1.7),
  particlesEnabled: z.boolean(),
});

export const workspaceSchema = z.object({
  notes: z.array(noteSchema).max(64),
  settings: settingsSchema,
  updatedAt: z.string().datetime(),
});

const metricValueSchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const eventSchema = z.object({
  type: z.enum([
    "workspace_loaded",
    "workspace_saved",
    "tracking_paused",
    "tracking_resumed",
    "camera_error",
  ]),
  payload: z
    .record(metricValueSchema)
    .optional()
    .default({})
    .refine((value) => Object.keys(value).length <= 24, {
      message: "payload deve conter no maximo 24 campos",
    }),
  occurredAt: z.string().datetime(),
});
