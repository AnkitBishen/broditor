import Link from "next/link";
import { Check, Shield, Sparkles, Star } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "For small teams validating browser visibility and basic alert review.",
    features: ["1 organization", "Up to 25 devices", "Activity timeline", "Basic alerts"]
  },
  {
    name: "Growth",
    price: "$149",
    description: "For companies rolling out device monitoring and team-level compliance workflows.",
    features: ["Up to 250 devices", "Blocklist sync", "Team dashboard", "Alert assignment"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger tenants that need managed deployment, policy controls, and audit retention planning.",
    features: ["Managed config", "Custom retention", "Priority support", "Security review"]
  }
];

export default function PricingPage() {
  return (
    <MarketingShell active="pricing">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans for teams moving from visibility to governance."
          copy="Pricing is structured around monitored devices, alert workflow needs, and deployment support. Use these tiers as product packaging for the current implementation."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[22px] border p-6 ${
                plan.featured ? "border-[#fc7142] bg-[#fc7142] text-[#1f1b24]" : "border-white/10 bg-white/[0.04] text-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                {plan.featured ? <Star className="h-5 w-5" /> : <Shield className="h-5 w-5 text-[#5ca5ff]" />}
              </div>
              <p className="mt-5 text-4xl font-semibold tracking-tight">{plan.price}</p>
              <p className={`mt-3 text-sm leading-7 ${plan.featured ? "text-[#3f2a20]" : "text-slate-400"}`}>{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-[10px] text-sm font-semibold ${
                  plan.featured ? "bg-[#1f1b24] text-white" : "bg-white text-[#1f1b24]"
                }`}
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-12 flex flex-col gap-4 rounded-[22px] border border-white/10 bg-[#14121b] p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <Sparkles className="h-6 w-6 text-[#f5b942]" />
            <h2 className="mt-4 text-2xl font-semibold">Need a pilot plan?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
              Start with the local implementation, validate extension telemetry, then size the plan around active devices and retention.
            </p>
          </div>
          <Link href="/docs" className="inline-flex h-11 shrink-0 items-center justify-center rounded-[10px] border border-white/10 px-4 text-sm font-semibold text-slate-200">
            Review architecture
          </Link>
        </section>
      </section>
    </MarketingShell>
  );
}
