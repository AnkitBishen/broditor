import { saveOptionsConfig, getSavedOptionsConfig } from "./config.js";
import { verifyExtensionCredentials, ensureDeviceRegistration, refreshRemoteConfig } from "./api.js";
import { connectLiveSocket } from "./websocket.js";

const orgIdEl = document.getElementById("orgId");
const apiKeyEl = document.getElementById("apiKey");
const apiEndpointEl = document.getElementById("apiEndpoint");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const toggleKeyBtn = document.getElementById("toggleKey");
const statusEl = document.getElementById("status");
const testResultEl = document.getElementById("test-result");

(async () => {
  try {
    const saved = await getSavedOptionsConfig();
    if (saved.orgId) orgIdEl.value = saved.orgId;
    if (saved.apiKey) apiKeyEl.value = saved.apiKey;
    if (saved.apiEndpoint) apiEndpointEl.value = saved.apiEndpoint;
  } catch (error) {
    showStatus(error.message, "error");
  }
})();

toggleKeyBtn.addEventListener("click", () => {
  const hidden = apiKeyEl.type === "password";
  apiKeyEl.type = hidden ? "text" : "password";
  toggleKeyBtn.textContent = hidden ? "hide" : "show";
});

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = type;
}

function clearHighlights() {
  [orgIdEl, apiKeyEl, apiEndpointEl].forEach((el) => el.classList.remove("error"));
}

function validate() {
  clearHighlights();
  let ok = true;

  if (!orgIdEl.value.trim()) {
    orgIdEl.classList.add("error");
    ok = false;
  }

  if (!apiKeyEl.value.trim()) {
    apiKeyEl.classList.add("error");
    ok = false;
  }

  if (!apiEndpointEl.value.trim()) {
    apiEndpointEl.classList.add("error");
    ok = false;
  }

  return ok;
}

function getFormValues() {
  return {
    orgId: orgIdEl.value.trim(),
    apiKey: apiKeyEl.value.trim(),
    apiEndpoint: apiEndpointEl.value.trim().replace(/\/$/, "")
  };
}

testBtn.addEventListener("click", async () => {
  if (!validate()) {
    showStatus("Please fill in all fields before testing.", "error");
    return;
  }

  testBtn.textContent = "Testing...";
  testBtn.disabled = true;
  testResultEl.className = "";
  testResultEl.textContent = "";

  try {
    await saveOptionsConfig(getFormValues());
    await verifyExtensionCredentials();
    testResultEl.textContent = "Connection successful - credentials verified.";
    testResultEl.className = "ok";
  } catch (err) {
    testResultEl.textContent = err.message;
    testResultEl.className = "err";
  } finally {
    testBtn.textContent = "Test Connection";
    testBtn.disabled = false;
  }
});

saveBtn.addEventListener("click", async () => {
  if (!validate()) {
    showStatus("Please fill in all required fields.", "error");
    return;
  }

  saveBtn.textContent = "Saving...";
  saveBtn.disabled = true;

  try {
    await saveOptionsConfig(getFormValues());
    await verifyExtensionCredentials();
    await ensureDeviceRegistration();
    await refreshRemoteConfig();
    await connectLiveSocket();

    showStatus("Configuration saved. Monitoring is now active.", "success");
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    saveBtn.textContent = "Save & Activate";
    saveBtn.disabled = false;
  }
});
