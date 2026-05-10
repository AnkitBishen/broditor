import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { buildExpiredSessionCookie } from "@/lib/session-cookie";
import { canAccessPath, getDefaultDashboardPath, isProtectedPath } from "@/lib/routing";
import { verifySessionToken } from "@/lib/token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("audit_access_token")?.value ?? null;
  const user = await verifySessionToken(token);

  if (pathname === "/login" || pathname === "/register") {
    if (!user) {
      return NextResponse.next();
    }

    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = getDefaultDashboardPath(user.role);
    return NextResponse.redirect(nextUrl);
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    const response = NextResponse.redirect(loginUrl);

    if (token) {
      response.headers.set("Set-Cookie", buildExpiredSessionCookie());
    }

    return response;
  }

  if (!canAccessPath(user.role, pathname)) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname = getDefaultDashboardPath(user.role);
    return NextResponse.redirect(nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/dashboard/:path*", "/activity/:path*", "/users/:path*", "/team/:path*", "/extension-setup/:path*", "/alerts/:path*", "/analytics/:path*", "/settings/:path*", "/profile/:path*"]
};
