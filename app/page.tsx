import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  LockKeyhole,
  Radio,
  ShieldCheck,
  Users2
} from "lucide-react";

import { getSessionUser } from "@/lib/auth";

import { MarketingShell, ProductDashboardVisual, SectionHeading } from "@/components/MarketingShell";

const proofPoints = [
  { label: "Tenant model", value: "Org scoped", icon: Building2 },
  { label: "Event path", value: "Extension to API", icon: Activity },
  { label: "Session design", value: "HTTP-only JWT", icon: LockKeyhole },
  { label: "Realtime risk", value: "WebSocket live", icon: Radio }
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: "Compliance-ready browser visibility",
    copy: "Capture navigation, dwell time, downloads, idle state, and blocklisted domains from managed browsers."
  },
  {
    icon: Users2,
    title: "Multi-tenant access control",
    copy: "Organizations, users, roles, sessions, route guards, and backend authorization all share the same tenant boundary."
  },
  {
    icon: AlertTriangle,
    title: "Operational alert workflow",
    copy: "Risk scoring, alert creation, assignment, status updates, and notes turn raw browsing events into reviewable cases."
  }
];

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <MarketingShell active="home">
      <section className="relative overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div>
            <p className="eyebrow">Browser Activity Audit & Compliance Platform</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white md:text-6xl">
              Browser monitoring built for tenant-aware compliance teams.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Capture browser activity from managed devices, enrich events into risk signals, and route the right
              people to dashboards, alerts, and evidence trails.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={user ? "/dashboard" : "/register"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-white px-5 text-sm font-semibold text-[#1f1b24]"
              >
                {user ? "Go to Dashboard" : "Create workspace"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {/* <Link
                href="/docs"
                className="inline-flex h-12 items-center justify-center rounded-[12px] border border-white/10 bg-white/[0.05] px-5 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                View implementation
              </Link> */}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {proofPoints.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
                    <Icon className="h-5 w-5 text-[#fc7142]" />
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1 font-semibold text-white">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <ProductDashboardVisual />
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#14121b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 md:px-6 lg:grid-cols-3">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#5ca5ff]" />
                <h2 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
          <SectionHeading
            eyebrow="How it works"
            title="From browser signal to admin decision."
            copy="The platform is organized around a simple operational path: configure the tenant, activate the extension, ingest events, enrich risk, and review alerts."
          />

          <div className="grid gap-4">
            {[
              "Admins create a workspace and rotate extension API keys.",
              "The extension verifies organization credentials and registers each device.",
              "Browser events are queued locally, synced in batches, and deduplicated by the API.",
              "Risk scoring, blocklist checks, and alert rules create reviewable compliance cases."
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

      <section className="bg-[#f4f5f7] text-[#1f1b24]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#76513f]">Ready for a walkthrough</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Start with create a workspace.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d5a66]">
              Use the implementation docs to understand the architecture, or register a tenant and try the auth,
              dashboard, and extension activation flow locally.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* <Link href="/docs" className="inline-flex h-11 items-center rounded-[10px] border border-[#d2d4dc] px-4 text-sm font-semibold">
              Read docs
            </Link> */}
            <Link 
              href={user ? "/dashboard" : "/register"} 
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1f1b24] px-4 text-sm font-semibold text-white"
            >
              {user ? "Dashboard" : "Create workspace"}
              <CheckCircle2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
