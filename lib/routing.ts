import type { AuthRole } from "@/lib/types";

export const ADMIN_ONLY_PREFIXES = ["/dashboard/admin", "/team", "/users", "/extension-setup"] as const;
export const SHARED_PROTECTED_PREFIXES = [
  "/dashboard/user",
  "/activity",
  "/alerts",
  "/analytics",
  "/settings",
  "/profile"
] as const;
export const PROTECTED_PREFIXES = ["/dashboard", ...ADMIN_ONLY_PREFIXES, ...SHARED_PROTECTED_PREFIXES] as const;
export const PUBLIC_PATHS = ["/", "/login", "/register"] as const;

export function getDefaultDashboardPath(role: AuthRole) {
  return role === "admin" ? "/dashboard/admin" : "/dashboard/user";
}

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function canAccessPath(role: AuthRole, pathname: string) {
  if (!pathname.startsWith("/")) {
    return false;
  }

  if (!isProtectedPath(pathname)) {
    return true;
  }

  if (role === "admin") {
    return true;
  }

  return !isAdminOnlyPath(pathname) && !pathname.startsWith("/dashboard/admin");
}
