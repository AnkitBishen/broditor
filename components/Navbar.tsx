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
    <header className="sticky top-0 z-20 -mx-3 border-white/[0.08] px-3 py-3 backdrop-blur-xl md:-mx-4 md:px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.06] text-slate-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-3 text-white">
            <img 
              src="/logo.png" 
              alt="Broditor" 
              className="h-9 w-9 shrink-0 rounded-[10px] object-cover" 
            />
            <span className="hidden text-[15px] font-semibold sm:inline">Broditor</span>
          </Link>
        </div>

        {/* <nav className="hidden items-center gap-8 text-[15px] text-white lg:flex">
          <Link href="/dashboard">Why BrowserAudit</Link>
          <Link href="/analytics">Pricing</Link>
          <Link href="/activity">Explore</Link>
        </nav> */}

        <div className="relative hidden max-w-[470px] flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input-surface w-full pl-11 pr-16" placeholder="Search or go to..." />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[8px] bg-[#242330] px-2 py-1 text-xs font-semibold text-slate-300">
            /
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="hidden h-11 items-center rounded-[12px] bg-[#f4f5f7] px-5 text-sm font-medium text-[#1d1b24] xl:inline-flex"
          >
            Security guide
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className={cx(
                "inline-flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.06] px-4 py-2.5",
                "text-sm text-slate-100 hover:bg-white/10"
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f4f5f7] text-sm font-semibold text-[#1d1b24]">
                {user?.avatar ?? "P"}
              </div>
              <span className="hidden font-medium md:inline">Profile</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>

            {menuOpen ? (
              <div className="animate-slide-up absolute right-0 mt-2 w-72 rounded-[18px] border border-white/10 bg-[#1f1d27] p-2 shadow-2xl">
                <div className="border-b border-white/10 px-3 pb-3 pt-2">
                  <p className="font-medium text-white">{user?.name ?? "Audit Operator"}</p>
                  <p className="text-sm text-slate-400">{user?.email ?? "session@localhost"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{user?.companyName ?? "Workspace"}</p>
                </div>
                <div className="space-y-1 pt-2">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    Profile page
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
