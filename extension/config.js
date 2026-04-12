export const STORAGE_KEYS = {
  authToken: "auth_token",
  blocklist: "blocklist",
  deviceId: "device_id",
  eventQueue: "event_queue",
  managedConfig: "managed_config",
  orgSettings: "org_settings",
  websocketBackoffMs: "ws_backoff_ms"
};

export async function getManagedConfig() {
  const managed = await chrome.storage.managed.get(["org_id", "api_key", "api_endpoint"]);
  const config = {
    orgId: "31345d9a-2ca8-4946-8833-f8b7b04581d9", // managed.org_id,
    apiKey: "bak_9748fd8a940b43ed8a035a2215ae7e5da15014d1c873", // managed.api_key,
    apiEndpoint: "http://localhost:4000/api", // managed.api_endpoint
  };

  if (!config.orgId || !config.apiKey || !config.apiEndpoint) {
    throw new Error("Managed configuration is missing org_id, api_key, or api_endpoint.");
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.managedConfig]: config });
  return config;
}

export async function getCachedManagedConfig() {
  const cached = await chrome.storage.local.get(STORAGE_KEYS.managedConfig);
  return cached[STORAGE_KEYS.managedConfig] ?? getManagedConfig();
}
