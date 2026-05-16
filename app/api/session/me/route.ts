import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth";
import { verifySessionToken } from "@/lib/token";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function GET() {
  const token = await getSessionToken();
  const sessionUser = await verifySessionToken(token);

  if (!token || !sessionUser) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ user: data.user ?? sessionUser });
    }
  } catch {}

  return NextResponse.json({ user: sessionUser });
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const data = await apiRequestAsCurrentUser("/me", {
      method: "PATCH",
      json: payload
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update profile." },
      { status: 400 }
    );
  }
}
