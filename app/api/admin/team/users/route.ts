import { NextResponse } from "next/server";

import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await apiRequestAsCurrentUser("/admin/users", {
      method: "POST",
      json: payload
    });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create user." },
      { status: 400 }
    );
  }
}
