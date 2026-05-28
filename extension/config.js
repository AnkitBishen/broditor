export const STORAGE_KEYS = {
  authToken: "auth_token",
  userToken: "user_token",
  userRefreshToken: "user_refresh_token",
  blocklist: "blocklist",
  deviceId: "device_id",
  eventQueue: "event_queue",
  managedConfig: "managed_config",
  orgSettings: "org_settings",
  websocketBackoffMs: "ws_backoff_ms"
};

export async function getManagedConfig() {
  // 1. Try Chrome managed storage (MDM/policy — enterprise deployments)
  let managed = {};
  try {
    managed = await chrome.storage.managed.get(["org_id", "api_key", "api_endpoint"]);
  } catch {
    // managed storage unavailable (e.g. no managed_schema defined yet) — safe to ignore
  }

  // 2. Fall back to options page input stored in local storage
  const local = await chrome.storage.local.get(["org_id", "api_key", "api_endpoint"]);

  const config = {
    orgId:       managed.org_id       ?? local.org_id       ?? null,
    apiKey:      managed.api_key      ?? local.api_key      ?? null,
    apiEndpoint: managed.api_endpoint ?? local.api_endpoint ?? null
  };

  if (!config.orgId || !config.apiKey || !config.apiEndpoint) {
    throw new Error("Extension is not configured. Please open the options page and enter your credentials.");
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.managedConfig]: config });
  return config;
}

export async function getCachedManagedConfig() {
  const cached = await chrome.storage.local.get(STORAGE_KEYS.managedConfig);
  const config = cached[STORAGE_KEYS.managedConfig];
  // Treat missing OR null (busted cache) as a cache miss
  if (!config || !config.orgId) {
    return getManagedConfig();
  }
  return config;
}

// Called by the options page to persist user-entered credentials
export async function saveOptionsConfig({ orgId, apiKey, apiEndpoint }) {
  // Step 1: save the raw credentials
  await chrome.storage.local.set({
    org_id:       orgId,
    api_key:      apiKey,
    api_endpoint: apiEndpoint
  });
  // Step 2: remove the stale cache separately so getCachedManagedConfig
  // is forced to rebuild it from the freshly written values above
  await chrome.storage.local.remove(STORAGE_KEYS.managedConfig);
}

// Called by the options page to read back what was previously saved
export async function getSavedOptionsConfig() {
  const stored = await chrome.storage.local.get(["org_id", "api_key", "api_endpoint"]);
  return {
    orgId:       stored.org_id       ?? "",
    apiKey:      stored.api_key      ?? "",
    apiEndpoint: stored.api_endpoint ?? ""
  };
}