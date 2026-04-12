import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";
import { getDefaultDashboardPath } from "@/lib/routing";

export default async function DashboardEntryPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  redirect(getDefaultDashboardPath(user.role));
}
