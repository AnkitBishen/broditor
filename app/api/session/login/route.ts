import { NextResponse } from "next/server";

import { buildSessionCookie } from "@/lib/auth";
import { getDefaultDashboardPath } from "@/lib/routing";
import type { AuthResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: body.email ?? "",
      password: body.password ?? ""
    }),
    cache: "no-store"
  });

  const data = (await response.json()) as AuthResponse & { token?: string; message?: string };

  if (!response.ok || !data.token) {
    return NextResponse.json(
      { message: data.message ?? "Unable to sign in." },
      { status: response.status || 401 }
    );
  }

  const nextResponse = NextResponse.json({
    user: data.user,
    redirectTo: getDefaultDashboardPath(data.user.role)
  });
  nextResponse.headers.set("Set-Cookie", buildSessionCookie(data.token));
  return nextResponse;
}
