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
      key: "org_id",
      label: "Organisation ID",
      value: data.organization.id,
      description: "This unique identifier links browser events to your specific workspace. It is required for multi-tenant data isolation."
    },
    {
      key: "api_key",
      label: "API Key",
      value: apiKey || (data.apiKeyConfigured ? "Generate a new key to view and copy it" : "No key generated yet"),
      description: "A secret key used to authenticate this device during setup. For security, we only show it once after generation.",
      secret: true
    },
    {
      key: "api_endpoint",
      label: "API Endpoint",
      value: data.apiEndpoint,
      description: "The secure URL where the extension sends audit data. Ensure this is reachable from your managed browsers."
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
            To start auditing browser activity, you must deploy the extension to your team's browsers. 
            Follow the steps below to download the package, configure credentials, and activate monitoring.
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
              The extension bundle contains the manifest and logic required to monitor browser events. 
              {data.organization.plan === "starter" && (
                <span className="block mt-2 font-medium text-amber-400">
                  Note: Starter plan workspaces are limited to two downloads. 
                  Contact support or upgrade for unlimited deployments.
                </span>
              )}
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
            <p className="text-sm text-slate-400">
              These credentials are used by the extension to securely connect to your workspace. 
              You will need to enter these in the extension options page during the initial setup.
            </p>
            {credentialRows.map((row) => (
              <div key={row.key} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={rotateKey}
                disabled={isRotating}
                className="gitlab-button gap-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRotating ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {data.apiKeyConfigured ? "Rotate API key" : "Generate API key"}
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Installation & Configuration" eyebrow="Follow these steps">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">1. Browser Installation</h3>
            <div className="space-y-3">
              {[
                "Download and extract the extension ZIP package.",
                "Open Chrome/Edge and navigate to `chrome://extensions`.",
                "Enable 'Developer mode' in the top right corner.",
                "Click 'Load unpacked' and select the extracted folder."
              ].map((step, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-amber-500 font-mono font-bold">{i+1}.</span>
                  <span className="text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">2. Credential Configuration</h3>
            <div className="space-y-3">
              {[
                "Click the extension icon and select 'Options'.",
                "Paste the Organisation ID and API Endpoint from above.",
                "Generate a fresh API Key and paste it into the field.",
                "Enter your personal user email and password.",
                "Click 'Test Connection' then 'Save & Activate'."
              ].map((step, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-amber-500 font-mono font-bold">{i+1}.</span>
                  <span className="text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Credential Definitions" eyebrow="Understanding your security">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="panel-muted p-4 space-y-2">
              <h4 className="text-sm font-bold text-white">Organisation ID</h4>
              <p className="text-xs leading-5 text-slate-400">
                A globally unique identifier for your tenant. It ensures that all events generated by the extension are routed strictly to your workspace and isolated from other companies.
              </p>
            </div>
            <div className="panel-muted p-4 space-y-2">
              <h4 className="text-sm font-bold text-white">API Key</h4>
              <p className="text-xs leading-5 text-slate-400">
                A temporary secret used to bootstrap the extension. When the extension first connects, it uses this key to register the device and exchange it for a long-lived, device-specific ingestion token.
              </p>
            </div>
            <div className="panel-muted p-4 space-y-2">
              <h4 className="text-sm font-bold text-white">API Endpoint</h4>
              <p className="text-xs leading-5 text-slate-400">
                The gateway URL for your auditing platform. The extension communicates with this endpoint to sync configurations, report activity, and receive real-time updates from the compliance engine.
              </p>
            </div>
          </div>
          
          <div className="rounded-[16px] border border-sky-500/20 bg-sky-500/5 p-5">
            <h4 className="text-sm font-bold text-sky-200">Configuring Auditing for Compliance</h4>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Once the extension is activated, it will automatically begin capturing navigation, dwell time, and file downloads. To fine-tune your compliance posture:
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-400 list-disc list-inside">
              <li>Visit the <strong>Settings</strong> page to adjust the idle timeout threshold and synchronization intervals.</li>
              <li>Configure the <strong>Blocklist</strong> to monitor or prevent access to high-risk domains and categories.</li>
              <li>Review the <strong>Alerts</strong> stream to triage potential policy violations in real-time.</li>
            </ul>
          </div>
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
