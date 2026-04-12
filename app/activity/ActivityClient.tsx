"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import type { TableColumn } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type ActivityItem = {
  id: string;
  employee_id: string | null;
  employee_name: string | null;
  domain: string | null;
  event_type: string;
  risk_level: string;
  category: string | null;
  occurred_at: string;
  url: string | null;
};

function badgeTone(value: string) {
  if (value === "critical" || value === "high") return "danger";
  if (value === "medium") return "warn";
  if (value === "low") return "success";
  return "neutral";
}

export function ActivityClient({
  initialItems
}: {
  initialItems: ActivityItem[];
}) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedEvent, setSelectedEvent] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");

  const employeeNames = useMemo(
    () => [...new Set(initialItems.map((item) => item.employee_name).filter(Boolean))] as string[],
    [initialItems]
  );

  const eventTypes = useMemo(
    () => [...new Set(initialItems.map((item) => item.event_type).filter(Boolean))],
    [initialItems]
  );

  const filtered = initialItems.filter((item) => {
    const q = search.toLowerCase();
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
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => <Badge variant="neutral">{row.category || "general"}</Badge>
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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Audit Trail</p>
        <h1 className="page-title">Activity timeline</h1>
        <p className="page-copy max-w-3xl">
          Explore ingested browser events across employees, domains, event types, and risk categories.
        </p>
      </div>

      <Card title="Filters" eyebrow="Refine the event stream">
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.7fr]">
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
      </Card>

      <Card title="Activity log" eyebrow={`${filtered.length} matching records`}>
        <Table<ActivityItem>
          columns={columns}
          data={filtered}
          pageSize={12}
          emptyTitle="No events match these filters"
          emptyCopy="Try clearing one of the filters or broadening your search."
        />
      </Card>
    </div>
  );
}
