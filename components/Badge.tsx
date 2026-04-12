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
  neutral: "border-white/10 bg-white/8 text-slate-200",
  info: "border-sky-500/30 bg-sky-500/15 text-sky-200",
  success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  warn: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  danger: "border-rose-500/30 bg-rose-500/15 text-rose-200",
  purple: "border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200",
  "role-admin": "border-orange-500/30 bg-orange-500/15 text-orange-200",
  "role-manager": "border-blue-500/30 bg-blue-500/15 text-blue-200",
  "role-viewer": "border-slate-500/30 bg-slate-500/15 text-slate-200"
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
