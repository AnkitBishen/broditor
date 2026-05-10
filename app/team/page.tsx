import { TeamClient } from "@/app/team/TeamClient";
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
  const data = await apiFetchAsCurrentUser<TeamResponse>("/admin/dashboard");
  return <TeamClient data={data} />;
}
