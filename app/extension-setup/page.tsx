import { redirect } from "next/navigation";

import { ExtensionSetupClient } from "@/app/extension-setup/ExtensionSetupClient";
import { getSessionUser } from "@/lib/auth";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type ExtensionSetup = {
  organization: {
    id: string;
    name: string;
    plan: "starter" | "growth" | "enterprise";
    status: string;
  };
  apiEndpoint: string;
  apiKeyConfigured: boolean;
  downloads: {
    count: number;
    limit: number | null;
    lastDownloadedAt: string | null;
  };
};

export default async function ExtensionSetupPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard/user");
  }

  const data = await apiFetchAsCurrentUser<ExtensionSetup>("/admin/extension");
  return <ExtensionSetupClient data={data} />;
}
