import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { getSessionUser } from "@/lib/auth";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Browser Activity Audit & Compliance Platform",
  description: "GitLab-inspired B2B SaaS dashboard for browser monitoring, audit trails, and compliance workflows."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const currentUser = await getSessionUser();

  return (
    <html lang="en">
      <body className="font-[family:var(--font-sans)] antialiased">
        <AuthProvider initialUser={currentUser}>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
