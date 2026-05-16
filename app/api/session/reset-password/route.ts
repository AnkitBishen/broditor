import { NextResponse } from "next/server";

import { verifyOtp } from "@/lib/otp-store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  let body: { email?: string; otp?: string; password?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = String(body.email || "").trim().toLowerCase();
  const otp = String(body.otp || "").trim();
  const password = String(body.password || "");

  if (!email || !otp || !password) {
    return NextResponse.json(
      { message: "Email, verification code, and new password are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  // Verify OTP first
  const verification = verifyOtp(email, otp);
  if (!verification.valid) {
    return NextResponse.json(
      { message: verification.message },
      { status: 400 }
    );
  }

  // OTP valid — call backend to reset password
  const backendUrl = `${API_BASE_URL}/auth/reset-password`.replace(
    /([^:])\/\/+/g,
    "$1/"
  );

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch (fetchError) {
    console.error("reset-password: Backend fetch failed:", fetchError);
    return NextResponse.json(
      { message: "Unable to reach the server. Make sure the backend is running." },
      { status: 502 }
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    return NextResponse.json(
      { message: "Unexpected response from server." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status: response.status });
}
