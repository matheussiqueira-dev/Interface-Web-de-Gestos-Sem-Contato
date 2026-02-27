import { NextResponse, type NextRequest } from "next/server";

import { internalError, requireApiToken } from "@/lib/workspace/api";
import { resetWorkspace } from "@/lib/workspace/store";

export async function POST(request: NextRequest) {
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
