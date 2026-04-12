import { serialize } from "cookie";

import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/token";

export function buildSessionCookie(token: string) {
  return serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE
  });
}

export function buildExpiredSessionCookie() {
  return serialize(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0)
  });
}
