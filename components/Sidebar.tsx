"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  HandHelping,
  LayoutGrid,
  PanelLeftClose,
  UserCircle2,
  UsersRound
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { SessionUser } from "@/lib/types";
import { getDefaultDashboardPath } from "@/lib/routing";
import { cx } from "@/lib/utils";

type SidebarGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  items?: { href: string; label: string }[];
};

function SidebarTooltip({
  label,
  collapsed
}: {
  label: string;
  collapsed: boolean;
}) {
  if (!collapsed) {
    return null;
  }

  return (
    <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-white/10 bg-[#24232e] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
      {label}
    </span>
  );
}

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
  const router = useRouter();
  const dashboardHref = currentUser ? getDefaultDashboardPath(currentUser.role) : "/login";

  const groups = useMemo<SidebarGroup[]>(() => {
    const dashboardItems = [
      { href: dashboardHref, label: "Overview" },
      ...(currentUser?.role === "admin" ? [{ href: "/team", label: "Teams" }] : []),
      { href: "/analytics", label: "Analytics" },
      ...(currentUser?.role === "admin" ? [{ href: "/extension-setup", label: "Extension setup" }] : [])
    ];

    return [
      // {
      //   key: "workspace",
      //   label: currentUser?.companyName ?? "Browser Audit",
      //   icon: LayoutGrid,
      //   href: dashboardHref
      // },
      {
        key: "dashboard",
        label: "Dashboard",
        icon: UsersRound,
        items: dashboardItems
      },
      {
        key: "events",
        label: "Events",
        icon: LayoutGrid,
        items: [
          { href: "/activity", label: "Activity" },
          { href: "/alerts", label: "Alerts" }
        ]
      },
      // {
      //   key: "code",
      //   label: "Code",
      //   icon: FolderGit2,
      //   items: [
      //     { href: "/activity", label: "Events" },
      //     { href: "/team", label: "Employees" },
      //     { href: "/alerts", label: "Tags" }
      //   ]
      // },
      // {
      //   key: "deploy",
      //   label: "Deploy",
      //   icon: Rocket,
      //   items: [
      //     { href: dashboardHref, label: "Fleet" },
      //     { href: "/settings", label: "Policies" }
      //   ]
      // },
      // {
      //   key: "operate",
      //   label: "Operate",
      //   icon: Shield,
      //   items: [
      //     { href: "/settings", label: "Preferences" },
      //     { href: "/profile", label: "Security" }
      //   ]
      // },
      // {
      //   key: "analyze",
      //   label: "Analyze",
      //   icon: Radar,
      //   items: [
      //     { href: "/analytics", label: "Dashboards" },
      //     { href: "/alerts", label: "Reports" }
      //   ]
      // }
      ...(currentUser?.role === "admin"
        ? [
            {
              key: "extension",
              label: "Extension",
              icon: Download,
              href: "/extension-setup"
            }
          ]
        : [])
    ];
  }, [currentUser, dashboardHref]);

  const [expandedKey, setExpandedKey] = useState<string | null>("plan");
  const activeManagedKey = useMemo(() => {
    const activeGroup = groups.find((group) =>
      group.href
        ? pathname === group.href
        : group.items?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    );
    return activeGroup?.key ?? "plan";
  }, [groups, pathname]);

  const effectiveExpandedKey = expandedKey ?? activeManagedKey;

  return (
    <>
      <div
        className={cx(
          "fixed inset-0 z-30 bg-slate-950/65 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cx(
          "fixed bottom-3 left-2 top-[18px] z-40 flex flex-col overflow-hidden rounded-[24px] border backdrop-blur-xl transition-all duration-300",
          "border-white/[0.08] bg-[#1c1b24]/96 shadow-[0_22px_60px_rgba(5,6,10,0.42)]",
          collapsed ? "w-[60px]" : "w-[260px]",
          open ? "translate-x-0" : "-translate-x-[120%]",
          "lg:translate-x-0"
        )}
      >
        <div className={cx("border-b border-white/[0.08] px-3 py-4", collapsed && "px-2")}>
          {!collapsed ? (
            <>
              {/* <p className="px-2 text-[11px] font-semibold text-slate-300">Group</p> */}
              <Link
                href={dashboardHref}
                className="mt-3 flex items-center gap-3 rounded-[14px] bg-[#44556f] px-3 py-3 text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f4f5f7] text-sm font-bold text-[#fc6f41]">
                  BA
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{currentUser?.companyName ?? "Browser Audit"}</p>
                </div>
              </Link>
            </>
          ) : (
            <div className="flex justify-center">
              <Link
                href={dashboardHref}
                className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f4f5f7] font-bold text-[#fc6f41]"
              >
                BA
              </Link>
            </div>
          )}
        </div>

        <div className={cx("flex-1 overflow-y-auto px-2 py-3", collapsed && "px-1.5")}>
          <div className="space-y-1">
            {groups.map((group) => {
              const Icon = group.icon;
              const isDirectActive = group.href ? pathname === group.href || pathname.startsWith(`${group.href}/`) : false;
              const hasActiveChild = group.items?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
              const isExpanded = !collapsed && Boolean(group.items?.length) && effectiveExpandedKey === group.key;
              const isActive = isDirectActive || hasActiveChild;

              if (group.href && !group.items?.length) {
                return (
                  <Link
                    key={group.key}
                    href={group.href}
                    className={cx(
                      "group relative flex items-center gap-3 rounded-[14px] px-3 py-3 text-[15px] transition-colors",
                      isActive ? "bg-[#42556e] text-white" : "text-slate-200 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed ? <span className="font-medium">{group.label}</span> : null}
                    <SidebarTooltip label={group.label} collapsed={collapsed} />
                  </Link>
                );
              }

              return (
                <div key={group.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed && group.items?.[0]) {
                        router.push(group.items[0].href);
                        return;
                      }

                      setExpandedKey((current) => (current === group.key ? null : group.key));
                    }}
                    className={cx(
                      "group relative flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left text-[15px] transition-colors",
                      isActive ? "text-white" : "text-slate-200 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="flex-1 font-medium">{group.label}</span>
                        <ChevronRight
                          className={cx(
                            "h-4 w-4 text-slate-400 transition-transform",
                            isExpanded && "rotate-90"
                          )}
                        />
                      </>
                    ) : null}
                    <SidebarTooltip label={group.label} collapsed={collapsed} />
                  </button>

                  {!collapsed && group.items?.length && isExpanded ? (
                    <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-4">
                      {group.items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cx(
                              "block rounded-[12px] px-3 py-2.5 text-[15px] transition-colors",
                              active ? "bg-[#42556e] font-medium text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className={cx("space-y-1 border-t border-white/[0.08] px-2 py-3", collapsed && "px-1.5")}>
          {([
            // { href: "/analytics", label: "What's new", icon: Activity, bubble: "5" },
            { href: "/settings", label: "Settings", icon: HandHelping },
            { href: "/profile", label: "Profile", icon: UserCircle2 }
          ] as Array<{ href: string; label: string; icon: LucideIcon; bubble?: string }>).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cx(
                  "group relative flex items-center gap-3 rounded-[14px] px-3 py-3 text-[15px] text-slate-200 hover:bg-white/5 hover:text-white",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className="h-5 w-5" />
                {!collapsed ? <span className="flex-1 font-medium">{item.label}</span> : null}
                {!collapsed && item.bubble ? (
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">{item.bubble}</span>
                ) : null}
                <SidebarTooltip label={item.label} collapsed={collapsed} />
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onToggleCollapse}
            className={cx(
              "group relative flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-[15px] text-slate-200 hover:bg-white/5 hover:text-white",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            {!collapsed ? <span className="font-medium">Collapse sidebar</span> : null}
            <SidebarTooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} collapsed={collapsed} />
          </button>
        </div>

        {/* <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-4 bottom-6 hidden h-10 w-10 items-center justify-center rounded-[14px] border border-sky-500/40 bg-[#2a2a35] text-slate-200 shadow-lg lg:inline-flex"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button> */}
      </aside>
    </>
  );
}
