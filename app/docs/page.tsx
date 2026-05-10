import Link from "next/link";
import { BookOpen, Cable, Database, KeyRound, Puzzle, Server } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const docs = [
  {
    icon: Server,
    title: "Backend API",
    copy: "Express routes handle auth, devices, events, dashboards, alerts, extension keys, and user dashboards.",
    file: "server/index.js"
  },
  {
    icon: Database,
    title: "PostgreSQL schema",
    copy: "Organizations, users, devices, blocklists, partitioned events, and alerts are defined for tenant-scoped analytics.",
    file: "server/schema.sql"
  },
  {
    icon: Puzzle,
    title: "Chrome extension",
    copy: "Manifest V3 service worker captures activity, queues events, syncs batches, and opens live risk channels.",
    file: "extension/service-worker.js"
  },
  {
    icon: KeyRound,
    title: "Auth and sessions",
    copy: "JWTs, HTTP-only cookies, proxy route checks, and backend role middleware work together.",
    file: "proxy.ts"
  }
];

export default function DocsPage() {
  return (
    <MarketingShell active="docs">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Docs"
          title="Implementation guide for the audit platform."
          copy="Use this page as the product map: frontend routes, backend API responsibilities, database objects, and browser extension runtime behavior."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {docs.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#fc7142]" />
                <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
                <p className="mt-4 rounded-[10px] border border-white/10 bg-[#181721] px-3 py-2 font-mono text-xs text-slate-300">
                  {item.file}
                </p>
              </article>
            );
          })}
        </div>

        <section className="mt-12 rounded-[22px] border border-white/10 bg-[#14121b] p-6 md:p-8">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-[#5ca5ff]" />
            <h2 className="text-2xl font-semibold">Quick start</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {["npm install", "npm run dev", "npm run server"].map((command) => (
              <code key={command} className="rounded-[14px] border border-white/10 bg-black/25 px-4 py-3 text-sm text-slate-200">
                {command}
              </code>
            ))}
          </div>
          <Link href="/help" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#5ca5ff]">
            Need setup help
            <Cable className="h-4 w-4" />
          </Link>
        </section>
      </section>
    </MarketingShell>
  );
}
