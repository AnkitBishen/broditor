import { ensureDeviceRegistration, refreshRemoteConfig, syncEvents, verifyExtensionCredentials } from "./api.js";
import { getCachedManagedConfig } from "./config.js";
import { enqueueEvent, getBlocklist, getOrCreateDeviceId, getOrgSettings } from "./storage.js";
import { connectLiveSocket, emitRiskEvent } from "./websocket.js";

const ALARM_SYNC = "sync";
const ALARM_CONFIG = "config_refresh";
const STATE = {
  activeTabId: null,
  activeTabStartedAt: null,
  activeTabUrl: null,
  browserFocused: true
};

function extractDomain(rawUrl) {
  if (!rawUrl) {
    return null;
  }

  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

async function buildEvent(eventType, payload = {}) {
  const managed = await getCachedManagedConfig();
  const deviceId = await getOrCreateDeviceId();

  return {
    event_id: crypto.randomUUID(),
    device_id: deviceId,
    event_type: eventType,
    url: payload.url || null,
    domain: payload.domain || extractDomain(payload.url || ""),
    page_title: payload.pageTitle || null,
    dwell_seconds: payload.dwellSeconds || null,
    metadata: payload.metadata || {},
    occurred_at: new Date().toISOString(),
    org_id: managed.orgId
  };
}

async function queueEvent(event) {
  const queue = await enqueueEvent(event);
  if (queue.length >= 100) {
    await flushQueue();
  }
}

async function flushQueue() {
  try {
    await syncEvents();
  } catch (error) {
    console.warn("Event sync failed:", error.message);
  }
}

async function matchesBlocklist(domain) {
  const blocklist = await getBlocklist();
  return blocklist.find((entry) => domain === entry.domain || domain.endsWith(`.${entry.domain}`)) || null;
}

async function emitIfRisky(event) {
  const domain = event.domain || extractDomain(event.url || "");
  const match = domain ? await matchesBlocklist(domain) : null;

  if (!match) {
    return;
  }

  await emitRiskEvent({
    ...event,
    metadata: {
      ...(event.metadata || {}),
      blocklist_category: match.category
    }
  });
}

async function trackDwellStop(tabId, reason = "tab_blur") {
  if (STATE.activeTabId !== tabId || !STATE.activeTabStartedAt || !STATE.activeTabUrl) {
    return;
  }

  const dwellSeconds = Math.max(1, Math.round((Date.now() - STATE.activeTabStartedAt) / 1000));
  const dwellEvent = await buildEvent("dwell", {
    url: STATE.activeTabUrl,
    dwellSeconds,
    metadata: { reason, tab_id: tabId }
  });

  await queueEvent(dwellEvent);
  STATE.activeTabStartedAt = null;
}

async function handleUrlCapture(details) {
  const event = await buildEvent(details.eventType, {
    url: details.url,
    pageTitle: details.pageTitle,
    metadata: details.metadata
  });

  await queueEvent(event);
  await emitIfRisky(event);
}

// Opens the options page and notifies the user that setup is required.
// Silently swallows the error so the service worker doesn't crash on first install.
async function initExtension() {
  try {
    await verifyExtensionCredentials();
    await ensureDeviceRegistration();
    await refreshRemoteConfig();
    await connectLiveSocket();
  } catch (error) {
    if (error.message.includes("not configured")) {
      console.warn("Extension not configured — opening options page.");
      chrome.runtime.openOptionsPage();
      return;
    }
    console.error("Extension initialisation failed:", error.message);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CONFIG_UPDATED") {
    initExtension().then(() => {
      sendResponse({ status: "ok" });
    }).catch(err => {
      sendResponse({ status: "error", message: err.message });
    });
    return true; // Keep channel open for async response
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await initExtension();

  chrome.alarms.create(ALARM_SYNC, { periodInMinutes: 5 });
  chrome.alarms.create(ALARM_CONFIG, { periodInMinutes: 30 });
});

chrome.runtime.onStartup.addListener(async () => {
  await initExtension();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SYNC) {
    await flushQueue();
  }

  if (alarm.name === ALARM_CONFIG) {
    try {
      await refreshRemoteConfig();
    } catch (error) {
      console.warn("Config refresh failed:", error.message);
    }
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) {
    return;
  }

  try {
    await handleUrlCapture({
      eventType: "tabs_updated",
      url: tab.url,
      pageTitle: tab.title || "",
      metadata: { tab_id: tabId, status: changeInfo.status }
    });
  } catch (error) {
    console.warn("tabs.onUpdated capture failed:", error.message);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0 || !details.url) {
    return;
  }

  try {
    await handleUrlCapture({
      eventType: "navigation_completed",
      url: details.url,
      metadata: { tab_id: details.tabId, frame_id: details.frameId }
    });
  } catch (error) {
    console.warn("webNavigation.onCompleted capture failed:", error.message);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (STATE.activeTabId && STATE.activeTabId !== activeInfo.tabId) {
    await trackDwellStop(STATE.activeTabId, "tab_switch");
  }

  const tab = await chrome.tabs.get(activeInfo.tabId);
  STATE.activeTabId = activeInfo.tabId;
  STATE.activeTabStartedAt = Date.now();
  STATE.activeTabUrl = tab.url || null;
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await trackDwellStop(tabId, "tab_closed");
  if (STATE.activeTabId === tabId) {
    STATE.activeTabId = null;
    STATE.activeTabUrl = null;
    STATE.activeTabStartedAt = null;
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    STATE.browserFocused = false;
    if (STATE.activeTabId) {
      await trackDwellStop(STATE.activeTabId, "window_blur");
    }
    return;
  }

  STATE.browserFocused = true;
  if (STATE.activeTabId) {
    STATE.activeTabStartedAt = Date.now();
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  try {
    const settings = await getOrgSettings();
    const event = await buildEvent("idle", {
      metadata: {
        state: newState,
        idle_threshold_seconds: settings.idle_threshold_seconds
      }
    });
    await queueEvent(event);
  } catch (error) {
    console.warn("idle event capture failed:", error.message);
  }
});

chrome.downloads.onCreated.addListener(async (downloadItem) => {
  try {
    const event = await buildEvent("download", {
      url: downloadItem.url,
      pageTitle: downloadItem.filename,
      metadata: {
        filename: downloadItem.filename,
        mime: downloadItem.mime,
        total_bytes: downloadItem.totalBytes,
        download_bytes: downloadItem.totalBytes
      }
    });

    await queueEvent(event);
    await emitIfRisky(event);
  } catch (error) {
    console.warn("download event capture failed:", error.message);
  }
});
