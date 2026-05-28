import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/auth";

export async function GET() {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ token: null }, { status: 401 });
  }

  // We can just return the session token itself if it's what the backend expects
  // The backend uses JWT_SECRET to verify it.
  return NextResponse.json({ token });
}
