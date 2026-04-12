"use client";

import { createContext, useContext, useState } from "react";
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
