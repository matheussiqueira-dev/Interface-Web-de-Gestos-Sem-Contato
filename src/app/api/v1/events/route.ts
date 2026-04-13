import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/core/system/logger";
import { applyRateLimit } from "@/lib/api/rateLimit";
import { internalError, requireApiToken, validationError } from "@/lib/workspace/api";
import { eventSchema } from "@/lib/workspace/schema";

const EVENT_LIMIT = { limit: 30, windowMs: 60_000 };

function sanitizePayload(payload: Record<string, string | number | boolean | null>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.slice(0, 200)];
      }
      return [key, value];
    }),
  );
}

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, EVENT_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    const unauthorized = requireApiToken(request);
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const event = eventSchema.parse(body);
    logger.info(`event:${event.type}`, {
      occurredAt: event.occurredAt,
      payload: sanitizePayload(event.payload),
    });

    return NextResponse.json({ status: "accepted" }, { status: 202 });
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
