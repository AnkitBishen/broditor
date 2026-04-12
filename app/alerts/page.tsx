import { AlertsClient } from "@/app/alerts/AlertsClient";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type AlertsResponse = {
  items: {
    id: string;
    severity: string;
    status: string;
    alert_type: string;
    trigger_reason: string;
    employee_name: string | null;
    triggered_at: string;
  }[];
};

export default async function AlertsPage() {
  const data = await apiFetchAsCurrentUser<AlertsResponse>("/alerts");
  return <AlertsClient initialItems={data.items} />;
}
