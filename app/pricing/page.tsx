import Link from "next/link";
import { Check, Shield, Sparkles, Star } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For small teams validating browser visibility and basic alert review.",
    features: ["1 organization", "Up to 10 devices", "7-day activity timeline", "Email support"]
  },
  {
    name: "Growth",
    price: "$19",
    description: "For companies rolling out device monitoring and team-level compliance workflows.",
    features: ["Up to 100 devices", "30-day retention", "Blocklist sync", "Team dashboard"],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For larger tenants that need managed deployment, policy controls, and audit retention planning.",
    features: ["Unlimited devices", "Custom retention", "SSO & SAML", "Priority support"]
  }
];

export default function PricingPage() {
  return (
    <MarketingShell active="pricing">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Plans for teams moving from visibility to governance."
          copy="Transparent pricing designed to scale with your monitoring needs. Start for free and upgrade as your fleet grows."
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
                {plan.price === "Free" ? "Get started" : `Choose ${plan.name}`}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-12 flex flex-col gap-6 rounded-[22px] border border-white/10 bg-[#14121b] p-6 md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-[#f5b942]" />
                <span className="text-sm font-bold uppercase tracking-widest text-[#f5b942]">Enterprise Ready</span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-white">Advanced security for global fleets.</h2>
              <p className="mt-4 text-base leading-7 text-slate-400">
                Deploy with confidence across thousands of devices. Our enterprise tier includes SOC2 compliance reporting, 
                granular audit logs, and dedicated success engineers to help you map browser telemetry to your 
                internal compliance frameworks.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/docs" className="inline-flex h-12 items-center justify-center rounded-[12px] border border-white/10 px-6 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]">
                View security docs
              </Link>
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-[12px] bg-white px-6 text-sm font-semibold text-[#1f1b24]">
                Contact sales
              </Link>
            </div>
          </div>
          
          <div className="grid gap-6 border-t border-white/5 pt-8 md:grid-cols-3">
            {[
              { title: "Custom Retention", desc: "Store audit trails for up to 7 years to meet regulatory requirements." },
              { title: "SAML/SSO", desc: "Integrate with Okta, Azure AD, or your internal identity provider." },
              { title: "Managed Deployment", desc: "MSI/PKG installers and MDM configuration profiles for Chrome & Edge." }
            ].map((item) => (
              <div key={item.title}>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </MarketingShell>
  );
}
