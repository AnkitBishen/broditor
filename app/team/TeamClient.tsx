"use client";

import { Plus, RefreshCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Table } from "@/components/Table";
import type { TableColumn } from "@/lib/types";
import { cx, initials } from "@/lib/utils";

type TeamResponse = {
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
};

type TeamRow = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Viewer";
  title: string;
  status: "Monitored" | "Pending";
  risk: "Moderate" | "Low";
  createdAt: string;
  avatar: string;
};

function roleVariant(role: TeamRow["role"]) {
  return role === "Admin" ? "role-admin" : "role-viewer";
}

function riskVariant(risk: TeamRow["risk"]) {
  return risk === "Moderate" ? "info" : "success";
}

export function TeamClient({
  data
}: {
  data: TeamResponse;
}) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);

  const rows: TeamRow[] = data.users.map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role === "admin" ? "Admin" : "Viewer",
    title: user.role === "admin" ? "Organization administrator" : "Monitored employee",
    status: "Monitored",
    risk: user.role === "admin" ? "Moderate" : "Low",
    createdAt: user.createdAt,
    avatar: initials(user.fullName)
  }));

  const columns: TableColumn<TeamRow>[] = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/10 text-xs font-semibold text-white">
            {row.avatar}
          </div>
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: "title",
      header: "Title",
      sortable: true
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => <Badge variant={roleVariant(row.role)}>{row.role}</Badge>
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge variant="success">{row.status}</Badge>
    },
    {
      key: "risk",
      header: "Risk",
      sortable: true,
      render: (row) => <Badge variant={riskVariant(row.risk)}>{row.risk}</Badge>
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => <span className="text-slate-300">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="section-breadcrumb">
        <span>{data.company.name}</span>
        <span>/</span>
        <strong>Team</strong>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h1 className="page-title">Team management</h1>
          <p className="page-copy max-w-3xl">
            Manage real tenant members for this workspace, review roles, and prepare invitation workflows for new team
            members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gitlab-button disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={cx("h-4 w-4", isRefreshing && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="gitlab-button-primary h-12 gap-2 px-5"
          >
            <Plus className="h-4 w-4" />
            Add user
          </button>
        </div>
      </div>

      <div className="page-tabs">
        <span className="page-tab page-tab-active">Members</span>
        <span className="page-tab">Groups</span>
        <span className="page-tab">Roles</span>
        <span className="page-tab">Access requests</span>
      </div>

      <Card title="Workspace users" eyebrow={`${rows.length} active seats`}>
        <Table<TeamRow> columns={columns} data={rows} pageSize={8} emptyCopy="No tenant users were found for this workspace yet." />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a new user"
        description="The table is now wired to real tenant members. This modal is still UI-only until the invitation API is added."
      >
        <form className="grid gap-4 md:grid-cols-2">
          <input className="input-surface w-full" placeholder="Full name" />
          <input className="input-surface w-full" placeholder="Email address" />
          <select className="input-surface w-full">
            <option>Admin</option>
            <option>Viewer</option>
          </select>
          <input className="input-surface w-full" placeholder="Team" />
          <textarea
            className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:bg-white/10 focus:ring-0 md:col-span-2"
            placeholder="Access scope, justification, or onboarding notes"
          />
          <div className="flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 text-sm font-semibold text-white"
            >
              Invite user
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
