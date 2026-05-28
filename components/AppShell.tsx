"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import { useAuth } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { AlertToaster } from "@/components/AlertToaster";
import { cx } from "@/lib/utils";

const publicRoutes = ["/", "/about-us", "/docs", "/help", "/pricing", "/login", "/register"];

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
    <div className="dashboard-shell relative min-h-screen overflow-x-hidden">
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
          sidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[280px]"
        )}
      >
        <div className="px-3 pb-4 md:px-4">
          <Navbar onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="pt-3">
            <section className="glass-panel min-h-[calc(100vh-6.5rem)] overflow-hidden px-5 py-5 md:px-6 md:py-6">
              {children}
            </section>
          </main>
        </div>
      </div>

      <AlertToaster />
    </div>
  );
}
