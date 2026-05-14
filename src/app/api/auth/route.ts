import { NextRequest, NextResponse } from "next/server";

import { withError } from "@/lib/api-utils";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin password not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  } catch (error) {
    return withError(error);
  }
}
