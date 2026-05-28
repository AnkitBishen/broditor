"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { api } from "@/lib/api";
import type { AuthContextValue, SessionUser } from "@/lib/types";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  initialUser,
  children
}: {
  initialUser: SessionUser | null;
  children: ReactNode;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  // Sync state when initialUser changes (e.g., after login/logout + router.refresh())
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Hydrate full user profile from the backend.
  // The JWT only carries minimal claims (userId, role, org_id), so fields like
  // name, email, and companyName are empty after token verification. This
  // effect fetches the complete profile from /api/session/me on mount.
  useEffect(() => {
    if (!initialUser) return;

    let cancelled = false;

    api.me().then((fullUser) => {
      if (!cancelled && fullUser) {
        setUser(fullUser);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    setUser,
    logout: async () => {
      await api.logout();
      setUser(null);
    },
    refreshUser: async () => {
      const nextUser = await api.me();
      setUser(nextUser);
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
