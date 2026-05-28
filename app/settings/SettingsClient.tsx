"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Plus, Trash2, Smartphone, Moon, Sun, Monitor as MonitorIcon, Check } from "lucide-react";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Table } from "@/components/Table";
import { useAuth } from "@/components/AuthProvider";
import { cx } from "@/lib/utils";
import type { TableColumn } from "@/lib/types";

type BlocklistItem = {
  id: string;
  domain: string;
  category: string;
  createdAt: string;
};

type DeviceItem = {
  id: string;
  browser: string;
  os: string;
  lastSeen: string;
  createdAt: string;
};

type MonitoringSettings = {
  monitoring_enabled: boolean;
  idle_threshold_seconds: number;
  sync_interval_minutes: number;
  blocklist_sync_minutes: number;
  incognito_monitoring: boolean;
  large_download_mb?: number;
  work_hours_start?: string;
  work_hours_end?: string;
};

export default function SettingsClient({ initialData }: { initialData: any }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isPending, startTransition] = useTransition();

  // Organization Settings
  const [orgName, setOrgName] = useState(initialData.organizationName || "");
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  // Monitoring Settings
  const [monitoring, setMonitoring] = useState<MonitoringSettings>({
    monitoring_enabled: initialData.settings?.monitoring_enabled ?? true,
    idle_threshold_seconds: initialData.settings?.idle_threshold_seconds ?? 300,
    sync_interval_minutes: initialData.settings?.sync_interval_minutes ?? 5,
    blocklist_sync_minutes: initialData.settings?.blocklist_sync_minutes ?? 60,
    incognito_monitoring: initialData.settings?.incognito_monitoring ?? false,
    large_download_mb: initialData.settings?.large_download_mb ?? 50,
    work_hours_start: initialData.settings?.work_hours_start ?? "08:00",
    work_hours_end: initialData.settings?.work_hours_end ?? "19:00"
  });
  const [isUpdatingMonitoring, setIsUpdatingMonitoring] = useState(false);

  // Blocklist
  const [isAddingBlocklist, setIsAddingBlocklist] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState("Social Media");

  // Modals
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isDeleteEventsModalOpen, setIsDeleteEventsModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Theme
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    if (initialData.organizationName) setOrgName(initialData.organizationName);
    if (initialData.settings) {
      setMonitoring({
        monitoring_enabled: initialData.settings.monitoring_enabled ?? true,
        idle_threshold_seconds: initialData.settings.idle_threshold_seconds ?? 300,
        sync_interval_minutes: initialData.settings.sync_interval_minutes ?? 5,
        blocklist_sync_minutes: initialData.settings.blocklist_sync_minutes ?? 60,
        incognito_monitoring: initialData.settings.incognito_monitoring ?? false,
        large_download_mb: initialData.settings.large_download_mb ?? 50,
        work_hours_start: initialData.settings.work_hours_start ?? "08:00",
        work_hours_end: initialData.settings.work_hours_end ?? "19:00"
      });
    }
  }, [initialData]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system";
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const handleUpdateOrgName = async () => {
    setIsUpdatingOrg(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationName: orgName })
      });
      if (!response.ok) throw new Error("Failed to update org name");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  const handleUpdateMonitoring = async () => {
    setIsUpdatingMonitoring(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: monitoring })
      });
      if (!response.ok) throw new Error("Failed to update monitoring settings");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingMonitoring(false);
    }
  };

  const handleAddBlocklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBlocklist(true);
    try {
      const response = await fetch("/api/admin/blocklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain, category: newCategory })
      });
      if (!response.ok) throw new Error("Failed to add blocklist item");
      setNewDomain("");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingBlocklist(false);
    }
  };

  const handleRemoveBlocklist = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/blocklist/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to remove blocklist item");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSuspendOrg = async () => {
    try {
      const response = await fetch("/api/admin/org/suspend", {
        method: "PATCH"
      });
      if (!response.ok) throw new Error("Failed to suspend org");
      setIsSuspendModalOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEvents = async () => {
    if (deleteConfirmText !== "DELETE") return;
    try {
      const response = await fetch("/api/admin/events", {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete events");
      setIsDeleteEventsModalOpen(false);
      setDeleteConfirmText("");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else if (newTheme === "light") document.documentElement.classList.remove("dark");
    else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  };

  const blocklistColumns: TableColumn<BlocklistItem>[] = [
    { key: "domain", header: "Domain", sortable: true },
    { key: "category", header: "Category", sortable: true },
    { key: "createdAt", header: "Added Date", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <button
          onClick={() => handleRemoveBlocklist(row.id)}
          className="text-slate-400 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )
    }
  ];

  const deviceColumns: TableColumn<DeviceItem>[] = [
    { key: "browser", header: "Browser", sortable: true },
    { key: "os", header: "OS", sortable: true },
    { key: "lastSeen", header: "Last Seen", render: (row) => new Date(row.lastSeen).toLocaleString() },
    { key: "createdAt", header: "Registered Date", render: (row) => new Date(row.createdAt).toLocaleDateString() }
  ];

  if (!user) return null;

  return (
    <div className={cx("space-y-6", isPending && "opacity-60 pointer-events-none transition-opacity")}>
      {/* <div className="section-breadcrumb">
        <span>Broditor</span>
        <span>/</span>
        <strong>Settings</strong>
      </div> */}

      <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>

      {/* <div className="page-tabs">
        <span className="page-tab page-tab-active">Workspace</span>
        <span className="page-tab">Integrations</span>
        <span className="page-tab">Notifications</span>
        <span className="page-tab">Theme</span>
      </div> */}

      <div className="space-y-6">
        {/* Admin Sections */}
        {isAdmin && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Organization Settings" eyebrow="Global workspace details">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Organization Name</label>
                    <div className="flex gap-2">
                      <input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="input-surface flex-1"
                        placeholder="Company Name"
                      />
                      <button
                        onClick={handleUpdateOrgName}
                        disabled={isUpdatingOrg}
                        className="gitlab-button-primary px-4"
                      >
                        {isUpdatingOrg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Organization ID</label>
                    <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <code className="text-sm text-slate-300">{user.companyId}</code>
                      <button
                        onClick={() => handleCopyId(user.companyId)}
                        className="text-slate-400 hover:text-white"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Monitoring Settings" eyebrow="Compliance behavior">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Monitoring Enabled</p>
                      <p className="text-xs text-slate-500">Enable or disable activity tracking</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={monitoring.monitoring_enabled}
                        onChange={(e) => setMonitoring({ ...monitoring, monitoring_enabled: e.target.checked })}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300"></div>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Idle Threshold (sec)</label>
                      <input
                        type="number"
                        value={monitoring.idle_threshold_seconds}
                        onChange={(e) => setMonitoring({ ...monitoring, idle_threshold_seconds: parseInt(e.target.value) || 0 })}
                        className="input-surface w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Sync Interval (min)</label>
                      <input
                        type="number"
                        value={monitoring.sync_interval_minutes}
                        onChange={(e) => setMonitoring({ ...monitoring, sync_interval_minutes: parseInt(e.target.value) || 0 })}
                        className="input-surface w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Blocklist Sync (min)</label>
                      <input
                        type="number"
                        value={monitoring.blocklist_sync_minutes}
                        onChange={(e) => setMonitoring({ ...monitoring, blocklist_sync_minutes: parseInt(e.target.value) || 0 })}
                        className="input-surface w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Large Download Limit (MB)</label>
                      <input
                        type="number"
                        value={monitoring.large_download_mb ?? 50}
                        onChange={(e) => setMonitoring({ ...monitoring, large_download_mb: parseInt(e.target.value) || 0 })}
                        className="input-surface w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Work Hours Start</label>
                      <input
                        type="time"
                        value={monitoring.work_hours_start ?? "08:00"}
                        onChange={(e) => setMonitoring({ ...monitoring, work_hours_start: e.target.value })}
                        className="input-surface w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Work Hours End</label>
                      <input
                        type="time"
                        value={monitoring.work_hours_end ?? "19:00"}
                        onChange={(e) => setMonitoring({ ...monitoring, work_hours_end: e.target.value })}
                        className="input-surface w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-300">Incognito Monitoring</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={monitoring.incognito_monitoring}
                        onChange={(e) => setMonitoring({ ...monitoring, incognito_monitoring: e.target.checked })}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300"></div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleUpdateMonitoring}
                      disabled={isUpdatingMonitoring}
                      className="gitlab-button-primary w-full"
                    >
                      {isUpdatingMonitoring ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Monitoring Settings"}
                    </button>
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Blocklist Management" eyebrow="Restricted domains">
              <div className="space-y-6">
                <Table
                  columns={blocklistColumns}
                  data={initialData.blocklist || []}
                  emptyTitle="No domains blocked"
                  emptyCopy="Blocked domains will appear here once added."
                />

                <form onSubmit={handleAddBlocklist} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="mb-3 text-sm font-medium text-white">Add Blocked Domain</p>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      className="input-surface flex-1"
                      placeholder="example.com"
                      required
                    />
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="input-surface"
                    >
                      <option>Social Media</option>
                      <option>Streaming</option>
                      <option>Gambling</option>
                      <option>Shopping</option>
                      <option>Productivity Sink</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isAddingBlocklist}
                      className="gitlab-button-primary inline-flex items-center gap-2 px-6"
                    >
                      {isAddingBlocklist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </Card>

            <Card title="Danger Zone" eyebrow="Destructive actions" className="border-red-500/30">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/5 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-400">Suspend Organization</p>
                    <p className="text-xs text-slate-500">Deactivate all users and stop monitoring immediately.</p>
                  </div>
                  <button
                    onClick={() => setIsSuspendModalOpen(true)}
                    className="rounded-xl border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Suspend Org
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/5 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-400">Delete All Events</p>
                    <p className="text-xs text-slate-500">Permanently wipe all browser activity logs for this company.</p>
                  </div>
                  <button
                    onClick={() => setIsDeleteEventsModalOpen(true)}
                    className="rounded-xl border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                  >
                    Delete Events
                  </button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* User Sections */}
        {!isAdmin && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Extension Setup" eyebrow="Connect your browser">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Your Organization ID</p>
                    <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <code className="text-sm text-slate-300">{user.companyId}</code>
                      <button
                        onClick={() => handleCopyId(user.companyId)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">Setup Steps:</p>
                    <ol className="space-y-3">
                      {[
                        "Download the extension from your admin",
                        "Open Chrome â†’ Extensions â†’ Load unpacked",
                        "Enter your Organization ID and API Key in the extension options",
                        "Enter your Broditor email and password in the extension options",
                        "Click Verify & Connect"
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-400">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 text-[10px] font-bold text-slate-300">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </Card>

              <Card title="Connection Status" eyebrow="Device health">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={cx(
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner",
                      (initialData.devices || []).length > 0 ? "bg-green-500/10 text-green-500" : "bg-slate-500/10 text-slate-500"
                    )}>
                      <Smartphone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Status</p>
                      <Badge variant={(initialData.devices || []).length > 0 ? "success" : "neutral"}>
                        {(initialData.devices || []).length > 0 ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-300">Registered Devices</p>
                    <Table
                      columns={deviceColumns}
                      data={initialData.devices || []}
                      pageSize={3}
                      emptyTitle="No devices registered"
                      emptyCopy="Download and setup the extension to see your devices here."
                    />
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Both Sections */}
        {/* <Card title="Theme" eyebrow="Visual preference">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "system", icon: MonitorIcon, label: "System" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleThemeChange(item.id as any)}
                className={cx(
                  "flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all",
                  theme === item.id
                    ? "border-orange-500/50 bg-orange-500/5 ring-1 ring-orange-500/20"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]"
                )}
              >
                <item.icon className={cx("h-6 w-6", theme === item.id ? "text-orange-500" : "text-slate-400")} />
                <span className={cx("text-sm font-medium", theme === item.id ? "text-white" : "text-slate-400")}>
                  {item.label}
                </span>
                {theme === item.id && <Check className="h-4 w-4 text-orange-500" />}
              </button>
            ))}
          </div>
        </Card> */}
      </div>

      {/* Modals */}
      <Modal
        open={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title="Suspend Organization"
        description="Are you sure you want to suspend this organization? This will deactivate all users and stop all monitoring."
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-red-500/5 p-4 text-sm text-red-400">
            This action can be undone by an administrator through the support portal.
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsSuspendModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleSuspendOrg}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              Suspend
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isDeleteEventsModalOpen}
        onClose={() => setIsDeleteEventsModalOpen(false)}
        title="Delete All Events"
        description="This action is irreversible. All captured browser activity for your organization will be permanently deleted."
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-red-500/5 p-4 text-sm text-red-400">
            Please type <span className="font-bold">DELETE</span> below to confirm this action.
          </div>
          <input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="input-surface w-full border-red-500/30 focus:border-red-500"
            placeholder="Type DELETE"
          />
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsDeleteEventsModalOpen(false)}
              className="flex-1 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvents}
              disabled={deleteConfirmText !== "DELETE"}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
