import { jwtVerify } from "jose";

import { initials } from "@/lib/utils";
import type { AuthRole, SessionUser } from "@/lib/types";

export const SESSION_COOKIE = "audit_access_token";
export const SESSION_MAX_AGE = 60 * 60 * 24;

const JWT_SECRET = process.env.API_JWT_SECRET ?? "change-this-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

type TokenPayload = {
  userId: string;
  role: AuthRole;
  org_id: string;
  // Optional fields kept for backward compatibility with existing tokens
  email?: string;
  company_id?: string;
  company_name?: string;
  full_name?: string;
};

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const claims = payload as unknown as TokenPayload;

    // The full user profile (name, email, companyName) is hydrated from the
    // backend /api/me endpoint. The token only carries the minimal identity
    // needed for routing and authorization decisions.
    const name = claims.full_name || "";
    return {
      id: claims.userId,
      email: claims.email || "",
      name,
      role: claims.role,
      companyId: claims.company_id || claims.org_id,
      companyName: claims.company_name || "",
      avatar: name ? initials(name) : ""
    };
  } catch {
    return null;
  }
}
