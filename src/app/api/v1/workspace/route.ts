import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { internalError, requireApiToken, validationError } from "@/lib/workspace/api";
import { workspaceSchema } from "@/lib/workspace/schema";
import { readWorkspace, writeWorkspace } from "@/lib/workspace/store";

export function GET() {
  try {
    return NextResponse.json(readWorkspace());
  } catch {
    return internalError();
  }
}

export async function PUT(request: NextRequest) {
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
