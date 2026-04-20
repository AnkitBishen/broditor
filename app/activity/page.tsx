import { ActivityClient } from "@/app/activity/ActivityClient";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type ActivityTimelineResponse = {
  items: {
    id: string;
    employee_id: string | null;
    employee_name: string | null;
    device_id: string | null;
    domain: string | null;
    event_type: string;
    dwell_seconds: number | null;
    risk_level: string;
    category: string | null;
    occurred_at: string;
    page_title: string | null;
    url: string | null;
    metadata: Record<string, unknown> | null;
  }[];
};

export default async function ActivityPage() {
  const data = await apiFetchAsCurrentUser<ActivityTimelineResponse>("/activity/timeline");
  return <ActivityClient initialItems={data.items} />;
}
