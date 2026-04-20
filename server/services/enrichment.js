function deriveDomain(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function deriveCategory(domain = "", eventType = "", metadata = {}) {
  const normalized = String(domain || "").toLowerCase();

  if (metadata.download_bytes) {
    return "download";
  }

  if (normalized.includes("github") || normalized.includes("gitlab") || normalized.includes("jira")) {
    return "productive";
  }

  if (normalized.includes("slack") || normalized.includes("teams") || normalized.includes("zoom")) {
    return "collaboration";
  }

  if (normalized.includes("drive.google") || normalized.includes("dropbox") || normalized.includes("wetransfer")) {
    return "storage";
  }

  if (eventType === "idle") {
    return "idle";
  }

  return "general";
}

function deriveRiskLevel({ eventType, metadata = {}, isBlockedDomain = false, occurredAt }) {
  if (isBlockedDomain) {
    return "critical";
  }

  if (eventType === "download" && Number(metadata.download_bytes || 0) > 50 * 1024 * 1024) {
    return "high";
  }

  const hour = new Date(occurredAt).getHours();
  if (hour < 7 || hour > 19) {
    return "medium";
  }

  if (eventType === "idle" || eventType === "locked") {
    return "low";
  }

  return "low";
}

module.exports = {
  deriveCategory,
  deriveDomain,
  deriveRiskLevel
};
