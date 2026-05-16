import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await apiRequestAsCurrentUser(`/admin/blocklist/${id}`, {
      method: "DELETE"
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to remove from blocklist." },
      { status: 400 }
    );
  }
}
