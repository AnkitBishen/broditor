import { getCachedManagedConfig } from "./config.js";
import {
  getAuthToken,
  getUserToken,
  getUserRefreshToken,
  getBlocklist,
  getOrCreateDeviceId,
  getOrgSettings,
  getQueue,
  removeAcknowledgedEvents,
  setAuthToken,
  setUserToken,
  setUserRefreshToken,
  setBlocklist,
  setOrgSettings
} from "./storage.js";

function getPlatformSnapshot() {
  const ua = navigator.userAgent;
  const browser = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : "Chromium";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Unknown";
  return { browser, os };
}

export async function refreshUserTokenCall() {
  const config = await getCachedManagedConfig();
  const refreshToken = await getUserRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(`${config.apiEndpoint}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // If the refresh token fails, clear all user tokens
    await setUserToken(null);
    await setUserRefreshToken(null);
    throw new Error("Session expired. Please log in again.");
  }

  const data = await response.json();
  await setUserToken(data.token);
  if (data.refreshToken) {
    await setUserRefreshToken(data.refreshToken);
  }
  return data.token;
}

async function apiRequest(path, init = {}) {
  const config = await getCachedManagedConfig();
  const token = await getAuthToken();
  const userToken = await getUserToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userToken ? { "X-User-Token": userToken } : {}),
    ...(init.headers || {})
  };

  let response = await fetch(`${config.apiEndpoint}${path}`, {
    ...init,
    headers
  });

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.error === "TOKEN_EXPIRED") {
      try {
        const freshUserToken = await refreshUserTokenCall();
        if (freshUserToken) {
          const retryHeaders = {
            ...headers,
            "X-User-Token": freshUserToken
          };
          response = await fetch(`${config.apiEndpoint}${path}`, {
            ...init,
            headers: retryHeaders
          });
          
          if (!response.ok) {
            const retryData = await response.json().catch(() => ({}));
            throw new Error(retryData.message || `Request failed with status ${response.status}`);
          }
          return response.json();
        }
      } catch (err) {
        console.error("Token refresh failed:", err.message);
        throw new Error("Session expired. Please log in again.");
      }
    }
    
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

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
  if (data.refreshToken) {
    await setUserRefreshToken(data.refreshToken);
  }
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
