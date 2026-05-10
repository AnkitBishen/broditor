"use client";

import { RefreshCcw, Search, X } from "lucide-react";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import type { TableColumn } from "@/lib/types";
import { cx, formatDateTime } from "@/lib/utils";

type ActivityItem = {
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
};

function badgeTone(value: string) {
  if (value === "critical" || value === "high") return "danger";
  if (value === "medium") return "warn";
  if (value === "low") return "success";
  return "neutral";
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function ActivityClient({
  initialItems
}: {
  initialItems: ActivityItem[];
}) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);

  const employeeNames = useMemo(
    () => [...new Set(initialItems.map((item) => item.employee_name).filter(Boolean))] as string[],
    [initialItems]
  );

  const eventTypes = useMemo(
    () => [...new Set(initialItems.map((item) => item.event_type).filter(Boolean))],
    [initialItems]
  );

  const filtered = initialItems.filter((item) => {
    const q = deferredSearch.toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      (item.employee_name || "").toLowerCase().includes(q) ||
      (item.domain || "").toLowerCase().includes(q) ||
      (item.url || "").toLowerCase().includes(q);

    const matchesUser = selectedUser === "All" || item.employee_name === selectedUser;
    const matchesEvent = selectedEvent === "All" || item.event_type === selectedEvent;
    const matchesRisk = selectedRisk === "All" || item.risk_level === selectedRisk;

    return matchesSearch && matchesUser && matchesEvent && matchesRisk;
  });

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const columns: TableColumn<ActivityItem>[] = [
    {
      key: "employee_name",
      header: "Employee",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.employee_name || "Unassigned device"}</p>
          <p className="text-xs text-slate-400">{row.employee_id || "No employee binding"}</p>
        </div>
      )
    },
    {
      key: "domain",
      header: "Domain",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-slate-200">{row.domain || "n/a"}</p>
          <p className="max-w-[28rem] truncate text-xs text-slate-500">{row.url || ""}</p>
        </div>
      )
    },
    {
      key: "event_type",
      header: "Event type",
      sortable: true,
      render: (row) => <Badge variant="info">{row.event_type}</Badge>
    },
    {
      key: "dwell_seconds",
      header: "Time spent",
      sortable: true,
      sortValue: (row) => row.dwell_seconds ?? 0,
      render: (row) => <p className="font-medium text-white">{row.dwell_seconds ? `${row.dwell_seconds}s` : "0s"}</p>
    },
    {
      key: "risk_level",
      header: "Risk",
      sortable: true,
      render: (row) => <Badge variant={badgeTone(row.risk_level)}>{row.risk_level}</Badge>
    },
    {
      key: "occurred_at",
      header: "Occurred",
      sortable: true,
      sortValue: (row) => new Date(row.occurred_at).getTime(),
      render: (row) => <span className="text-slate-300">{formatDateTime(row.occurred_at)}</span>
    }
  ];

  const metadataEntries = Object.entries(selectedItem?.metadata ?? {});

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-5">
          {/* <div className="section-breadcrumb">
            <span>Browser Audit</span>
            <span>/</span>
            <strong>Work items</strong>
          </div> */}

          <div className="space-y-3">
            <h1 className="page-title">All activity</h1>
            <p className="page-copy max-w-3xl">
              Review incoming browser events across employees, domains, navigation, and risk categories in one dense
              operations stream.
            </p>
          </div>

          {/* <div className="page-tabs">
            <span className="page-tab page-tab-active">All events</span>
            <span className="page-tab">Risk events</span>
            <span className="page-tab">Downloads</span>
            <span className="page-tab">Idle sessions</span>
          </div> */}
        </div>

        {/* <Card > */}
          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.78fr_0.78fr_0.78fr]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="input-surface w-full pl-11"
                placeholder="Search employee, domain, or URL"
              />
            </label>
            <select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)} className="input-surface w-full">
              <option>All</option>
              {employeeNames.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <select value={selectedEvent} onChange={(event) => setSelectedEvent(event.target.value)} className="input-surface w-full">
              <option>All</option>
              {eventTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <select value={selectedRisk} onChange={(event) => setSelectedRisk(event.target.value)} className="input-surface w-full">
              <option>All</option>
              <option>critical</option>
              <option>high</option>
              <option>medium</option>
              <option>low</option>
            </select>
          </div>
        {/* </Card> */}

        <Card
          title="Activity log"
          eyebrow={`${filtered.length} matching records`}
          action={
            <div className="flex items-center gap-2">
              {/* <button type="button" className="gitlab-filter-chip">
                Created date
              </button>
              <button type="button" className="gitlab-filter-chip">
                Sort
              </button> */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gitlab-filter-chip disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw className={cx("h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </button>
            </div>
          }
        >
          <Table<ActivityItem>
            columns={columns}
            data={filtered}
            pageSize={12}
            emptyTitle="No events match these filters"
            emptyCopy="Try clearing one of the filters or broadening your search."
            onRowClick={(row) => setSelectedItem(row)}
          />
        </Card>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-40 bg-slate-950/60 transition-opacity",
          selectedItem ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSelectedItem(null)}
      />

      <aside
        className={cx(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col border-l border-white/10 bg-[#1b1a23] shadow-2xl transition-transform duration-300",
          selectedItem ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="space-y-2">
            <p className="eyebrow">Event details</p>
            <h2 className="text-xl font-semibold text-white">{selectedItem?.domain || selectedItem?.event_type || "Selected event"}</h2>
            <p className="text-sm text-slate-400">
              {selectedItem ? formatDateTime(selectedItem.occurred_at) : "Select a row to inspect metadata."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gitlab-filter-chip disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw className={cx("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {selectedItem ? (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="panel-muted p-4">
                <p className="eyebrow">Employee</p>
                <p className="mt-2 font-medium text-white">{selectedItem.employee_name || "Unassigned device"}</p>
                <p className="mt-1 text-sm text-slate-400">{selectedItem.employee_id || "No employee id"}</p>
              </div>
              <div className="panel-muted p-4">
                <p className="eyebrow">Device</p>
                <p className="mt-2 font-medium text-white">{selectedItem.device_id || "Unknown device"}</p>
                <p className="mt-1 text-sm text-slate-400">{selectedItem.page_title || "No page title"}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="panel-muted p-4">
                <p className="eyebrow">Event type</p>
                <div className="mt-2">
                  <Badge variant="info">{selectedItem.event_type}</Badge>
                </div>
              </div>
              <div className="panel-muted p-4">
                <p className="eyebrow">Risk level</p>
                <div className="mt-2">
                  <Badge variant={badgeTone(selectedItem.risk_level)}>{selectedItem.risk_level}</Badge>
                </div>
              </div>
              <div className="panel-muted p-4">
                <p className="eyebrow">Category</p>
                <p className="mt-2 font-medium text-white">{selectedItem.category || "general"}</p>
              </div>
              <div className="panel-muted p-4">
                <p className="eyebrow">Dwell seconds</p>
                <p className="mt-2 font-medium text-white">{selectedItem.dwell_seconds ?? 0}s</p>
              </div>
            </div>

            <div className="panel-muted p-4">
              <p className="eyebrow">URL</p>
              <p className="mt-2 break-all text-sm text-slate-300">{selectedItem.url || "Not provided"}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Metadata</p>
                <span className="text-xs text-slate-500">{metadataEntries.length} fields</span>
              </div>

              {metadataEntries.length > 0 ? (
                <div className="space-y-3">
                  {/* {metadataEntries.map(([key, value]) => (
                    <div key={key} className="panel-muted p-4">
                      <p className="eyebrow">{key.replace(/_/g, " ")}</p>
                      <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-xs text-slate-300">
                        {formatMetadataValue(value)}
                      </pre>
                    </div>
                  ))} */}
                  <pre
                    style={{
                      background: "#0d1117",
                      color: "#c9d1d9",
                      padding: "16px",
                      borderRadius: "8px",
                      overflowX: "auto"
                    }}
                  >
                    <code>{JSON.stringify(selectedItem, null, 2)}</code>
                  </pre>
                </div>
              ) : (
                <div className="panel-muted p-4 text-sm text-slate-400">
                  No metadata was attached to this event yet.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
