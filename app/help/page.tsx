import Link from "next/link";
import { AlertCircle, Chrome, CircleHelp, Mail, Settings, Wrench } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const helpItems = [
  {
    icon: Chrome,
    title: "Extension setup",
    copy: "Load the `extension/` folder in Chrome extensions developer mode, open options, and enter organization credentials."
  },
  {
    icon: Settings,
    title: "Environment setup",
    copy: "Create `.env.local`, set the API base URL and JWT secret, then run frontend and backend processes."
  },
  {
    icon: AlertCircle,
    title: "No events appearing",
    copy: "Check extension credentials, device registration, `/api/events/batch`, and whether the backend can reach PostgreSQL."
  },
  {
    icon: Wrench,
    title: "Options page script issues",
    copy: "The options page uses `options.js` as an external module because extension CSP blocks inline scripts."
  }
];

export default function HelpPage() {
  return (
    <MarketingShell active="help">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Help"
          title="Troubleshooting and setup support."
          copy="Start here when local setup, extension activation, event ingestion, or dashboard access does not behave as expected."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {helpItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-6 w-6 text-[#66d782]" />
                <h2 className="mt-5 text-xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.copy}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-12 rounded-[22px] border border-white/10 bg-[#f4f5f7] p-6 text-[#1f1b24] md:p-8">
          <CircleHelp className="h-7 w-7 text-[#fc7142]" />
          <h2 className="mt-4 text-2xl font-semibold">Still stuck?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d5a66]">
            Use the project brief and graph report to trace modules, then confirm the backend is running on port 4000
            and the frontend is using `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.
          </p>
          <Link href="/docs" className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-[#1f1b24] px-4 py-2.5 text-sm font-semibold text-white">
            <Mail className="h-4 w-4" />
            Open docs
          </Link>
        </section>
      </section>
    </MarketingShell>
  );
}
