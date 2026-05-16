import { redirect } from "next/navigation";

import { TeamClient } from "@/app/team/TeamClient";
import { getSessionUser } from "@/lib/auth";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type TeamResponse = {
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
};

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard/user");
  }

  const data = await apiFetchAsCurrentUser<TeamResponse>("/admin/dashboard");
  return <TeamClient data={data} />;
}
