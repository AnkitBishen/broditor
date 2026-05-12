"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Eye,
  Lock,
  Mail,
  Monitor,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
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
        {/* ── Left panel — Product info + illustration ── */}
        <section className="glass-panel hidden overflow-hidden p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-5">
              <p className="eyebrow">Browser Activity Monitoring</p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white">
                See what happens in every browser, in real time.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Monitor employee browsing activity across managed devices. Capture page visits,
                downloads, idle time, and policy violations — all scoped to your organization&apos;s
                workspace.
              </p>
            </div>

            {/* ── Illustration — Live monitoring dashboard mockup ── */}
            <div className="mt-8 rounded-[18px] border border-white/10 bg-[#14121b] p-5">
              {/* Mini browser bar */}
              <div className="flex items-center gap-2 mb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b81]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f5b942]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#52d273]" />
                <div className="ml-3 h-6 flex-1 rounded-lg border border-white/10 bg-white/[0.04]" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Active Users", value: "148", icon: Users, color: "text-sky-400" },
                  { label: "Events Today", value: "12.4K", icon: Activity, color: "text-emerald-400" },
                  { label: "Alerts", value: "7", icon: AlertTriangle, color: "text-amber-400" },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                      <p className="mt-2 text-lg font-bold text-white">{stat.value}</p>
                      <p className="text-[11px] text-slate-500">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Activity feed */}
              <div className="space-y-2">
                {[
                  { domain: "docs.google.com", type: "Page Visit", risk: "low", time: "2s ago" },
                  { domain: "github.com", type: "Download", risk: "low", time: "45s ago" },
                  { domain: "malware-site.xyz", type: "Blocked", risk: "high", time: "2m ago" },
                ].map((event) => (
                  <div
                    key={event.domain}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                  >
                    <Monitor className="h-3.5 w-3.5 text-slate-500" />
                    <span className="flex-1 truncate text-xs text-slate-300">
                      {event.domain}
                    </span>
                    <span className="text-[10px] text-slate-500">{event.type}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        event.risk === "high"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {event.risk}
                    </span>
                    <span className="text-[10px] text-slate-600">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                ["Real-time logs", "Every page visit, download, and idle event captured instantly"],
                ["Risk scoring", "Automatic risk levels flag suspicious browsing patterns"],
                ["Admin dashboard", "Full visibility into your team's browser activity"],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-base font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Right panel — Login form ── */}
        <section className="glass-panel mx-auto w-full max-w-xl p-8 md:p-10">
          <Link href="/" className="group mb-6 flex items-center gap-3 transition-opacity hover:opacity-80">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#fc7142] text-sm font-black text-[#1f1b24] shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
              BA
            </span>
            <span className="text-[15px] font-semibold text-white">
              Browser Audit
            </span>
          </Link>

          <div className="mb-8">
            <p className="text-sm font-medium text-slate-400">Browser Activity Audit Platform</p>
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Password</span>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-sky-300 hover:text-sky-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Reset password
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <p>
                Your session is secured with encrypted cookies. All browser activity data is
                scoped to your organization and never shared across tenants.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
