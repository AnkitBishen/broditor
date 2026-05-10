import { Building2, Eye, ShieldCheck, Users2 } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const values = [
  {
    icon: Eye,
    title: "Visibility with context",
    copy: "Browser events are only useful when they become timelines, risk levels, domains, and alert decisions."
  },
  {
    icon: ShieldCheck,
    title: "Security in the boring places",
    copy: "HTTP-only sessions, hashed credentials, tenant scoping, and role checks are treated as product features."
  },
  {
    icon: Users2,
    title: "Designed for teams",
    copy: "Admins, standard users, devices, and organizations each get a clear boundary in the workflow."
  }
];

export default function AboutUsPage() {
  return (
    <MarketingShell active="about">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <SectionHeading
            eyebrow="About us"
            title="We are building the control plane for browser activity compliance."
            copy="Browser Audit is shaped around a practical need: organizations want evidence, policy visibility, and alert workflows without stitching together logs, spreadsheets, and unmanaged browser data."
          />
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-[#fc7142]" />
              <p className="text-lg font-semibold">What this project proves</p>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {["Multi-tenant SaaS", "Extension telemetry", "Compliance alerts", "Role-based dashboards"].map((item) => (
                <div key={item} className="rounded-[14px] border border-white/10 bg-[#181721] p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#14121b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-3">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#5ca5ff]" />
                <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
