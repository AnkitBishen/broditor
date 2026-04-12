"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/api";
import { canAccessPath, isProtectedPath } from "@/lib/routing";
import type { AuthRole } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirectTo");

  const resolveRedirect = (role: AuthRole, fallback: string) => {
    if (redirectTo && redirectTo.startsWith("/") && isProtectedPath(redirectTo) && canAccessPath(role, redirectTo)) {
      return redirectTo;
    }

    return fallback;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await api.login(email, password);
    const data = (await response.json()) as {
      message?: string;
      redirectTo?: string;
      user?: { role: AuthRole };
    };

    if (!response.ok || !data.user?.role || !data.redirectTo) {
      setError(data.message ?? "Unable to sign in.");
      setSubmitting(false);
      return;
    }

    router.push(resolveRedirect(data.user.role, data.redirectTo));
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="glass-panel hidden overflow-hidden p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-5">
              <p className="eyebrow">Multi-tenant Authentication</p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white">
                Sign in to your isolated company workspace.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                JWT-backed sessions, role-aware route protection, and company-scoped access keep every admin and user in
                the right tenant.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Tenant-aware login", "Every session includes company and role claims"],
                ["Admin routing", "Admins land in the company management dashboard"],
                ["User routing", "Standard users reach their personal dashboard automatically"]
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-base font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel mx-auto w-full max-w-xl p-8 md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-lg font-semibold text-white">
              BA
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Browser Activity Audit Platform</p>
              <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-surface w-full pl-11"
                  required
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-surface w-full pl-11"
                  required
                />
              </div>
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4">
            <Link href="/register" className="text-sm font-medium text-sky-300 hover:text-sky-200">
              Create a workspace
            </Link>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              HTTP-only JWT cookie session
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <p>
                This frontend stores the JWT in an HTTP-only cookie via a Next.js session route, which is safer than
                putting access tokens in localStorage.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
