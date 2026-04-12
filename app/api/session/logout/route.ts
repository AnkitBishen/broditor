import { NextResponse } from "next/server";

import { buildExpiredSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildExpiredSessionCookie());
  return response;
}
