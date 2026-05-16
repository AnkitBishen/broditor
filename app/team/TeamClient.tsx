"use client";

import { Plus, RefreshCcw, Settings, Trash2, Edit2, Loader2 } from "lucide-react";
import { type FormEvent, useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Table } from "@/components/Table";
import type { TableColumn } from "@/lib/types";
import { cx, initials, formatDate } from "@/lib/utils";

type TeamResponse = {
  company: {
    id: string;
    name: string;
    totalUsers: number;
    ownerId?: string;
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
  role: "admin" | "user";
  title: string;
  status: "Monitored" | "Pending";
  createdAt: string;
  avatar: string;
};

function roleVariant(role: string) {
  return role === "admin" ? "role-admin" : "role-viewer";
}

export function TeamClient({
  data
}: {
  data: TeamResponse;
}) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Role
  const [editingUser, setEditUser] = useState<{ id: string, name: string, role: string } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete User
  const [deletingUser, setDeletingUser] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const rows: TeamRow[] = data.users.map((user) => ({
    id: user.id,
    name: user.fullName,
    email: user.email,
    role: user.role,
    title: user.role === "admin" ? "Organization administrator" : "Monitored employee",
    status: "Monitored",
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
      render: (row) => <Badge variant={roleVariant(row.role)} className="capitalize">{row.role}</Badge>
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <Badge variant="success">{row.status}</Badge>
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      render: (row) => <span className="text-slate-300">{formatDate(row.createdAt)}</span>
    },
    {
      key: "actions",
      header: "Settings",
      className: "text-right",
      render: (row) => {
        const isOwner = data.company.ownerId === row.id;
        if (isOwner) return <Badge variant="neutral">Owner</Badge>;

        return (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditUser({ id: row.id, name: row.name, role: row.role })}
              className="text-slate-400 hover:text-white"
              title="Edit Role"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeletingUser({ id: row.id, name: row.name })}
              className="text-slate-400 hover:text-red-400"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      }
    }
  ];

  const handleRefresh = () => {
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSaving(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      role: String(form.get("role") || "user"),
      password: String(form.get("password") || "")
    };

    try {
      const response = await fetch("/api/admin/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || "Unable to create user.");
      }

      setModalOpen(false);
      event.currentTarget.reset();
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to create user.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsUpdatingRole(true);
    try {
      const response = await fetch(`/api/admin/team/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editingUser.role })
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.message || "Failed to update role");
      setEditUser(null);
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update role");
      console.error(error);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/team/users/${deletingUser.id}`, {
        method: "DELETE"
      });
      const resData = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(resData.message || "Failed to delete user");
      setDeletingUser(null);
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete user");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={cx("space-y-6", isRefreshing && "opacity-60 pointer-events-none transition-opacity")}>
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

      <Card title="Workspace users" eyebrow={`${rows.length} active seats`}>
        <Table<TeamRow> columns={columns} data={rows} pageSize={8} emptyCopy="No tenant users were found for this workspace yet." />
      </Card>

      {/* Add User Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFormError(null);
        }}
        title="Add a new user"
        description="Create a real user in this workspace. They can sign in immediately with the password you set."
      >
        <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-2">
          <input name="fullName" className="input-surface w-full" placeholder="Full name" required minLength={2} />
          <input name="email" type="email" className="input-surface w-full" placeholder="Email address" required />
          <select name="role" className="input-surface w-full" defaultValue="user">
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <input
            name="password"
            type="password"
            className="input-surface w-full"
            placeholder="Temporary password"
            required
            minLength={8}
          />
          <textarea
            className="min-h-28 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:bg-white/10 focus:ring-0 md:col-span-2"
            placeholder="Access scope, justification, or onboarding notes (not saved yet)"
          />
          {formError ? (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 md:col-span-2">
              {formError}
            </div>
          ) : null}
          <div className="flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setFormError(null);
              }}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="gitlab-button-primary h-11"
            >
              {isSaving ? "Saving..." : "Create user"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={Boolean(editingUser)}
        onClose={() => setEditUser(null)}
        title="Edit User Role"
        description={`Update permissions for ${editingUser?.name}`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Role</label>
            <select
              value={editingUser?.role}
              onChange={(e) => setEditUser({ ...editingUser!, role: e.target.value })}
              className="input-surface w-full"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditUser(null)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingRole}
              className="gitlab-button-primary h-11"
            >
              {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Role"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deletingUser?.name}?`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            This action is permanent and will remove all access for this user immediately.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="flex h-11 items-center justify-center rounded-2xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete User"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
