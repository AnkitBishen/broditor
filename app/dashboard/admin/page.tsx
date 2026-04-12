import { AdminDashboardClient } from "@/app/dashboard/admin/AdminDashboardClient";
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
  const data = await apiFetchAsCurrentUser<AdminDashboardResponse>("/admin/dashboard");
  return <AdminDashboardClient data={data} />;
}
