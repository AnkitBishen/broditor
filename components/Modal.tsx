"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

import { cx } from "@/lib/utils";

export function Modal({
  open,
  title,
  description,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="animate-slide-up w-full max-w-xl rounded-3xl border border-white/10 bg-[#1b1c24] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description ? <p className="text-sm text-slate-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cx(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5",
              "text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
