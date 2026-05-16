import { Eye, ShieldCheck, Users2, Lock, Settings, LayoutDashboard, Building2 } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const principles = [
  {
    icon: Lock,
    title: "Privacy-first monitoring",
    copy: "We collect what compliance requires — navigation, domains, downloads, and idle state. Nothing more."
  },
  {
    icon: Settings,
    title: "Designed for ops teams",
    copy: "Admins get full control. Users get transparency. Devices get registered. Everyone stays in their lane."
  },
  {
    icon: ShieldCheck,
    title: "Security in the foundation",
    copy: "HTTP-only sessions, hashed credentials, org-scoped queries, and role checks are not afterthoughts — they're product features."
  },
  {
    icon: LayoutDashboard,
    title: "From signal to decision",
    copy: "Raw browser events are useless without context. Broditor turns them into timelines, risk levels, and reviewable alert cases."
  }
];

export default function AboutUsPage() {
  return (
    <MarketingShell active="about">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
          <SectionHeading
            eyebrow="Our Story"
            title="We built Broditor because browser activity was the blind spot in every compliance stack."
            copy="Most organizations track network traffic, access logs, and file activity — but browser behavior was always left unmonitored. Broditor closes that gap by capturing what employees actually do, enriching those signals with risk context, and routing them to the right people through a structured workflow."
          />
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-8">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-[#fc7142]" />
              <p className="text-lg font-semibold text-white">What Broditor Stands For</p>
            </div>
            <div className="mt-8 space-y-6">
              <p className="text-sm leading-7 text-slate-400">
                We built a platform that captures what employees actually do in their browsers, enriches those signals with risk context, and routes them to the right people through a structured alert workflow.
              </p>
              <p className="text-sm leading-7 text-slate-400">
                No more spreadsheets. No more manual log reviews. Just clean, tenant-scoped visibility from browser to dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#14121b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-2 lg:grid-rows-2">
          {principles.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#fc7142]/10">
                    <Icon className="h-5 w-5 text-[#fc7142]" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-white">{item.title}</h2>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-400">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>
    </MarketingShell>
  );
}
