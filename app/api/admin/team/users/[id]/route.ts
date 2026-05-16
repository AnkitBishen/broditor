import { NextResponse } from "next/server";
import { apiRequestAsCurrentUser } from "@/lib/server-api";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`[PROXY] DELETE /api/admin/team/users/${id}`);
    const data = await apiRequestAsCurrentUser(`/admin/users/${id}`, {
      method: "DELETE"
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[PROXY] Error in DELETE:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete user." },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json();
    console.log(`[PROXY] PATCH /api/admin/team/users/${id} - Payload:`, JSON.stringify(payload));
    const data = await apiRequestAsCurrentUser(`/admin/users/${id}/role`, {
      method: "PATCH",
      json: payload
    });

    return NextResponse.json(data);
  } catch (error) {
    // console.error(`[PROXY] Error in PATCH /api/admin/team/users/${id}:`, error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update user role." },
      { status: 400 }
    );
  }
}
