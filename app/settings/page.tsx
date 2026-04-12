import { redirect } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { getSessionUser } from "@/lib/auth";

export default async function SettingsPage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Workspace Preferences</p>
        <h1 className="page-title">Settings</h1>
        <p className="page-copy max-w-3xl">
          Review account metadata, role assignment, and session preferences for your authenticated workspace access.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Profile info" eyebrow="Account metadata">
          <div className="grid gap-4 md:grid-cols-2">
            <input defaultValue={currentUser.name} className="input-surface w-full" />
            <input defaultValue={currentUser.email} className="input-surface w-full" />
            <input defaultValue={currentUser.companyName} className="input-surface w-full" />
            <input defaultValue={currentUser.role} className="input-surface w-full capitalize" />
          </div>
        </Card>

        <Card title="Preferences" eyebrow="Platform behavior">
          <div className="space-y-4">
            {[
              "Email me when new high-severity alerts are detected",
              "Use secure HTTP-only session cookies",
              "Open my role dashboard on sign-in"
            ].map((item, index) => (
              <label
                key={item}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="text-sm text-slate-300">{item}</span>
                <input
                  type="checkbox"
                  defaultChecked={index !== 0 ? true : currentUser.role === "admin"}
                  className="rounded border-white/10 bg-white/5 text-orange-500 focus:ring-0"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Change password" eyebrow="Credential rotation">
        <div className="grid gap-4 md:grid-cols-3">
          <input type="password" placeholder="Current password" className="input-surface w-full" />
          <input type="password" placeholder="New password" className="input-surface w-full" />
          <input type="password" placeholder="Confirm new password" className="input-surface w-full" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 text-sm font-semibold text-white">
            Update password
          </button>
          <Badge variant="neutral">Hook this form to a password rotation endpoint later</Badge>
        </div>
      </Card>
    </div>
  );
}
