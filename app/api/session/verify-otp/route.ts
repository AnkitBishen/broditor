import { NextResponse } from "next/server";

import { verifyOtp } from "@/lib/otp-store";
import type { RegisterPayload } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function POST(request: Request) {
  let body: RegisterPayload & { otp?: string };

  try {
    body = (await request.json()) as RegisterPayload & { otp?: string };
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 }
    );
  }

  const email = String(body.email || "").trim().toLowerCase();
  const otp = String(body.otp || "").trim();

  if (!email || !otp) {
    return NextResponse.json(
      { message: "Email and verification code are required." },
      { status: 400 }
    );
  }

  // Verify the OTP
  const verification = verifyOtp(email, otp);
  if (!verification.valid) {
    return NextResponse.json(
      { message: verification.message },
      { status: 400 }
    );
  }

  // OTP is valid — proceed with registration on the backend
  const backendUrl = `${API_BASE_URL}/auth/register`.replace(/([^:])\/\/+/g, "$1/");

  let response: Response;
  try {
    response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: body.fullName,
        email: body.email,
        organization: body.organization,
        password: body.password,
      }),
      cache: "no-store",
    });
  } catch (fetchError) {
    console.error("verify-otp: Backend fetch failed:", fetchError);
    return NextResponse.json(
      {
        message:
          "Unable to reach the registration server. Make sure the backend is running.",
      },
      { status: 502 }
    );
  }

  let data: Record<string, unknown>;
  try {
    data = await response.json();
  } catch {
    console.error(
      "verify-otp: Failed to parse backend response. Status:",
      response.status
    );
    return NextResponse.json(
      { message: "Unexpected response from registration server." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status: response.status });
}
