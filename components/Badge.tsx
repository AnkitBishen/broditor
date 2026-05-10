"use client";

import type { ReactNode } from "react";

import { cx } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "info"
  | "success"
  | "warn"
  | "danger"
  | "purple"
  | "role-admin"
  | "role-manager"
  | "role-viewer";

const variants: Record<BadgeVariant, string> = {
  neutral: "border-white/10 bg-[#3e3c47] text-slate-100",
  info: "border-sky-500/40 bg-sky-500/18 text-sky-100",
  success: "border-emerald-500/40 bg-emerald-500/18 text-emerald-100",
  warn: "border-amber-500/45 bg-amber-500/18 text-amber-100",
  danger: "border-rose-500/45 bg-rose-500/18 text-rose-100",
  purple: "border-fuchsia-500/40 bg-fuchsia-500/18 text-fuchsia-100",
  "role-admin": "border-orange-500/45 bg-orange-500/18 text-orange-100",
  "role-manager": "border-blue-500/45 bg-blue-500/18 text-blue-100",
  "role-viewer": "border-slate-500/40 bg-slate-500/18 text-slate-100"
};

export function Badge({
  children,
  variant = "neutral",
  className
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium leading-none tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
