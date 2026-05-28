"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import { useAuth } from "@/components/AuthProvider";
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
  occurrence_count?: number;
};

function severityVariant(severity: string) {
  const s = severity.toLowerCase();
  if (s === "high" || s === "critical") return "danger";
  if (s === "medium") return "warn";
  return "info";
}

export function AlertsClient({
  initialItems
}: {
  initialItems: AlertItem[];
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<AlertItem[]>(initialItems);
  const [severity, setSeverity] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || `http://${window.location.hostname}:4000/api`;
    const wsUrl = new URL(apiBase);
    wsUrl.protocol = protocol;
    wsUrl.pathname = "/ws/dashboard";

    let socket: WebSocket;

    async function connect() {
      try {
        const res = await fetch("/api/session/ws-token");
        const { token } = await res.json();
        if (!token) {
          console.warn("[AlertsClient] WS token is null, retrying connection in 5s...");
          setTimeout(connect, 5000);
          return;
        }

        wsUrl.searchParams.set("token", token);
        socket = new WebSocket(wsUrl.toString());

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_ALERT") {
              const newAlert = data.alert;
              const mappedAlert: AlertItem = {
                id: newAlert.id,
                severity: newAlert.severity,
                status: newAlert.status || "open",
                alert_type: newAlert.alert_type,
                trigger_reason: newAlert.trigger_reason,
                employee_name: newAlert.employee_name || (newAlert.employee_id ? "Monitored employee" : "Unassigned device"),
                triggered_at: newAlert.triggered_at,
                occurrence_count: newAlert.occurrence_count || 1
              };

              setItems((prev) => {
                const exists = prev.some((item) => item.id === mappedAlert.id);
                if (exists) {
                  return prev.map((item) =>
                    item.id === mappedAlert.id
                      ? {
                          ...item,
                          occurrence_count: mappedAlert.occurrence_count,
                          trigger_reason: mappedAlert.trigger_reason
                        }
                      : item
                  );
                } else {
                  return [mappedAlert, ...prev];
                }
              });
            }
          } catch (err) {
            console.error("[AlertsClient] WS Message error:", err);
          }
        };

        socket.onclose = () => {
          setTimeout(connect, 5000);
        };
      } catch (err) {
        console.error("[AlertsClient] WS Connect error:", err);
        setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      socket?.close();
    };
  }, [user]);

  const filtered = items.filter((alert) => {
    const matchesSeverity = severity === "All" || alert.severity.toLowerCase() === severity.toLowerCase();
    const matchesStatus = status === "All" || alert.status.toLowerCase() === status.toLowerCase();
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-3">
          <h1 className="page-title">Alert stream</h1>
          <p className="page-copy max-w-3xl">
            Review triggered compliance alerts, filter by severity or status, and triage the highest-risk activity
            first.
          </p>
        </div>
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
            <Link key={alert.id} href={`/alerts/${alert.id}`} className="block">
              <article className="rounded-[16px] border border-white/10 bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.06]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                      <Badge variant={alert.status === "resolved" ? "success" : alert.status === "dismissed" ? "neutral" : "warn"}>
                        {alert.status}
                      </Badge>
                      <Badge variant="purple">{alert.alert_type}</Badge>
                      {alert.occurrence_count && alert.occurrence_count > 1 ? (
                        <Badge variant="danger">x{alert.occurrence_count}</Badge>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-semibold text-white">{alert.trigger_reason}</h2>
                    <p className="text-sm text-slate-400">{alert.employee_name || "Unassigned device"} - {alert.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-400">{formatDateTime(alert.triggered_at)}</p>
                    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
