import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { apiFetchAsCurrentUser } from "@/lib/server-api";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  let data: any = {};

  if (user.role === "admin") {
    const [settingsData, blocklistData] = await Promise.all([
      apiFetchAsCurrentUser<any>("/admin/settings"),
      apiFetchAsCurrentUser<any>("/config/blocklist")
    ]);
    data = {
      ...settingsData,
      blocklist: blocklistData.blocklist
    };
  } else {
    const devices = await apiFetchAsCurrentUser<any[]>("/devices/mine");
    data = { devices };
  }

  return <SettingsClient initialData={data} />;
}
