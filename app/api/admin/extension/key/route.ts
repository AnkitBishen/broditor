import { NextResponse } from "next/server";

import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function POST() {
  try {
    const data = await apiRequestAsCurrentUser("/admin/extension-key/rotate", {
      method: "POST"
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to rotate extension API key." },
      { status: 400 }
    );
  }
}
