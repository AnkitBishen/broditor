import { cookies } from "next/headers";

import { buildExpiredSessionCookie, buildSessionCookie } from "@/lib/session-cookie";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/token";
import type { SessionUser } from "@/lib/types";

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  return verifySessionToken(token);
}

export { buildExpiredSessionCookie, buildSessionCookie };
