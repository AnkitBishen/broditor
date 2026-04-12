import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { apiFetchAsCurrentUser } from "@/lib/server-api";

type UserDashboardResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "user";
    companyName: string;
  };
  stats: {
    label: string;
    value: string;
    delta: string;
    tone: "info" | "success" | "warn" | "danger";
  }[];
  permissions: string[];
};

export default async function UserDashboardPage() {
  const data = await apiFetchAsCurrentUser<UserDashboardResponse>("/user/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">User Dashboard</p>
        <h1 className="page-title">Welcome back, {data.user.name}</h1>
        <p className="page-copy max-w-3xl">
          This view is scoped to your authenticated session and tenant. It surfaces your current role and protected
          access rights inside {data.user.companyName}.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {data.stats.map((metric) => (
          <Card key={metric.label}>
            <div className="space-y-3">
              <p className="eyebrow">{metric.label}</p>
              <p className="metric-value break-words text-2xl">{metric.value}</p>
              <Badge
                variant={
                  metric.tone === "success"
                    ? "success"
                    : metric.tone === "warn"
                      ? "warn"
                      : metric.tone === "danger"
                        ? "danger"
                        : "info"
                }
              >
                {metric.delta}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Your permissions" eyebrow="Role-based access">
        <div className="grid gap-4 md:grid-cols-3">
          {data.permissions.map((permission) => (
            <div key={permission} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
              {permission}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
