"use client";

import { Check, Clipboard, Download, KeyRound, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";

type ExtensionSetup = {
  organization: {
    id: string;
    name: string;
    plan: "starter" | "growth" | "enterprise";
    status: string;
  };
  apiEndpoint: string;
  apiKeyConfigured: boolean;
  downloads: {
    count: number;
    limit: number | null;
    lastDownloadedAt: string | null;
  };
};

export function ExtensionSetupClient({
  data
}: {
  data: ExtensionSetup;
}) {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadLimitReached = data.downloads.limit !== null && data.downloads.count >= data.downloads.limit;

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function rotateKey() {
    setMessage(null);
    setIsRotating(true);
    try {
      const response = await fetch("/api/admin/extension/key", { method: "POST" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Unable to generate API key.");
      }
      setApiKey(body.extensionApiKey);
      setMessage("New API key generated. Copy it now; it will not be shown again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate API key.");
    } finally {
      setIsRotating(false);
    }
  }

  async function downloadExtension() {
    setMessage(null);
    setIsDownloading(true);
    try {
      const response = await fetch("/api/admin/extension/download", { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Unable to download extension.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "browser-audit-extension.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Extension downloaded. The download count was updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to download extension.");
    } finally {
      setIsDownloading(false);
    }
  }

  const credentialRows = [
    {
      label: "Organisation ID",
      value: data.organization.id,
      description: "Identifies which tenant owns the browser events and devices."
    },
    {
      label: "API Key",
      value: apiKey || (data.apiKeyConfigured ? "Generate a new key to view and copy it" : "No key generated yet"),
      description: "Secret credential used once by the extension to exchange for an ingestion token.",
      secret: true
    },
    {
      label: "API Endpoint",
      value: data.apiEndpoint,
      description: "Backend base URL the extension calls for verification, config, events, and device registration."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="section-breadcrumb">
            <span>{data.organization.name}</span>
            <span>/</span>
            <strong>Extension setup</strong>
          </div>
          <h1 className="page-title mt-3">Browser extension deployment</h1>
          <p className="page-copy mt-3 max-w-3xl">
            Download the extension bundle, copy tenant credentials, and follow the browser setup steps to start
            collecting audit activity from managed browsers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={data.organization.plan === "starter" ? "warn" : "success"}>
            {data.organization.plan} plan
          </Badge>
          <Badge variant={downloadLimitReached ? "danger" : "info"}>
            {data.downloads.limit === null
              ? `${data.downloads.count} downloads`
              : `${data.downloads.count}/${data.downloads.limit} downloads`}
          </Badge>
        </div>
      </div>

      {message ? (
        <div className="rounded-[16px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-slate-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Extension package" eyebrow="Download control">
          <div className="space-y-5">
            <p className="text-sm leading-7 text-slate-400">
              Starter plan workspaces can download the extension package up to two times. Paid plans can download
              whenever they need to redeploy or refresh managed devices.
            </p>
            <button
              type="button"
              onClick={downloadExtension}
              disabled={isDownloading || downloadLimitReached}
              className="gitlab-button-primary h-12 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Preparing..." : downloadLimitReached ? "Download limit reached" : "Download extension"}
            </button>
            {data.downloads.lastDownloadedAt ? (
              <p className="text-xs text-slate-500">
                Last downloaded {new Date(data.downloads.lastDownloadedAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-slate-500">This organization has not downloaded the extension yet.</p>
            )}
          </div>
        </Card>

        <Card title="Credentials" eyebrow="Copy into extension options">
          <div className="space-y-4">
            {credentialRows.map((row) => (
              <div key={row.label} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{row.label}</p>
                    <p className="mt-2 break-all font-mono text-sm text-slate-300">{row.value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{row.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyValue(row.label, row.value)}
                    disabled={row.secret && !apiKey}
                    className="gitlab-button shrink-0 gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied === row.label ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    {copied === row.label ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={rotateKey}
              disabled={isRotating}
              className="gitlab-button gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRotating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {data.apiKeyConfigured ? "Generate new API key" : "Generate API key"}
            </button>
          </div>
        </Card>
      </div>

      <Card title="Browser setup steps" eyebrow="Chrome / Chromium">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "Download the extension ZIP from this page.",
            "Extract the ZIP file on the employee or test machine.",
            "Open Chrome and go to chrome://extensions.",
            "Turn on Developer mode.",
            "Click Load unpacked and choose the extracted browser-audit-extension folder.",
            "Open the extension options page and paste Organisation ID, API Key, and API Endpoint.",
            "Click Test Connection to verify credentials.",
            "Click Save & Activate to register the device, sync config, and start auditing."
          ].map((step, index) => (
            <div key={step} className="flex gap-4 rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-sm font-bold text-[#1f1b24]">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-slate-300">{step}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="What auditing captures" eyebrow="Configuration notes">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Navigation and dwell",
              copy: "The extension records page visits, completed navigations, active tab duration, and normalized domains."
            },
            {
              title: "Downloads and idle state",
              copy: "Download creation and idle-state changes become tenant-scoped audit events for review."
            },
            {
              title: "Blocklist and live risk",
              copy: "Remote blocklist entries trigger risk events and WebSocket delivery for high-priority visibility."
            }
          ].map((item) => (
            <div key={item.title} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.copy}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
