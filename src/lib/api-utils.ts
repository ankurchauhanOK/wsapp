import { NextResponse } from "next/server";

export function withError(error: unknown, status = 500) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  console.error("[API Error]", message);
  return NextResponse.json({ error: message }, { status });
}

export function notFound(entity = "Resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
