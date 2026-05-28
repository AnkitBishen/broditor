import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    const data = await apiRequestAsCurrentUser(`/alerts/${id}`, {
      method: "PATCH",
      json: payload
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update alert." },
      { status: 400 }
    );
  }
}
