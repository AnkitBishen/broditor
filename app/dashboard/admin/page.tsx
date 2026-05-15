import { redirect } from "next/navigation";

import { AdminDashboardClient } from "@/app/dashboard/admin/AdminDashboardClient";
import { getSessionUser } from "@/lib/auth";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type AdminDashboardResponse = {
  company: {
    id: string;
    name: string;
    totalUsers: number;
  };
  users: {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
  }[];
  stats: {
    label: string;
    value: string;
    delta: string;
    tone: "info" | "success" | "warn" | "danger";
  }[];
};

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard/user");
  }

  const data = await apiFetchAsCurrentUser<AdminDashboardResponse>("/admin/dashboard");
  return <AdminDashboardClient data={data} />;
}
