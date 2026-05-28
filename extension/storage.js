import { STORAGE_KEYS } from "./config.js";

export async function getOrCreateDeviceId() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.deviceId);
  if (stored[STORAGE_KEYS.deviceId]) {
    return stored[STORAGE_KEYS.deviceId];
  }

  const deviceId = crypto.randomUUID();
  await chrome.storage.local.set({ [STORAGE_KEYS.deviceId]: deviceId });
  return deviceId;
}

export async function getQueue() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.eventQueue);
  return Array.isArray(stored[STORAGE_KEYS.eventQueue]) ? stored[STORAGE_KEYS.eventQueue] : [];
}

export async function setQueue(queue) {
  await chrome.storage.local.set({ [STORAGE_KEYS.eventQueue]: queue });
}

export async function enqueueEvent(event) {
  const queue = await getQueue();
  queue.push(event);
  await setQueue(queue);
  return queue;
}

export async function removeAcknowledgedEvents(acknowledgedIds) {
  const queue = await getQueue();
  const acknowledgedSet = new Set(acknowledgedIds);
  const nextQueue = queue.filter((item) => !acknowledgedSet.has(item.event_id));
  await setQueue(nextQueue);
  return nextQueue;
}

export async function getAuthToken() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.authToken);
  return stored[STORAGE_KEYS.authToken] ?? null;
}

export async function setAuthToken(token) {
  await chrome.storage.local.set({ [STORAGE_KEYS.authToken]: token });
}

export async function getUserToken() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.userToken);
  return stored[STORAGE_KEYS.userToken] ?? null;
}

export async function setUserToken(token) {
  await chrome.storage.local.set({ [STORAGE_KEYS.userToken]: token });
}

export async function getUserRefreshToken() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.userRefreshToken);
  return stored[STORAGE_KEYS.userRefreshToken] ?? null;
}

export async function setUserRefreshToken(token) {
  await chrome.storage.local.set({ [STORAGE_KEYS.userRefreshToken]: token });
}

export async function getBlocklist() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.blocklist);
  return Array.isArray(stored[STORAGE_KEYS.blocklist]) ? stored[STORAGE_KEYS.blocklist] : [];
}

export async function setBlocklist(blocklist) {
  await chrome.storage.local.set({ [STORAGE_KEYS.blocklist]: blocklist });
}

export async function getOrgSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.orgSettings);
  return stored[STORAGE_KEYS.orgSettings] ?? {
    idle_threshold_seconds: 60,
    sync_interval_minutes: 5,
    blocklist_sync_minutes: 30,
    incognito_monitoring: false,
    monitoring_enabled: true
  };
}

export async function setOrgSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.orgSettings]: settings });
}

export async function getWebsocketBackoffMs() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.websocketBackoffMs);
  return stored[STORAGE_KEYS.websocketBackoffMs] ?? 1000;
}

export async function setWebsocketBackoffMs(value) {
  await chrome.storage.local.set({ [STORAGE_KEYS.websocketBackoffMs]: value });
}
