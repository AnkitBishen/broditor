import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const data = await apiRequestAsCurrentUser("/admin/settings", {
      method: "PATCH",
      json: payload
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update settings." },
      { status: 400 }
    );
  }
}
