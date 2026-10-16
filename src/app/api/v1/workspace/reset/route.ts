import { NextResponse, type NextRequest } from "next/server";

import { applyRateLimit } from "@/lib/api/rateLimit";
import { internalError, requireApiToken } from "@/lib/workspace/api";
import { resetWorkspace } from "@/lib/workspace/store";

const RESET_LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RESET_LIMIT);
  if (rateLimited) return rateLimited;

  try {
    const unauthorized = requireApiToken(request);
    if (unauthorized) {
      return unauthorized;
    }

    return NextResponse.json(resetWorkspace());
  } catch {
    return internalError();
  }
}
