import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Radio,
  Search,
  ShieldAlert,
  Building2
} from "lucide-react";

import { getSessionUser } from "@/lib/auth";

import { MarketingShell, ProductDashboardVisual, SectionHeading } from "@/components/MarketingShell";

const highlights = [
  {
    icon: Search,
    title: "Full Browser Visibility",
    copy: "Track tab navigation, dwell time, downloads, idle state, and blocklisted domain visits across all managed devices in real time."
  },
  {
    icon: ShieldAlert,
    title: "Compliance Alert Workflow",
    copy: "High-risk events automatically become reviewable alerts. Assign, annotate, and resolve cases without leaving the dashboard."
  },
  {
    icon: Building2,
    title: "Built for Multi-Tenant Teams",
    copy: "Every organization gets isolated data, role-based dashboards, and admin controls — all within the same tenant boundary."
  }
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <MarketingShell active="home">
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div>
            <p className="eyebrow">Browser Activity Audit & Compliance</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-6xl">
              Turn browser activity into audit trails, risk signals, and compliance evidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Broditor captures browser activity from managed devices, turns navigation and downloads into risk signals, and gives your compliance team the alerts and evidence trails they need — all scoped to your organization.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-5 text-sm font-semibold text-[#1f1b24]"
              >
                {user ? "Go to Dashboard" : "Start Free"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                See How It Works
              </Link>
            </div>
          </div>

          <ProductDashboardVisual />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#14121b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-3">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#fc7142]" />
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
          <SectionHeading
            eyebrow="How it works"
            title="Simplified browser compliance in 4 steps."
            copy="Broditor is designed to be deployed and operational within minutes, providing instant visibility into your managed fleet."
          />

          <div className="grid gap-4">
            {[
              "Admin creates a workspace and gets an extension API key",
              "Team installs the Chrome extension and connects with their credentials",
              "Browser events sync automatically in the background",
              "Admin reviews activity timelines, risk alerts, and device health"
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-[18px] border border-white/10 bg-white/[0.04] p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#fc7142] text-sm font-bold text-[#1f1b24]">
                  {index + 1}
                </span>
                <p className="self-center text-sm leading-6 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0f0d14] py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#fc7142]" />
              Real-time WebSocket alerts
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#fc7142]" />
              Org-scoped data isolation
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#fc7142]" />
              Chrome Manifest V3 extension
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f7] text-[#1f1b24]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Ready to get visibility into your team's browser activity?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d5a66]">
              Start monitoring managed devices today. Deployment takes minutes, and your first organization is always free.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href={user ? "/dashboard" : "/register"} 
              className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#1f1b24] px-6 text-sm font-semibold text-white shadow-lg shadow-black/10"
            >
              {user ? "Go to Dashboard" : "Create Your Workspace — It's Free"}
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
