import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { apiFetchAsCurrentUser } from "@/lib/server-api";
import type { SessionUser } from "@/lib/types";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { user } = await apiFetchAsCurrentUser<{ user: SessionUser }>("/me");

  return <ProfileClient initialUser={user} />;
}
