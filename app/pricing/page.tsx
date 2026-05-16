import Link from "next/link";
import { Check, Shield, Sparkles, Star } from "lucide-react";

import { MarketingShell, SectionHeading } from "@/components/MarketingShell";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "For small teams who need browser visibility and basic compliance.",
    features: [
      "1 organization",
      "Up to 25 monitored devices",
      "Activity timeline per employee",
      "Basic risk alerts",
      "Admin + user role access",
      "Email support"
    ]
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "For teams rolling out compliance workflows across the org.",
    features: [
      "Up to 250 monitored devices",
      "Blocklist sync & management",
      "Alert assignment & notes",
      "Team dashboard & analytics",
      "Device health monitoring",
      "Priority email support"
    ],
    featured: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations that need managed deployment and advanced governance.",
    features: [
      "Unlimited devices",
      "Custom data retention policy",
      "Dedicated onboarding support",
      "Security review & SLA",
      "Custom blocklist rules",
      "SSO integration (roadmap)"
    ]
  }
];

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes — create a workspace and test the full flow locally with no credit card required."
  },
  {
    q: "What counts as a 'device'?",
    a: "Any browser with the Broditor extension installed and verified counts as one device."
  },
  {
    q: "Can I change plans later?",
    a: "Yes, you can upgrade or downgrade anytime from your organization settings."
  }
];

export default function PricingPage() {
  return (
    <MarketingShell active="pricing">
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple pricing. Sized by your team, not your budget."
          copy="All plans include the core monitoring pipeline — extension, event ingestion, risk scoring, and alerts."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-[22px] border p-8 transition-all hover:scale-[1.01] ${
                plan.featured ? "border-[#fc7142] bg-[#fc7142] text-[#1f1b24] shadow-2xl shadow-[#fc7142]/20" : "border-white/10 bg-white/[0.04] text-white"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#fc7142]">
                  Most Popular
                </span>
              )}
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{plan.name}</h2>
                {plan.featured ? <Star className="h-5 w-5 fill-current" /> : <Shield className="h-5 w-5 text-[#5ca5ff]" />}
              </div>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">{plan.price}</span>
                {plan.period && <span className={`text-lg ${plan.featured ? "text-[#3f2a20]" : "text-slate-500"}`}>{plan.period}</span>}
              </div>
              <p className={`mt-4 text-sm leading-7 ${plan.featured ? "text-[#3f2a20]" : "text-slate-400"}`}>{plan.description}</p>
              
              <div className="mt-8 flex-1">
                <p className={`text-xs font-bold uppercase tracking-widest ${plan.featured ? "text-[#3f2a20]" : "text-slate-500"}`}>What's included</p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-[#1f1b24]" : "text-[#fc7142]"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register"
                className={`mt-10 inline-flex h-12 w-full items-center justify-center rounded-[12px] text-sm font-bold transition-all ${
                  plan.featured ? "bg-[#1f1b24] text-white hover:bg-black" : "bg-white text-[#1f1b24] hover:bg-slate-100"
                }`}
              >
                {plan.name === "Enterprise" ? "Talk to Us" : "Get Started"}
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-20">
          <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-[#fc7142]">
            <span className="h-px flex-1 bg-white/10" />
            Pricing FAQ
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </MarketingShell>
  );
}
