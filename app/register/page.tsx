"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, UserPlus } from "lucide-react";
import { useState } from "react";

import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const response = await api.register({
      fullName,
      email,
      organization,
      password
    });

    const data = (await response.json()) as { message?: string };

    if (!response.ok) {
      setError(data.message ?? "Unable to create workspace access.");
      setSubmitting(false);
      return;
    }

    setSuccess(data.message ?? "Registration successful. Redirecting to login...");
    setTimeout(() => {
      router.push("/login");
    }, 700);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-2xl p-8 md:p-10">
        <p className="eyebrow">Create Workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Register your organization</h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          The first user for a company becomes the admin automatically. Additional users join the same tenant as
          standard users.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-300">Full Name</span>
            <div className="relative">
              <UserPlus className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="input-surface w-full pl-11"
                placeholder="Jordan Lee"
                required
              />
            </div>
          </label>
          <label className="space-y-2 md:col-span-1">
            <span className="text-sm font-medium text-slate-300">Work Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-surface w-full pl-11"
                placeholder="jordan@company.com"
                required
              />
            </div>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Organization</span>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={organization}
                onChange={(event) => setOrganization(event.target.value)}
                className="input-surface w-full pl-11"
                placeholder="Northstar Holdings"
                required
              />
            </div>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm font-medium text-slate-300">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-surface w-full pl-11"
                placeholder="At least 8 characters"
                required
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 md:col-span-2">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 md:col-span-2">
              {success}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <Link href="/login" className="text-sm font-medium text-sky-300 hover:text-sky-200">
              Already have an account?
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
