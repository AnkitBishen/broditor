import { NextResponse } from "next/server";

import { apiDownloadAsCurrentUser } from "@/lib/server-api";

export async function POST() {
  try {
    const response = await apiDownloadAsCurrentUser("/admin/extension/download", {
      method: "POST"
    });
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "application/zip",
        "Content-Disposition":
          response.headers.get("Content-Disposition") ?? 'attachment; filename="browser-audit-extension.zip"',
        "X-Extension-Download-Count": response.headers.get("X-Extension-Download-Count") ?? ""
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to download extension." },
      { status: 400 }
    );
  }
}
