import Link from "next/link";
import { CircleHelp, Mail } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const helpSections = [
  {
    title: "Getting Started",
    items: [
      {
        q: "How do I set up my workspace?",
        a: "Register at broditor.vercel.app/register. The first user in an organization automatically becomes the Admin."
      },
      {
        q: "How do I install the Chrome extension?",
        a: "1. Ask your admin to download the extension package. 2. Go to chrome://extensions â†’ Enable Developer Mode. 3. Click 'Load unpacked' â†’ select the extension folder. 4. Open extension options â†’ enter your Organization ID, API Key, email, and password. 5. Click Verify & Connect."
      },
      {
        q: "Where do I find my Organization ID and API Key?",
        a: "Admin â†’ Settings â†’ Organization Settings. Both are displayed there with a copy button."
      }
    ]
  },
  {
    title: "Troubleshooting",
    items: [
      {
        q: "Events are not appearing in the dashboard",
        a: "- Confirm extension shows 'Connected' status in options. - Check that your device was successfully registered. - Make sure the backend is running and reachable. - Verify DATABASE_URL is set correctly in your environment."
      },
      {
        q: "Extension options page won't save",
        a: "The options page loads options.js as an external file due to Chrome's Content Security Policy. Make sure you're loading the full extension folder, not just the manifest."
      },
      {
        q: "Dashboard shows no data after login",
        a: "Check that NEXT_PUBLIC_API_BASE_URL points to your running backend. For local dev this should be http://localhost:4000/api"
      },
      {
        q: "I forgot my password",
        a: "Go to /forgot-password from the login page and enter your email. A reset link will be sent to your inbox."
      }
    ]
  },
  {
    title: "Roles & Permissions",
    items: [
      {
        q: "What can an Admin do that a User can't?",
        a: "Admins manage the organization, rotate API keys, configure monitoring settings, manage blocklists, view all employee activity, and assign/resolve alerts."
      },
      {
        q: "Can a User see other employees' activity?",
        a: "No. Users only see their own activity and dashboard."
      }
    ]
  }
];

export default function HelpPage() {
  return (
    <MarketingShell active="help">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Support Center"
          title="How can we help?"
          copy="Browse our documentation and common troubleshooting steps to get your organization up and running with Broditor."
        />

        <div className="mt-12 space-y-12">
          {helpSections.map((section) => (
            <div key={section.title}>
              <h2 className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-[#fc7142]">
                <span className="h-px flex-1 bg-white/10" />
                {section.title}
                <span className="h-px flex-1 bg-white/10" />
              </h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {section.items.map((item) => (
                  <article key={item.q} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.05]">
                    <h3 className="text-lg font-semibold text-white">Q: {item.q}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{item.a}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-20 rounded-[22px] border border-white/10 bg-[#f4f5f7] p-8 text-[#1f1b24] shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fc7142]/10">
              <CircleHelp className="h-8 w-8 text-[#fc7142]" />
            </div>
            <h2 className="mt-6 text-3xl font-bold">Still stuck?</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d5a66]">
              Our technical team is ready to assist with deployment issues, custom retention policies, or extension architecture questions.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/docs" className="inline-flex h-12 items-center gap-2 rounded-[12px] bg-[#1f1b24] px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.02]">
                <Mail className="h-4 w-4" />
                Open Docs
              </Link>
              <a href="mailto:support@broditor.com" className="inline-flex h-12 items-center rounded-[12px] border border-[#d2d4dc] px-6 text-sm font-semibold text-[#1f1b24] hover:bg-black/5">
                Contact Support
              </a>
            </div>
          </div>
        </section>
      </section>
    </MarketingShell>
  );
}
