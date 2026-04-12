import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Users2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center px-4 py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel overflow-hidden p-8 md:p-12">
          <p className="eyebrow">Browser Activity Audit & Compliance Platform</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Multi-tenant authentication and access control for security-first B2B SaaS.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Launch isolated company workspaces, make the first registrant an administrator automatically, and protect
            every dashboard and API route with JWT-backed role enforcement.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white"
            >
              Create workspace
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-200"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Building2,
                title: "Tenant isolation",
                copy: "Each organization gets a dedicated company scope for users and protected data."
              },
              {
                icon: ShieldCheck,
                title: "JWT + RBAC",
                copy: "Protected routes verify role claims before any admin or shared dashboard access."
              },
              {
                icon: Users2,
                title: "First-user admin",
                copy: "New workspaces automatically grant admin rights to the first user that registers."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <item.icon className="h-5 w-5 text-orange-300" />
                <p className="mt-4 text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel p-8 md:p-10">
          <p className="eyebrow">Built For Teams</p>
          <div className="mt-4 space-y-4">
            {[
              "Landing -> Register -> Login -> JWT session -> Admin/User dashboard routing",
              "Express auth endpoints with bcrypt password hashing and PostgreSQL schema",
              "Role-aware proxy protection for admin-only and shared routes",
              "Global auth context and secure HTTP-only cookie session handling"
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
