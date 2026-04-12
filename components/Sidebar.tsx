"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  UsersRound
} from "lucide-react";

import type { SessionUser } from "@/lib/types";
import { getDefaultDashboardPath } from "@/lib/routing";
import { cx } from "@/lib/utils";

export function Sidebar({
  currentUser,
  collapsed,
  open,
  onClose,
  onToggleCollapse
}: {
  currentUser: SessionUser | null;
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const navSections = [
    {
      title: "Monitor",
      items: [
        { href: currentUser ? getDefaultDashboardPath(currentUser.role) : "/login", label: "Dashboard", icon: BarChart3 },
        { href: "/activity", label: "Activity", icon: Activity },
        { href: "/alerts", label: "Alerts", icon: AlertTriangle }
      ]
    },
    {
      title: "Govern",
      items:
        currentUser?.role === "admin"
          ? [
              { href: "/team", label: "Team", icon: UsersRound },
              { href: "/analytics", label: "Analytics", icon: ShieldCheck },
              { href: "/settings", label: "Settings", icon: Settings }
            ]
          : [
              { href: "/analytics", label: "Analytics", icon: ShieldCheck },
              { href: "/settings", label: "Settings", icon: Settings }
            ]
    }
  ];

  return (
    <>
      <div
        className={cx(
          "fixed inset-0 z-30 bg-slate-950/60 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cx(
          "fixed inset-y-4 left-4 z-40 flex flex-col rounded-[28px] border border-white/10 bg-[#191a22]/95 shadow-2xl backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-[92px]" : "w-[288px]",
          open ? "translate-x-0" : "-translate-x-[120%]",
          "lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 text-lg font-semibold text-white">
            BA
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Compliance Hub</p>
              <p className="truncate text-base font-semibold text-white">Browser Audit Cloud</p>
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {!collapsed ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Workspace</p>
              <p className="mt-2 text-lg font-semibold text-white">{currentUser?.companyName ?? "Browser Audit Cloud"}</p>
              <p className="mt-1 text-sm capitalize text-slate-400">
                {currentUser ? `${currentUser.role} access for monitored browser operations` : "Audit and compliance command center"}
              </p>
            </div>
          ) : null}

          {navSections.map((section) => (
            <div key={section.title} className="space-y-2">
              {!collapsed ? <p className="px-3 text-xs uppercase tracking-[0.24em] text-slate-500">{section.title}</p> : null}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-slate-600/45 text-white"
                          : "text-slate-300 hover:bg-white/[0.04] hover:text-white",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-white/10 p-3">
          <Link
            href="/profile"
            className={cx(
              "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white",
              collapsed && "justify-center px-0"
            )}
          >
            <ShieldCheck className="h-5 w-5" />
            {!collapsed ? <span>Profile</span> : null}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx(
              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white",
              collapsed && "justify-center px-0"
            )}
          >
            <PanelLeftClose className="h-5 w-5" />
            {!collapsed ? <span>Collapse sidebar</span> : null}
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-4 top-10 hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#1c1d27] text-slate-300 shadow-lg lg:inline-flex"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
