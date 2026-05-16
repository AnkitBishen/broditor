import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await apiRequestAsCurrentUser("/auth/change-password", {
      method: "POST",
      json: payload
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to change password." },
      { status: 400 }
    );
  }
}
