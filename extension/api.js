import { getCachedManagedConfig } from "./config.js";
import {
  getAuthToken,
  getUserToken,
  getBlocklist,
  getOrCreateDeviceId,
  getOrgSettings,
  getQueue,
  removeAcknowledgedEvents,
  setAuthToken,
  setUserToken,
  setBlocklist,
  setOrgSettings
} from "./storage.js";

function getPlatformSnapshot() {
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : "Chromium";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Unknown";
  return { browser, os };
}

async function apiRequest(path, init = {}) {
  const config = await getCachedManagedConfig();
  const token = await getAuthToken();
  const userToken = await getUserToken();
  const response = await fetch(`${config.apiEndpoint}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userToken ? { "X-User-Token": userToken } : {}),
      ...(init.headers || {})
    }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function login(email, password) {
  const config = await getCachedManagedConfig();
  
  const data = await fetch(`${config.apiEndpoint}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Login failed (${response.status})`);
    }
    return response.json();
  });

  await setUserToken(data.token);
  return data;
}

export async function verifyExtensionCredentials() {
  const config = await getCachedManagedConfig();
  
  const data = await fetch(`${config.apiEndpoint}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_id: config.orgId,
      api_key: config.apiKey
    })
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to verify extension credentials (${response.status})`);
    }
    return response.json();
  });

  await setAuthToken(data.token);
  return data;
}

export async function ensureDeviceRegistration() {
  if (!(await getAuthToken())) {
    await verifyExtensionCredentials();
  }

  const deviceId = await getOrCreateDeviceId();
  const { browser, os } = getPlatformSnapshot();

  const data = await apiRequest("/devices/register", {
    method: "POST",
    body: JSON.stringify({
      device_id: deviceId,
      device_fingerprint: `${browser}-${os}-${deviceId}`,
      browser,
      os
    })
  });

  if (data.token) {
    await setAuthToken(data.token);
  }

  return data.device;
}

export async function syncEvents() {
  const queue = await getQueue();
  if (!queue.length) {
    return { acknowledgedIds: [], insertedCount: 0, skippedCount: 0 };
  }

  const data = await apiRequest("/events/batch", {
    method: "POST",
    body: JSON.stringify({ events: queue })
  });

  await removeAcknowledgedEvents(data.acknowledgedIds || []);
  return data;
}

export async function refreshRemoteConfig() {
  const [blocklistResponse, settingsResponse] = await Promise.all([
    apiRequest("/config/blocklist"),
    apiRequest("/config/settings")
  ]);

  await Promise.all([
    setBlocklist(blocklistResponse.blocklist || []),
    setOrgSettings(settingsResponse.settings || {})
  ]);

  return {
    blocklist: await getBlocklist(),
    settings: await getOrgSettings()
  };
}
