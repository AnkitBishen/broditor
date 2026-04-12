"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { cx } from "@/lib/utils";

const publicRoutes = ["/", "/login", "/register"];

export function AppShell({
  children
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const simpleLayout = publicRoutes.some((route) => route === pathname);

  if (simpleLayout) {
    return <div className="dashboard-shell">{children}</div>;
  }

  return (
    <div className="dashboard-shell relative pb-4">
      <Sidebar
        currentUser={user}
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      />

      <div
        className={cx(
          "transition-[padding] duration-300",
          sidebarCollapsed ? "lg:pl-[120px]" : "lg:pl-[316px]"
        )}
      >
        <div className="space-y-6 p-4 md:p-5">
          <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        </div>
      </div>
    </div>
  );
}
