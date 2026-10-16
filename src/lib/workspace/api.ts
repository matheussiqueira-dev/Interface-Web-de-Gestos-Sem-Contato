import { timingSafeEqual } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

function tokensMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

/**
 * Guards write endpoints. Writes are closed by default: without a server-side
 * API_TOKEN the endpoint answers 503 instead of accepting anonymous writes.
 * Returns null when the request may proceed.
 */
export function requireApiToken(request: NextRequest): NextResponse | null {
  const apiToken = process.env.API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      {
        error: "writes_disabled",
        message: "Escrita na API desativada: configure API_TOKEN no servidor.",
      },
      { status: 503 },
    );
  }

  const token = request.headers.get("x-api-token");
  if (token && tokensMatch(token, apiToken)) {
    return null;
  }

  return NextResponse.json(
    {
      error: "unauthorized",
      message: "Token de autenticação inválido.",
    },
    { status: 401 },
  );
}

export function validationError(details: unknown): NextResponse {
  return NextResponse.json(
    {
      error: "validation_error",
      details,
    },
    { status: 400 },
  );
}

export function internalError(): NextResponse {
  return NextResponse.json(
    {
      error: "internal_error",
      message: "Erro interno do servidor.",
    },
    { status: 500 },
  );
}
