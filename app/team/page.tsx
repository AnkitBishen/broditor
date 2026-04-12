"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Table } from "@/components/Table";
import { teamMembers } from "@/lib/mock-data";
import type { TeamMember } from "@/lib/types";

function roleVariant(role: TeamMember["role"]) {
  if (role === "Admin") return "role-admin";
  if (role === "Manager") return "role-manager";
  return "role-viewer";
}

function riskVariant(risk: TeamMember["risk"]) {
  if (risk === "Critical") return "danger";
  if (risk === "Elevated") return "warn";
  if (risk === "Moderate") return "info";
  return "success";
}

export default function TeamPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const columns = [
    {
      key: "name",
      header: "User",
      sortable: true,
      render: (row: TeamMember) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
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
      render: (row: TeamMember) => <Badge variant={roleVariant(row.role)}>{row.role}</Badge>
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row: TeamMember) => (
        <Badge variant={row.status === "Online" ? "success" : row.status === "Idle" ? "warn" : "neutral"}>
          {row.status}
        </Badge>
      )
    },
    {
      key: "risk",
      header: "Risk",
      sortable: true,
      render: (row: TeamMember) => <Badge variant={riskVariant(row.risk)}>{row.risk}</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <p className="eyebrow">Access Control</p>
          <h1 className="page-title">Team management</h1>
          <p className="page-copy max-w-3xl">
            Manage browser audit platform users, review current roles, and prepare invitation workflows for new team
            members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <Card title="Workspace users" eyebrow={`${teamMembers.length} active seats`}>
        <Table<TeamMember> columns={columns} data={teamMembers} pageSize={6} />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add a new user"
        description="UI-only modal for now. Wire this form to your real invitation API when ready."
      >
        <form className="grid gap-4 md:grid-cols-2">
          <input className="input-surface w-full" placeholder="Full name" />
          <input className="input-surface w-full" placeholder="Email address" />
          <select className="input-surface w-full">
            <option>Admin</option>
            <option>Manager</option>
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
