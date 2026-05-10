import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, CircleHelp, Home, Info, ShieldCheck, Tags } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cx } from "@/lib/utils";

type MarketingPage = "home" | "about" | "docs" | "help" | "pricing";

const navItems: Array<{ href: string; label: string; key: MarketingPage; icon: LucideIcon }> = [
  { href: "/", label: "Home", key: "home", icon: Home },
  { href: "/about-us", label: "About us", key: "about", icon: Info },
  { href: "/docs", label: "Docs", key: "docs", icon: BookOpen },
  { href: "/help", label: "Help", key: "help", icon: CircleHelp },
  { href: "/pricing", label: "Pricing", key: "pricing", icon: Tags }
];

export function MarketingShell({
  active,
  children
}: {
  active: MarketingPage;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#18161f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#18161f]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fc7142] text-sm font-black text-[#1f1b24]">
              BA
            </span>
            <span className="truncate text-[15px] font-semibold">Browser Audit</span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "inline-flex h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors",
                    active === item.key ? "bg-white text-[#1f1b24]" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-2">
            <Link
              href="/login"
              className="hidden h-10 items-center justify-center rounded-[10px] border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-white px-4 text-sm font-semibold text-[#1f1b24]"
            >
              Start
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 md:px-6 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cx(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] border px-3 text-sm font-medium",
                  active === item.key
                    ? "border-white bg-white text-[#1f1b24]"
                    : "border-white/10 bg-white/[0.04] text-slate-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-[#14121b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-slate-400 md:grid-cols-[1fr_auto] md:px-6">
          <div>
            <div className="flex items-center gap-3 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#fc7142] text-xs font-black text-[#1f1b24]">
                BA
              </span>
              <span className="font-semibold">Browser Activity Audit & Compliance Platform</span>
            </div>
            <p className="mt-3 max-w-2xl leading-6">
              Tenant-aware browser monitoring, audit trails, and compliance workflows for teams that need visibility
              without losing operational control.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 py-2">
              <ShieldCheck className="h-4 w-4 text-[#66d782]" />
              Security-first sessions
            </span>
            <Link href="/docs" className="rounded-[10px] border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/[0.08]">
              Read docs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-300">{copy}</p>
    </div>
  );
}

export function ProductDashboardVisual() {
  return (
    <div className="relative min-h-[430px] overflow-hidden rounded-[22px] border border-white/10 bg-[#211f2b] p-4 shadow-panel">
      <div className="absolute inset-x-0 top-0 h-16 border-b border-white/10 bg-[#171620]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff6b81]" />
          <span className="h-3 w-3 rounded-full bg-[#f5b942]" />
          <span className="h-3 w-3 rounded-full bg-[#52d273]" />
        </div>
        <div className="h-8 w-44 rounded-[10px] border border-white/10 bg-white/[0.05]" />
      </div>

      <div className="relative mt-9 grid gap-4 lg:grid-cols-[160px_1fr]">
        <aside className="hidden rounded-[16px] border border-white/10 bg-[#181721] p-3 lg:block">
          {["Overview", "Activity", "Alerts", "Devices", "Policies"].map((item, index) => (
            <div
              key={item}
              className={cx(
                "mb-2 rounded-[10px] px-3 py-2 text-xs",
                index === 1 ? "bg-[#fc7142] text-[#1f1b24]" : "bg-white/[0.04] text-slate-300"
              )}
            >
              {item}
            </div>
          ))}
        </aside>

        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Events today", "12,480", "+18%"],
              ["High risk", "37", "live"],
              ["Devices", "842", "healthy"]
            ].map(([label, value, meta]) => (
              <div key={label} className="rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-xs text-[#66d782]">{meta}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] border border-white/10 bg-[#181721] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Risk timeline</p>
                <p className="mt-1 text-xs text-slate-400">Browser sessions, blocklist matches, and dwell signals</p>
              </div>
              <span className="rounded-[10px] bg-[#66d782]/15 px-3 py-1 text-xs text-[#66d782]">Streaming</span>
            </div>
            <div className="mt-5 flex h-28 items-end gap-2">
              {[36, 58, 44, 76, 62, 90, 48, 68, 82, 54, 72, 96].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div
                    className={cx("w-full rounded-t-[8px]", height > 80 ? "bg-[#ff6b81]" : "bg-[#5ca5ff]")}
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Critical alert", "Blocked domain visit from managed device", "Assigned"],
              ["Policy sync", "842 devices refreshed latest blocklist", "Complete"]
            ].map(([title, copy, state]) => (
              <div key={title} className="rounded-[16px] border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{title}</p>
                  <span className="rounded-[8px] border border-white/10 px-2 py-1 text-xs text-slate-300">{state}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
