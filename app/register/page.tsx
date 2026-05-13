"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  Loader2,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

type Step = "form" | "otp" | "success";

export default function RegisterPage() {
  const router = useRouter();

  // ── Form state ──
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [password, setPassword] = useState("");

  // ── Flow state ──
  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ── OTP state ──
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Countdown timer ──
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Send OTP ──
  const handleSendOtp = useCallback(async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await api.sendOtp(email, fullName);
      const data = (await response.json()) as {
        message?: string;
        expiresInSeconds?: number;
      };

      if (!response.ok) {
        setError(data.message ?? "Failed to send verification code.");
        setSubmitting(false);
        return;
      }

      setStep("otp");
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }, [email, fullName]);

  // ── Step 1: Submit registration form → send OTP ──
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSendOtp();
  };

  // ── OTP input handling ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const updated = [...otpDigits];

    // Handle paste of full code
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        updated[i] = chars[i] || "";
      }
      setOtpDigits(updated);
      const nextEmpty = updated.findIndex((d) => d === "");
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
      return;
    }

    updated[index] = value;
    setOtpDigits(updated);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || "";
    }
    setOtpDigits(updated);
    const nextEmpty = updated.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  // ── Step 2: Verify OTP + complete registration ──
  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.verifyOtpAndRegister({
        fullName,
        email,
        organization,
        password,
        otp,
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Verification failed.");
        setSubmitting(false);
        return;
      }

      setStep("success");
      setSuccess(
        data.message ?? "Workspace created successfully! Redirecting to login..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    await handleSendOtp();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        {/* ── Logo — clickable, redirects to landing page ── */}
        <div className="mb-6 flex items-center justify-center">
          <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
            <img 
              src="/logo.png" 
              alt="Broditor" 
              className="h-11 w-11 shrink-0 rounded-[12px] object-cover shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105" 
            />
            <span className="text-[15px] font-semibold text-white">
              Broditor
            </span>
          </Link>
        </div>

        {/* ── Step indicator ── */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[
            { key: "form", label: "Details" },
            { key: "otp", label: "Verify" },
            { key: "success", label: "Done" },
          ].map((s, i) => {
            const stepOrder: Step[] = ["form", "otp", "success"];
            const currentIndex = stepOrder.indexOf(step);
            const itemIndex = stepOrder.indexOf(s.key as Step);
            const isActive = itemIndex === currentIndex;
            const isCompleted = itemIndex < currentIndex;

            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 transition-colors ${
                      isCompleted
                        ? "bg-emerald-400"
                        : "bg-white/10"
                    }`}
                  />
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isCompleted
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isActive
                        ? "bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "text-emerald-300"
                        : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Card ── */}
        <div className="glass-panel w-full p-8 md:p-10">
          {/* ── STEP 1: Registration form ── */}
          {step === "form" && (
            <>
              <p className="eyebrow">Create Workspace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Register your organization
              </h1>
              <p className="mt-3 max-w-2xl text-slate-400">
                The first user for a company becomes the admin automatically.
                We&apos;ll verify your email before creating the workspace.
              </p>

              <form
                onSubmit={handleFormSubmit}
                className="mt-8 grid gap-5 md:grid-cols-2"
              >
                <label className="space-y-2 md:col-span-1">
                  <span className="text-sm font-medium text-slate-300">
                    Full Name
                  </span>
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
                  <span className="text-sm font-medium text-slate-300">
                    Work Email
                  </span>
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
                  <span className="text-sm font-medium text-slate-300">
                    Organization
                  </span>
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
                  <span className="text-sm font-medium text-slate-300">
                    Password
                  </span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="input-surface w-full pl-11"
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                {error ? (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 md:col-span-2">
                    {error}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 md:col-span-2">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-sky-300 hover:text-sky-200"
                  >
                    Already have an account?
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Verify Email & Register
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP verification ── */}
          {step === "otp" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError("");
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to details
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Verify your email
                  </h2>
                  <p className="text-sm text-slate-400">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-sky-300">{email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="mt-8">
                {/* OTP input boxes */}
                <div
                  className="flex justify-center gap-3"
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="h-14 w-12 rounded-xl border border-white/10 bg-white/[0.04] text-center text-xl font-bold text-white outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-orange-500/20 sm:h-16 sm:w-14 sm:text-2xl"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {/* Timer & resend */}
                <div className="mt-5 flex items-center justify-center gap-4">
                  {countdown > 0 ? (
                    <p className="text-sm text-slate-400">
                      Resend code in{" "}
                      <span className="font-mono font-semibold text-orange-300">
                        {Math.floor(countdown / 60)}:
                        {String(countdown % 60).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={submitting}
                      className="text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-50"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || otpDigits.join("").length !== 6}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Verify & Create Workspace
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <p>
                    Check your inbox and spam folder. The code expires in 10
                    minutes and is valid for a single use.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">
                Workspace created!
              </h2>
              {success && (
                <p className="mt-3 max-w-md text-slate-400">{success}</p>
              )}
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to login...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
