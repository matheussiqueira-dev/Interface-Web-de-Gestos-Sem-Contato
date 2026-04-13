import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { applyRateLimit } from "@/lib/api/rateLimit";
import { internalError, requireApiToken, validationError } from "@/lib/workspace/api";
import { workspaceSchema } from "@/lib/workspace/schema";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/store";

const READ_LIMIT = { limit: 60, windowMs: 60_000 };
const WRITE_LIMIT = { limit: 20, windowMs: 60_000 };

export function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, READ_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    return NextResponse.json(readWorkspace());
  } catch {
    return internalError();
  }
}

export async function PUT(request: NextRequest) {
  const rateLimited = applyRateLimit(request, WRITE_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    const unauthorized = requireApiToken(request);
    if (unauthorized) {
      return unauthorized;
    }

    const body = await request.json();
    const snapshot = workspaceSchema.parse(body);
    const persisted = writeWorkspace(snapshot);

    return NextResponse.json(persisted);
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
