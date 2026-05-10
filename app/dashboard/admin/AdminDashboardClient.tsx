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
      <div className="space-y-5">
        {/* <div className="section-breadcrumb">
          <span>{data.company.name}</span>
          <span>/</span>
          <strong>Overview</strong>
        </div> */}

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[18px] bg-[#f4f5f7] text-2xl font-bold text-[#fc6f41]">
              BA
            </div>
            <div className="space-y-2">
              <h1 className="page-title">{data.company.name}</h1>
              <p className="page-copy max-w-3xl">
                Central workspace for tenant access, employee coverage, role assignments, and organization-wide browser
                monitoring operations.
              </p>
            </div>
          </div>
        </div>

        {/* <div className="page-tabs">
          <span className="page-tab page-tab-active">Overview</span>
          <span className="page-tab">Members</span>
          <span className="page-tab">Policies</span>
          <span className="page-tab">Activity</span>
        </div> */}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {data.stats.map((metric) => (
          <Card key={metric.label} className="bg-gradient-to-br from-white/[0.03] to-transparent">
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

      <Card
        title="Company users"
        eyebrow={`${data.company.totalUsers} tenant members`}
        action={
          <div className="flex items-center gap-2">
            <div className="gitlab-filter-chip">Role</div>
            <div className="gitlab-filter-chip">Created date</div>
          </div>
        }
      >
        <Table<CompanyUser> columns={columns} data={data.users} pageSize={6} />
      </Card>
    </div>
  );
}
