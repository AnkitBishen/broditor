"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/AuthProvider";
import { cx } from "@/lib/utils";

export function Navbar({
  onOpenSidebar
}: {
  onOpenSidebar: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", listener);
    return () => window.removeEventListener("mousedown", listener);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-[#1a1b24]/90 px-4 py-3 shadow-panel backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden min-w-[320px] max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input-surface w-full pl-11 pr-16"
            placeholder="Search users, domains, alerts, or policies"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400">
            /
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <Bell className="h-4 w-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={cx(
              "inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5",
              "text-left text-sm text-slate-200 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 font-semibold text-white">
              {user?.avatar ?? "P"}
            </div>
            <div className="hidden md:block">
              <p className="font-medium leading-tight">{user?.name ?? "Profile"}</p>
              <p className="text-xs capitalize text-slate-400">{user?.role ?? "Session"}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen ? (
            <div className="animate-slide-up absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#1c1d27] p-2 shadow-2xl">
              <div className="border-b border-white/10 px-3 pb-3 pt-2">
                <p className="font-medium text-white">{user?.name ?? "Audit Operator"}</p>
                <p className="text-sm text-slate-400">{user?.email ?? "session@localhost"}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{user?.companyName ?? "Workspace"}</p>
              </div>
              <div className="space-y-1 pt-2">
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
