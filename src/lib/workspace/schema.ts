import { z } from "zod";

const idRegex = /^[a-zA-Z0-9_-]{2,64}$/;
const hexColorRegex = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const safeStringRegex = /^[^<>"'`\\;{}()[\]]*$/;

/**
 * Validates that a string contains no HTML-injectable or shell-injectable characters.
 * Applied to user-provided text fields to prevent XSS and injection attacks.
 */
const safeString = z
  .string()
  .trim()
  .refine((val) => safeStringRegex.test(val), {
    message: "Texto contém caracteres não permitidos.",
  });

export const noteSchema = z.object({
  id: z.string().regex(idRegex, "ID de nota inválido."),
  x: z.number().finite().min(0).max(10000),
  y: z.number().finite().min(0).max(10000),
  text: safeString.min(1, "Texto da nota não pode ser vazio.").max(320, "Texto máximo: 320 caracteres."),
  color: z.string().regex(hexColorRegex, "Cor deve ser hexadecimal válida."),
  createdAt: z.string().datetime("createdAt deve ser ISO 8601."),
  updatedAt: z.string().datetime("updatedAt deve ser ISO 8601."),
});

export const settingsSchema = z.object({
  drawingColor: z.string().regex(hexColorRegex, "Cor de desenho deve ser hexadecimal válida."),
  pinchSensitivity: z
    .number()
    .min(0.6, "Sensibilidade mínima: 0.6")
    .max(1.7, "Sensibilidade máxima: 1.7"),
  cursorResponsiveness: z
    .number()
    .min(0.6, "Responsividade mínima: 0.6")
    .max(1.7, "Responsividade máxima: 1.7"),
  particlesEnabled: z.boolean(),
});

export const workspaceSchema = z
  .object({
    notes: z
      .array(noteSchema)
      .max(64, "Máximo de 64 notas por workspace.")
      .refine(
        (notes) => {
          const ids = notes.map((n) => n.id);
          return ids.length === new Set(ids).size;
        },
        { message: "IDs de notas devem ser únicos." },
      ),
    settings: settingsSchema,
    updatedAt: z.string().datetime("updatedAt deve ser ISO 8601."),
  })
  .strict();

const metricValueSchema = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const eventSchema = z
  .object({
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
      .refine(
        (value) => Object.keys(value).length <= 24,
        "payload deve conter no máximo 24 campos.",
      )
      .refine(
        (value) => Object.keys(value).every((k) => /^[a-zA-Z0-9_]{1,64}$/.test(k)),
        "Chaves do payload devem ser alfanuméricas.",
      ),
    occurredAt: z.string().datetime("occurredAt deve ser ISO 8601."),
  })
  .strict();
