"use client";

import { useState } from "react";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { formatDateTime } from "@/lib/utils";

type AlertItem = {
  id: string;
  severity: string;
  status: string;
  alert_type: string;
  trigger_reason: string;
  employee_name: string | null;
  triggered_at: string;
};

function severityVariant(severity: string) {
  if (severity === "high" || severity === "critical") return "danger";
  if (severity === "medium") return "warn";
  return "info";
}

export function AlertsClient({
  initialItems
}: {
  initialItems: AlertItem[];
}) {
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");

  const filtered = initialItems.filter((alert) => {
    const matchesSeverity = severity === "All" || alert.severity === severity;
    const matchesStatus = status === "All" || alert.status === status;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {/* <div className="section-breadcrumb">
          <span>Browser Audit</span>
          <span>/</span>
          <strong>Alerts</strong>
        </div> */}
        <div className="space-y-3">
          <h1 className="page-title">Alert stream</h1>
          <p className="page-copy max-w-3xl">
            Review triggered compliance alerts, filter by severity or status, and triage the highest-risk activity
            first.
          </p>
        </div>
        {/* <div className="page-tabs">
          <span className="page-tab page-tab-active">Open alerts</span>
          <span className="page-tab">Assigned</span>
          <span className="page-tab">Resolved</span>
          <span className="page-tab">Dismissed</span>
        </div> */}
      </div>

      <Card
        title="Alert stream"
        eyebrow="Real-time alert pipeline"
        action={
          <div className="flex gap-3">
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="input-surface w-32">
              <option>All</option>
              <option>high</option>
              <option>medium</option>
              <option>low</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-surface w-36">
              <option>All</option>
              <option>open</option>
              <option>resolved</option>
              <option>dismissed</option>
              <option>snoozed</option>
            </select>
          </div>
        }
      >
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
              <p className="text-lg font-semibold text-white">No alerts match the current filters</p>
              <p className="mt-2 text-sm text-slate-400">Try widening the severity or status filters.</p>
            </div>
          ) : null}

          {filtered.map((alert) => (
            <article key={alert.id} className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                    <Badge variant={alert.status === "resolved" ? "success" : alert.status === "dismissed" ? "neutral" : "warn"}>
                      {alert.status}
                    </Badge>
                    <Badge variant="purple">{alert.alert_type}</Badge>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{alert.trigger_reason}</h2>
                  <p className="text-sm text-slate-400">{alert.employee_name || "Unassigned device"} - {alert.id}</p>
                </div>
                <p className="text-sm text-slate-400">{formatDateTime(alert.triggered_at)}</p>
              </div>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
