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

  const SOCIAL_DOMAINS = ["facebook.com", "instagram.com", "twitter.com", "x.com", "reddit.com", "linkedin.com", "tiktok.com"];
  const VIDEO_DOMAINS = ["youtube.com", "netflix.com", "hotstar.com", "primevideo.com", "hulu.com", "vimeo.com"];

  if (SOCIAL_DOMAINS.some(d => normalized === d || normalized.endsWith(`.${d}`))) {
    return "social";
  }

  if (VIDEO_DOMAINS.some(d => normalized === d || normalized.endsWith(`.${d}`))) {
    return "video";
  }

  if (metadata.download_bytes) {
    return "download";
  }

  if (normalized.includes("github") || normalized.includes("gitlab") || normalized.includes("jira") || normalized.includes("confluence") || normalized.includes("slack") || normalized.includes("teams") || normalized.includes("zoom")) {
    return "productive";
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
