import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "touchless-interface-next-api",
    timestamp: new Date().toISOString(),
  });
}
