import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function GET() {
  try {
    const data = await apiRequestAsCurrentUser("/devices/mine", {
      method: "GET"
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load devices." },
      { status: 400 }
    );
  }
}
