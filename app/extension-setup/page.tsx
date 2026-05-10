import { ExtensionSetupClient } from "@/app/extension-setup/ExtensionSetupClient";
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
  const data = await apiFetchAsCurrentUser<ExtensionSetup>("/admin/extension");
  return <ExtensionSetupClient data={data} />;
}
