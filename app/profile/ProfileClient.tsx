"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { useAuth } from "@/components/AuthProvider";
import { cx } from "@/lib/utils";
import type { SessionUser } from "@/lib/types";

export default function ProfileClient({ initialUser }: { initialUser: SessionUser }) {
  const router = useRouter();
  const { setUser } = useAuth();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(initialUser.name);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);
    try {
      const response = await fetch("/api/session/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      setUser(data.user);
      setProfileMessage({ type: "success", text: "Profile updated successfully" });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setProfileMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to update profile" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    setIsChangingPassword(true);
    setPasswordMessage(null);
    try {
      const response = await fetch("/api/session/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to change password");

      setPasswordMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordMessage({ type: "error", text: error instanceof Error ? error.message : "Failed to change password" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = initialUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={cx("space-y-6", isPending && "opacity-60 pointer-events-none transition-opacity")}>
      {/* <div className="section-breadcrumb">
        <span>Broditor</span>
        <span>/</span>
        <strong>Profile</strong>
      </div> */}

      <div className="glass-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-3xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white">{initialUser.name}</h1>
              <Badge variant={initialUser.role === "admin" ? "role-admin" : "role-viewer"}>
                {initialUser.role === "admin" ? "Admin" : "User"}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">
              {initialUser.email} &bull; Member since {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(initialUser.createdAt || Date.now()))}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Personal Information" eyebrow="Identity details">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-surface w-full"
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <input
                value={initialUser.email}
                className="input-surface w-full opacity-60 cursor-not-allowed"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Organization</label>
              <input
                value={initialUser.companyName}
                className="input-surface w-full opacity-60 cursor-not-allowed"
                readOnly
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile || fullName === initialUser.name}
                className="gitlab-button-primary flex w-full items-center justify-center gap-2"
              >
                {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
            {profileMessage && (
              <p className={cx("text-sm text-center", profileMessage.type === "success" ? "text-green-400" : "text-red-400")}>
                {profileMessage.text}
              </p>
            )}
          </form>
        </Card>

        <Card title="Security" eyebrow="Credentials">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-surface w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-surface w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-surface w-full"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="gitlab-button-primary flex w-full items-center justify-center gap-2"
              >
                {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </button>
            </div>
            {passwordMessage && (
              <p className={cx("text-sm text-center", passwordMessage.type === "success" ? "text-green-400" : "text-red-400")}>
                {passwordMessage.text}
              </p>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
