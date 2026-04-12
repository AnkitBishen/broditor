"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import type { TableColumn } from "@/lib/types";

type AdminDashboardResponse = {
  company: {
    id: string;
    name: string;
    totalUsers: number;
  };
  users: {
    id: string;
    fullName: string;
    email: string;
    role: "admin" | "user";
    createdAt: string;
  }[];
  stats: {
    label: string;
    value: string;
    delta: string;
    tone: "info" | "success" | "warn" | "danger";
  }[];
};

type CompanyUser = AdminDashboardResponse["users"][number];

export function AdminDashboardClient({
  data
}: {
  data: AdminDashboardResponse;
}) {
  const columns: TableColumn<CompanyUser>[] = [
    {
      key: "fullName",
      header: "User",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.fullName}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      )
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => <Badge variant={row.role === "admin" ? "role-admin" : "role-viewer"}>{row.role}</Badge>
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => <span className="text-slate-300">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Admin Dashboard</p>
        <h1 className="page-title">{data.company.name}</h1>
        <p className="page-copy max-w-3xl">
          Manage company users, review tenant access, and confirm that role-based authorization is scoped correctly for
          this workspace.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {data.stats.map((metric) => (
          <Card key={metric.label} className="bg-gradient-to-br from-white/[0.05] to-transparent">
            <div className="space-y-3">
              <p className="eyebrow">{metric.label}</p>
              <p className="metric-value">{metric.value}</p>
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

      <Card title="Company users" eyebrow={`${data.company.totalUsers} tenant members`}>
        <Table<CompanyUser> columns={columns} data={data.users} pageSize={6} />
      </Card>
    </div>
  );
}
