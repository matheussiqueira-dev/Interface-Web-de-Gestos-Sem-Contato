import { NextResponse, type NextRequest } from "next/server";

export function requireApiToken(request: NextRequest): NextResponse | null {
  const apiToken = process.env.API_TOKEN;
  if (!apiToken) {
    return null;
  }

  const token = request.headers.get("x-api-token");
  if (token === apiToken) {
    return null;
  }

  return NextResponse.json(
    {
      error: "unauthorized",
      message: "Token de autenticacao invalido",
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
      message: "Erro interno do servidor",
    },
    { status: 500 },
  );
}
