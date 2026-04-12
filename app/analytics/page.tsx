import { Badge } from "@/components/Badge";
import { BarList } from "@/components/BarList";
import { Card } from "@/components/Card";
import { LineChart } from "@/components/LineChart";
import { activityTrend, domainUsage, timeSpent, weeklyTrend } from "@/lib/mock-data";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Usage Intelligence</p>
        <h1 className="page-title">Analytics</h1>
        <p className="page-copy max-w-3xl">
          Compare time-on-domain patterns, weekly movement, and browser workload concentration across monitored teams.
        </p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1.35fr_0.95fr]">
        <Card title="Weekly trends" eyebrow="Aggregate activity" action={<Badge variant="info">Last 6 weeks</Badge>}>
          <LineChart data={weeklyTrend} />
        </Card>
        <Card title="Time spent" eyebrow="By business category">
          <BarList data={timeSpent} />
        </Card>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.35fr]">
        <Card title="Domain usage" eyebrow="Top monitored destinations">
          <BarList data={domainUsage} />
        </Card>
        <Card title="Daily sessions" eyebrow="Recent monitored volume">
          <LineChart data={activityTrend} />
        </Card>
      </div>
    </div>
  );
}
