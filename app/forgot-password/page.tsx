"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

type Step = "email" | "otp" | "new-password" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // ── State ──
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── OTP state ──
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── New password state ──
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      const response = await api.sendOtp(email, "");
      const data = (await response.json()) as { message?: string };

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
  }, [email]);

  // ── Step 1: Submit email ──
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSendOtp();
  };

  // ── OTP input handling ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otpDigits];
    if (value.length > 1) {
      const chars = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) updated[i] = chars[i] || "";
      setOtpDigits(updated);
      const nextEmpty = updated.findIndex((d) => d === "");
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
      return;
    }
    updated[index] = value;
    setOtpDigits(updated);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) updated[i] = pasted[i] || "";
    setOtpDigits(updated);
    const nextEmpty = updated.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  // ── Step 2: Verify OTP → go to new password ──
  const handleOtpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setStep("new-password");
  };

  // ── Step 3: Set new password ──
  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.resetPassword({
        email,
        otp: otpDigits.join(""),
        password,
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Failed to reset password.");
        // If OTP was consumed/expired, go back to email step
        if (response.status === 400 && data.message?.includes("request a new")) {
          setStep("email");
        }
        setSubmitting(false);
        return;
      }

      setStep("success");
      setTimeout(() => router.push("/login"), 2500);
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

  const stepIndicator = [
    { key: "email", label: "Email" },
    { key: "otp", label: "Verify" },
    { key: "new-password", label: "Reset" },
    { key: "success", label: "Done" },
  ];
  const stepOrder: Step[] = ["email", "otp", "new-password", "success"];
  const currentIndex = stepOrder.indexOf(step);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* ── Logo ── */}
        <div className="mb-6 flex items-center justify-center">
          <Link href="/" className="group flex items-center gap-3 transition-opacity hover:opacity-80">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#fc7142] text-sm font-black text-[#1f1b24] shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
              BA
            </span>
            <span className="text-[15px] font-semibold text-white">Browser Audit</span>
          </Link>
        </div>

        {/* ── Steps ── */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {stepIndicator.map((s, i) => {
            const itemIndex = stepOrder.indexOf(s.key as Step);
            const isActive = itemIndex === currentIndex;
            const isCompleted = itemIndex < currentIndex;
            return (
              <div key={s.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-px w-6 transition-colors ${isCompleted ? "bg-emerald-400" : "bg-white/10"}`} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isCompleted ? "bg-emerald-500/20 text-emerald-300"
                        : isActive ? "bg-orange-500/20 text-orange-300 ring-2 ring-orange-500/40"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-white" : isCompleted ? "text-emerald-300" : "text-slate-500"}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Card ── */}
        <div className="glass-panel w-full p-8 md:p-10">
          {/* ── STEP 1: Email ── */}
          {step === "email" && (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600">
                  <KeyRound className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
                  <p className="text-sm text-slate-400">We&apos;ll send a verification code to your email</p>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Work Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-surface w-full pl-11"
                      placeholder="jordan@company.com"
                      required
                    />
                  </div>
                </label>

                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending code...</>
                  ) : (
                    <><Mail className="h-4 w-4" /> Send Verification Code</>
                  )}
                </button>

                <div className="text-center">
                  <Link href="/login" className="text-sm font-medium text-sky-300 hover:text-sky-200">
                    ← Back to sign in
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === "otp" && (
            <>
              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600">
                  <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Verify your email</h2>
                  <p className="text-sm text-slate-400">
                    Code sent to <span className="font-medium text-sky-300">{email}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="mt-8">
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
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

                <div className="mt-5 flex items-center justify-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-slate-400">
                      Resend in <span className="font-mono font-semibold text-orange-300">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}</span>
                    </p>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={submitting} className="text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-50">
                      Resend verification code
                    </button>
                  )}
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={otpDigits.join("").length !== 6}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <CheckCircle2 className="h-4 w-4" /> Verify Code
                </button>
              </form>
            </>
          )}

          {/* ── STEP 3: New password ── */}
          {step === "new-password" && (
            <>
              <button
                type="button"
                onClick={() => { setStep("otp"); setError(""); }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Set new password</h2>
                  <p className="text-sm text-slate-400">Choose a strong password for your account</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-5">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">New Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-surface w-full pl-11"
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                    />
                  </div>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Confirm Password</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-surface w-full pl-11"
                      placeholder="Re-enter your password"
                      minLength={8}
                      required
                    />
                  </div>
                </label>

                {/* Password strength indicator */}
                <div className="space-y-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          password.length >= level * 3
                            ? password.length >= 12
                              ? "bg-emerald-400"
                              : password.length >= 8
                              ? "bg-amber-400"
                              : "bg-rose-400"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    {password.length === 0
                      ? "Enter a password"
                      : password.length < 8
                      ? "Too short"
                      : password.length < 12
                      ? "Good"
                      : "Strong"}
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</>
                  ) : (
                    <><KeyRound className="h-4 w-4" /> Reset Password</>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: Success ── */}
          {step === "success" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-white">Password reset!</h2>
              <p className="mt-3 max-w-md text-slate-400">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
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
