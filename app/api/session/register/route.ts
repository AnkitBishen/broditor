import { NextResponse } from "next/server";

import type { RegisterPayload } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      full_name: body.fullName,
      email: body.email,
      organization: body.organization,
      password: body.password
    }),
    cache: "no-store"
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
