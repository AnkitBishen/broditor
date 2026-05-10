require("./env");

const { createServer } = require("http");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");

const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");

const { requireAdmin, requireUserOrAdmin, verifyIngestionToken, verifyToken } = require("./auth-middleware");
const { runAlertPipeline } = require("./services/alert-engine");
const { deriveCategory, deriveDomain, deriveRiskLevel } = require("./services/enrichment");
const { createWebsocketHub } = require("./services/websocket-hub");
const { createStore } = require("./store");

const PORT = process.env.PORT || 4000;
const API_SECRET = process.env.API_JWT_SECRET || "change-this-in-production";
const PUBLIC_API_BASE_URL = process.env.PUBLIC_API_BASE_URL || `http://localhost:${PORT}/api`;
const STARTER_EXTENSION_DOWNLOAD_LIMIT = 2;
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

function createExtensionApiKey() {
  return `bak_${randomUUID().replace(/-/g, "")}${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function initials(fullName) {
  return String(fullName || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function serializeSessionUser(record) {
  return {
    id: record.id,
    name: record.full_name,
    email: record.email,
    role: record.role,
    companyId: record.org_id,
    companyName: record.org_name,
    avatar: initials(record.full_name)
  };
}

function issueUserToken(record) {
  return jwt.sign(
    {
      token_type: "user",
      userId: record.id,
      role: record.role,
      org_id: record.org_id,
      company_id: record.org_id,
      org_name: record.org_name,
      company_name: record.org_name,
      email: record.email,
      full_name: record.full_name
    },
    API_SECRET,
    { expiresIn: "1d" }
  );
}

function issueExtensionToken({ orgId, orgName, deviceId = null }) {
  return jwt.sign(
    {
      token_type: "extension",
      org_id: orgId,
      company_id: orgId,
      org_name: orgName,
      company_name: orgName,
      device_id: deviceId
    },
    API_SECRET,
    { expiresIn: "1d" }
  );
}

function validateRegistrationInput(body) {
  const fullName = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const organization = String(body.organization || "").trim();
  const password = String(body.password || "");

  if (fullName.length < 2) {
    return { error: "Full name must be at least 2 characters long." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid work email address." };
  }

  if (organization.length < 2) {
    return { error: "Organization name must be at least 2 characters long." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  return { fullName, email, organization, password };
}

function validateLoginInput(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  return { email, password };
}

function validateAdminUserInput(body) {
  const fullName = String(body.full_name || body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const role = String(body.role || "user").trim().toLowerCase();

  if (fullName.length < 2) {
    return { error: "Full name must be at least 2 characters long." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid work email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (!["admin", "user"].includes(role)) {
    return { error: "Role must be admin or user." };
  }

  return { fullName, email, password, role };
}

function validateDeviceRegistration(body) {
  const deviceId = String(body.device_id || "").trim();
  const deviceFingerprint = String(body.device_fingerprint || "").trim();
  const browser = String(body.browser || "").trim();
  const os = String(body.os || "").trim();
  const employeeId = body.employee_id ? String(body.employee_id).trim() : null;

  if (!deviceId || !deviceFingerprint || !browser || !os) {
    return { error: "device_id, device_fingerprint, browser, and os are required." };
  }

  return { deviceId, deviceFingerprint, browser, os, employeeId };
}

function normalizeIncomingEvent(event, context, blocklistMap) {
  const id = String(event.event_id || event.id || "").trim() || randomUUID();
  const url = event.url ? String(event.url) : null;
  const domain = String(event.domain || deriveDomain(url) || "").trim().toLowerCase() || null;
  const occurredAt = event.occurred_at ? new Date(event.occurred_at).toISOString() : new Date().toISOString();
  const metadata = typeof event.metadata === "object" && event.metadata !== null ? event.metadata : {};
  const blocklistMatch = domain ? blocklistMap.get(domain) ?? null : null;
  const normalizedEventType = String(event.event_type || "navigation").trim().toLowerCase();

  return {
    id,
    orgId: context.orgId,
    employeeId: event.employee_id || context.employeeId || null,
    deviceId: event.device_id || context.deviceId || null,
    eventType: normalizedEventType,
    url,
    domain,
    pageTitle: event.page_title ? String(event.page_title).slice(0, 512) : null,
    dwellSeconds: Number.isFinite(Number(event.dwell_seconds)) ? Number(event.dwell_seconds) : null,
    category: deriveCategory(domain, normalizedEventType, metadata),
    riskLevel: deriveRiskLevel({
      eventType: normalizedEventType,
      metadata,
      isBlockedDomain: Boolean(blocklistMatch),
      occurredAt
    }),
    metadata,
    occurredAt,
    blocklistMatch
  };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let crc = index;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosDate, dosTime };
}

function createZipArchive(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name.replace(/\\/g, "/"));
    const data = file.data;
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localFiles.length, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([localFiles, centralDirectory, end]);
}

function buildExtensionBundle() {
  const extensionDir = path.join(__dirname, "..", "extension");
  const fileNames = [
    "manifest.json",
    "managed_schema.json",
    "options.html",
    "options.js",
    "api.js",
    "config.js",
    "storage.js",
    "websocket.js",
    "service-worker.js"
  ];

  const files = fileNames.map((fileName) => ({
    name: `browser-audit-extension/${fileName}`,
    data: fs.readFileSync(path.join(extensionDir, fileName))
  }));

  return createZipArchive(files);
}

async function startServer() {
  const store = await createStore();
  const server = createServer(app);

  async function processEvents({ orgId, employeeId = null, deviceId = null, incomingEvents = [] }) {
    if (!incomingEvents.length) {
      return {
        acknowledgedIds: [],
        insertedCount: 0,
        skippedCount: 0,
        alertsCreated: 0
      };
    }

    const blocklist = await store.getBlocklist(orgId);
    const blocklistMap = new Map(
      blocklist
        .filter((entry) => entry?.domain)
        .map((entry) => [String(entry.domain).trim().toLowerCase(), entry])
    );
    const deduped = [];
    const seenIds = new Set();
    for (const rawEvent of incomingEvents) {
      const normalizedEvent = normalizeIncomingEvent(rawEvent, { orgId, employeeId, deviceId }, blocklistMap);
      if (seenIds.has(normalizedEvent.id)) {
        continue;
      }
      seenIds.add(normalizedEvent.id);
      deduped.push(normalizedEvent);
    }

    const normalized = deduped;
    const partitionMonths = [...new Set(normalized.map((event) => new Date(event.occurredAt).toISOString().slice(0, 7)))];
    for (const month of partitionMonths) {
      await store.ensureEventPartitions(new Date(`${month}-01T00:00:00.000Z`));
    }

    const existingIds = new Set(await store.listExistingEventIds(orgId, normalized.map((event) => event.id)));
    const pending = normalized.filter((event) => !existingIds.has(event.id));

    const inserted = await store.insertEvents(pending);
    const alerts = [];

    for (const insertedEvent of inserted) {
      const blocklistMatch = insertedEvent.domain ? blocklistMap.get(String(insertedEvent.domain).toLowerCase()) ?? null : null;
      const created = await runAlertPipeline(store, hub, insertedEvent, blocklistMatch);
      alerts.push(...created);
      if (insertedEvent.risk_level === "high" || insertedEvent.risk_level === "critical") {
        hub.broadcastRiskEvent(insertedEvent.org_id, insertedEvent);
      }
      if (insertedEvent.device_id) {
        await store.touchDevice(insertedEvent.device_id);
      }
    }

    return {
      acknowledgedIds: normalized.map((event) => event.id),
      insertedCount: inserted.length,
      skippedCount: normalized.length - inserted.length,
      alertsCreated: alerts.length
    };
  }

  const hub = createWebsocketHub(server, {
    onRiskEvent: ({ orgId, deviceId, event }) => {
      processEvents({
        orgId,
        deviceId,
        incomingEvents: [event]
      }).catch((error) => {
        console.error(`Risk event processing failed: ${error.message}`);
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", databaseMode: "postgres", websockets: true });
  });

  app.post("/api/auth/register", async (req, res) => {
    const parsed = validateRegistrationInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    try {
      const existingUser = await store.findUserByEmail(parsed.email);
      if (existingUser) {
        return res.status(409).json({ message: "A user with that email already exists." });
      }

      let organization = await store.findOrganizationByName(parsed.organization);
      let extensionApiKey = null;

      if (!organization) {
        extensionApiKey = createExtensionApiKey();
        const extensionApiKeyHash = await bcrypt.hash(extensionApiKey, 12);
        organization = await store.createOrganization({
          name: parsed.organization,
          extensionApiKeyHash
        });
      }

      const userCount = await store.countUsersByOrganization(organization.id);
      const role = userCount === 0 ? "admin" : "user";
      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const user = await store.createUser({
        orgId: organization.id,
        fullName: parsed.fullName,
        email: parsed.email,
        passwordHash,
        role
      });

      return res.status(201).json({
        message: role === "admin" ? "Workspace created. You are the organization admin." : "User registered successfully.",
        user: serializeSessionUser({
          ...user,
          org_name: organization.name
        }),
        extensionApiKey
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to register user.", detail: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = validateLoginInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    try {
      const record = await store.getUserWithOrganizationByEmail(parsed.email);
      if (!record) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const matches = await bcrypt.compare(parsed.password, record.password);
      if (!matches) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      return res.json({
        token: issueUserToken(record),
        user: serializeSessionUser(record)
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to sign in.", detail: error.message });
    }
  });

  app.post("/api/auth/verify", async (req, res) => {
    const orgId = String(req.body.org_id || "").trim();
    const apiKey = String(req.body.api_key || "").trim();

    if (!orgId || !apiKey) {
      return res.status(400).json({ message: "org_id and api_key are required." });
    }

    try {
      const organization = await store.getOrganizationByApiKey(orgId);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      if (!organization.extension_api_key_hash || organization.extension_api_key_hash === "UNCONFIGURED") {
        return res.status(403).json({
          message: "Extension API key has not been configured for this organization yet."
        });
      }

      const matches = await bcrypt.compare(apiKey, organization.extension_api_key_hash);
      if (!matches) {
        return res.status(401).json({ message: "Invalid extension credentials." });
      }

      return res.json({
        token: issueExtensionToken({ orgId: organization.id, orgName: organization.name }),
        org: {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          status: organization.status
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to verify extension credentials.", detail: error.message });
    }
  });

  app.get("/api/me", verifyToken, async (req, res) => {
    try {
      const record = await store.getUserWithOrganizationById(req.user.userId);
      if (!record || record.org_id !== req.user.org_id) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.json({ user: serializeSessionUser(record) });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load current user.", detail: error.message });
    }
  });

  app.post("/api/devices/register", verifyIngestionToken, async (req, res) => {
    const parsed = validateDeviceRegistration(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    try {
      const device = await store.registerDevice({
        id: parsed.deviceId,
        employeeId: parsed.employeeId ?? req.user.userId ?? null,
        orgId: req.user.org_id,
        deviceFingerprint: parsed.deviceFingerprint,
        browser: parsed.browser,
        os: parsed.os
      });

      return res.status(201).json({
        device,
        token: issueExtensionToken({
          orgId: req.user.org_id,
          orgName: (await store.getOrganizationById(req.user.org_id))?.name ?? "Organization",
          deviceId: device.id
        })
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to register device.", detail: error.message });
    }
  });

  app.get("/api/config/blocklist", verifyIngestionToken, async (req, res) => {
    try {
      const blocklist = await store.getBlocklist(req.user.org_id);
      return res.json({ blocklist });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load blocklist.", detail: error.message });
    }
  });

  app.get("/api/config/settings", verifyIngestionToken, async (req, res) => {
    try {
      const organization = await store.getOrganizationById(req.user.org_id);
      return res.json({
        settings: organization?.settings ?? {
          idle_threshold_seconds: 60,
          sync_interval_minutes: 5,
          blocklist_sync_minutes: 30,
          incognito_monitoring: false,
          monitoring_enabled: true
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load settings.", detail: error.message });
    }
  });

  app.post("/api/events/batch", verifyIngestionToken, async (req, res) => {
    const events = Array.isArray(req.body.events) ? req.body.events : [];
    if (events.length === 0) {
      return res.status(400).json({ message: "events array is required." });
    }

    try {
      const result = await processEvents({
        orgId: req.user.org_id,
        employeeId: req.user.userId ?? null,
        deviceId: req.user.device_id ?? null,
        incomingEvents: events
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({ message: "Unable to ingest events batch.", detail: error.message });
    }
  });

  app.get("/api/dashboard/summary", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      const summary = await store.getDashboardSummary(req.user.org_id);
      return res.json(summary);
    } catch (error) {
      return res.status(500).json({ message: "Unable to load dashboard summary.", detail: error.message });
    }
  });

  app.get("/api/dashboard/top-domains", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json({ items: await store.getTopDomains(req.user.org_id) });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load top domains.", detail: error.message });
    }
  });

  app.get("/api/dashboard/heatmap", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json({ items: await store.getHeatmap(req.user.org_id) });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load heatmap.", detail: error.message });
    }
  });

  app.get("/api/dashboard/recent-alerts", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json({ items: await store.listRecentAlerts(req.user.org_id, 10) });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load recent alerts.", detail: error.message });
    }
  });

  app.get("/api/activity/timeline", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json({
        items: await store.getActivityTimeline(req.user.org_id, {
          employeeId: req.query.employee_id,
          category: req.query.category,
          riskLevel: req.query.risk_level,
          dateFrom: req.query.date_from,
          dateTo: req.query.date_to
        })
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load activity timeline.", detail: error.message });
    }
  });

  app.get("/api/activity/employee/:id/summary", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json(await store.getEmployeeActivitySummary(req.user.org_id, req.params.id));
    } catch (error) {
      return res.status(500).json({ message: "Unable to load employee summary.", detail: error.message });
    }
  });

  app.get("/api/activity/employee/:id/session", verifyToken, requireUserOrAdmin, async (req, res) => {
    const eventId = String(req.query.event_id || "").trim();
    if (!eventId) {
      return res.status(400).json({ message: "event_id query param is required." });
    }

    try {
      return res.json({
        items: await store.getEmployeeSession(req.user.org_id, req.params.id, eventId)
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load employee session.", detail: error.message });
    }
  });

  app.get("/api/alerts", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      return res.json({
        items: await store.listAlerts(req.user.org_id, {
          status: req.query.status,
          severity: req.query.severity,
          type: req.query.type,
          employeeId: req.query.employee_id
        })
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load alerts.", detail: error.message });
    }
  });

  app.patch("/api/alerts/:id", verifyToken, requireAdmin, async (req, res) => {
    const status = String(req.body.status || "").trim();
    if (!status) {
      return res.status(400).json({ message: "status is required." });
    }

    try {
      const alert = await store.updateAlertStatus(req.user.org_id, req.params.id, status);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found." });
      }
      return res.json({ alert });
    } catch (error) {
      return res.status(500).json({ message: "Unable to update alert.", detail: error.message });
    }
  });

  app.post("/api/alerts/:id/assign", verifyToken, requireAdmin, async (req, res) => {
    const assignedTo = String(req.body.assigned_to || "").trim();
    if (!assignedTo) {
      return res.status(400).json({ message: "assigned_to is required." });
    }

    try {
      const alert = await store.assignAlert(req.user.org_id, req.params.id, assignedTo);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found." });
      }
      return res.json({ alert });
    } catch (error) {
      return res.status(500).json({ message: "Unable to assign alert.", detail: error.message });
    }
  });

  app.post("/api/alerts/:id/note", verifyToken, requireAdmin, async (req, res) => {
    const note = String(req.body.note || "").trim();
    if (!note) {
      return res.status(400).json({ message: "note is required." });
    }

    try {
      const alert = await store.addAlertNote(req.user.org_id, req.params.id, note);
      if (!alert) {
        return res.status(404).json({ message: "Alert not found." });
      }
      return res.json({ alert });
    } catch (error) {
      return res.status(500).json({ message: "Unable to add alert note.", detail: error.message });
    }
  });

  app.get("/api/admin/dashboard", verifyToken, requireAdmin, async (req, res) => {
    try {
      const organization = await store.getOrganizationById(req.user.org_id);
      const users = await store.getUsersByOrganization(req.user.org_id);

      return res.json({
        company: {
          id: organization?.id ?? req.user.org_id,
          name: organization?.name ?? "Organization",
          totalUsers: users.length
        },
        users: users.map((user) => ({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        })),
        stats: [
          { label: "Company users", value: String(users.length), delta: `${users.filter((user) => user.role === "user").length} monitored employees`, tone: "info" },
          { label: "Admins", value: String(users.filter((user) => user.role === "admin").length), delta: "Administrative operators", tone: "success" },
          { label: "Plan", value: organization?.plan ?? "enterprise", delta: organization?.status ?? "active", tone: "warn" }
        ]
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load admin dashboard.", detail: error.message });
    }
  });

  app.post("/api/admin/users", verifyToken, requireAdmin, async (req, res) => {
    const parsed = validateAdminUserInput(req.body);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    try {
      const existingUser = await store.findUserByEmail(parsed.email);
      if (existingUser) {
        return res.status(409).json({ message: "A user with that email already exists." });
      }

      const passwordHash = await bcrypt.hash(parsed.password, 12);
      const user = await store.createUserInOrganization({
        orgId: req.user.org_id,
        fullName: parsed.fullName,
        email: parsed.email,
        passwordHash,
        role: parsed.role
      });

      return res.status(201).json({
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to create user.", detail: error.message });
    }
  });

  app.get("/api/admin/extension", verifyToken, requireAdmin, async (req, res) => {
    try {
      const organization = await store.getExtensionDownloadInfo(req.user.org_id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      const downloadLimit = organization.plan === "starter" ? STARTER_EXTENSION_DOWNLOAD_LIMIT : null;
      return res.json({
        organization: {
          id: organization.id,
          name: organization.name,
          plan: organization.plan,
          status: organization.status
        },
        apiEndpoint: PUBLIC_API_BASE_URL,
        apiKeyConfigured:
          Boolean(organization.extension_api_key_hash) && organization.extension_api_key_hash !== "UNCONFIGURED",
        downloads: {
          count: organization.extension_download_count ?? 0,
          limit: downloadLimit,
          lastDownloadedAt: organization.extension_last_downloaded_at
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load extension setup.", detail: error.message });
    }
  });

  app.post("/api/admin/extension-key/rotate", verifyToken, requireAdmin, async (req, res) => {
    try {
      const nextApiKey = createExtensionApiKey();
      const nextApiKeyHash = await bcrypt.hash(nextApiKey, 12);
      await store.updateOrganizationExtensionApiKey(req.user.org_id, nextApiKeyHash);

      return res.json({
        extensionApiKey: nextApiKey
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to rotate extension API key.", detail: error.message });
    }
  });

  app.post("/api/admin/extension/download", verifyToken, requireAdmin, async (req, res) => {
    try {
      const organization = await store.getExtensionDownloadInfo(req.user.org_id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found." });
      }

      if (organization.plan === "starter" && organization.extension_download_count >= STARTER_EXTENSION_DOWNLOAD_LIMIT) {
        return res.status(403).json({
          message: `Starter plan extension downloads are limited to ${STARTER_EXTENSION_DOWNLOAD_LIMIT}. Upgrade to download again.`
        });
      }

      const updated = await store.recordExtensionDownload(req.user.org_id);
      const bundle = buildExtensionBundle();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="browser-audit-extension.zip"');
      res.setHeader("X-Extension-Download-Count", String(updated?.extension_download_count ?? ""));
      return res.send(bundle);
    } catch (error) {
      return res.status(500).json({ message: "Unable to download extension.", detail: error.message });
    }
  });

  app.get("/api/user/dashboard", verifyToken, requireUserOrAdmin, async (req, res) => {
    try {
      const record = await store.getUserWithOrganizationById(req.user.userId);
      if (!record || record.org_id !== req.user.org_id) {
        return res.status(404).json({ message: "User not found." });
      }

      return res.json({
        user: serializeSessionUser(record),
        stats: [
          { label: "Role", value: record.role === "admin" ? "Administrator" : "Standard user", delta: "Current access level", tone: "info" },
          { label: "Tenant", value: record.org_name, delta: "Isolated organization", tone: "success" },
          { label: "JWT session", value: "1 day", delta: "Token expiry window", tone: "warn" }
        ],
        permissions: record.role === "admin"
          ? ["Create company users", "View company data", "Access shared dashboards"]
          : ["View personal access", "Use shared dashboards", "Access profile and settings"]
      });
    } catch (error) {
      return res.status(500).json({ message: "Unable to load user dashboard.", detail: error.message });
    }
  });

  server.listen(PORT, () => {
    console.log(`Audit API listening on http://localhost:${PORT} (database: postgres, websockets: enabled)`);
  });
}

startServer().catch((error) => {
  console.error(`Failed to start Audit API: ${error.message}`);
  process.exit(1);
});
