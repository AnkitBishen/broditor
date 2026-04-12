import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { getUserProfile } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

function toneVariant(tone: "info" | "success" | "warn" | "danger") {
  if (tone === "success") return "success";
  if (tone === "warn") return "warn";
  if (tone === "danger") return "danger";
  return "info";
}

function riskVariant(risk: "Low" | "Moderate" | "Elevated" | "Critical") {
  if (risk === "Critical") return "danger";
  if (risk === "Elevated") return "warn";
  if (risk === "Moderate") return "info";
  return "success";
}

export default async function UserDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserProfile(id);

  return (
    <div className="space-y-6">
      <section className="glass-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-2xl font-semibold text-white">
              {user.avatar}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white">{user.name}</h1>
                <Badge variant={riskVariant(user.risk)}>{user.risk} risk</Badge>
              </div>
              <p className="text-slate-300">{user.title}</p>
              <p className="text-sm text-slate-400">
                {user.email} • {user.team} • {user.timezone}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {user.focusAreas.map((item) => (
              <Badge key={item} variant="purple">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-slate-400">{user.bio}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {user.stats.map((stat) => (
          <Card key={stat.label}>
            <div className="space-y-3">
              <p className="eyebrow">{stat.label}</p>
              <p className="metric-value">{stat.value}</p>
              <Badge variant={toneVariant(stat.tone)}>{stat.delta}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Activity timeline" eyebrow="Recent actions">
        <div className="space-y-4">
          {user.timeline.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <Badge variant={toneVariant(item.tone)}>{item.title}</Badge>
                  <p className="text-sm text-slate-300">{item.description}</p>
                </div>
                <p className="text-sm text-slate-400">{formatDateTime(item.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
