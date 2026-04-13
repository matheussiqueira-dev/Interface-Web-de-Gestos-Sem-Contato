import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { applyRateLimit } from "@/lib/api/rateLimit";
import { internalError, requireApiToken, validationError } from "@/lib/workspace/api";
import { settingsSchema } from "@/lib/workspace/schema";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/store";

const SETTINGS_LIMIT = { limit: 20, windowMs: 60_000 };

export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, SETTINGS_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    const unauthorized = requireApiToken(request);
    if (unauthorized) {
      return unauthorized;
    }

    const payload = await request.json();
    const patch = settingsSchema.partial().parse(payload);

    const current = readWorkspace();
    const updated = writeWorkspace({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(updated.settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(
        error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    return internalError();
  }
}
