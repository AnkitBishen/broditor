import { redirect } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { getSessionUser } from "@/lib/auth";

export default async function ProfilePage() {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="section-breadcrumb">
        <span>Browser Audit</span>
        <span>/</span>
        <strong>Profile</strong>
      </div>

      <div className="glass-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-2xl font-semibold text-white">
              {currentUser.avatar}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white">{currentUser.name}</h1>
                <Badge variant={currentUser.role === "admin" ? "role-admin" : "role-viewer"}>{currentUser.role}</Badge>
              </div>
              <p className="text-slate-300 capitalize">{currentUser.role} access</p>
              <p className="text-sm text-slate-400">{currentUser.email} - {currentUser.companyName}</p>
            </div>
          </div>
          <Badge variant="success">Secure session active</Badge>
        </div>
      </div>

      <div className="page-tabs">
        <span className="page-tab page-tab-active">Overview</span>
        <span className="page-tab">Permissions</span>
        <span className="page-tab">Session security</span>
        <span className="page-tab">Focus areas</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Permissions" eyebrow="Current access">
          <div className="space-y-3">
            {(currentUser.role === "admin"
              ? ["Create company users", "View company dashboards", "Manage tenant access", "Access shared analytics"]
              : ["View personal access", "Use shared dashboards", "Access profile", "Access settings"]
            ).map((item) => (
              <div key={item} className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Session security" eyebrow="Device posture">
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Last sign-in</p>
            <p className="text-xl font-semibold text-white">JWT session validated in protected route middleware</p>
            <Badge variant="info">Role claim verified</Badge>
            <Badge variant="success">Tenant claim attached</Badge>
          </div>
        </Card>
        <Card title="Focus areas" eyebrow="Operational scope">
          <div className="flex flex-wrap gap-2">
            {["Multi-tenant auth", "JWT sessions", "RBAC", currentUser.companyName].map((item) => (
              <Badge key={item} variant="purple">
                {item}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
