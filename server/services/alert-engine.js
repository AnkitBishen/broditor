async function createAlertForRule(store, hub, rule) {
  // Fetch employee name if employee_id is set
  let employeeName = "Unassigned Device";
  console.log("employeeid", rule.employeeId)
  if (rule.employeeId) {
    try {
      const empRes = await store.pool.query(
        "SELECT full_name FROM users WHERE id = $1",
        [rule.employeeId]
      );
      if (empRes.rows.length > 0) {
        employeeName = empRes.rows[0].full_name;
      }
    } catch (err) {
      console.error("Failed to query employee name for alert creation:", err);
    }
  }

  // Deduplication check: Critical — without this you'll flood the admin with 100s of alerts
  // Query all unresolved alerts of the same type for this organization
  const existingRes = await store.pool.query(
    `SELECT id, employee_id, occurrence_count, trigger_reason, triggered_at, status FROM alerts 
     WHERE org_id = $1 
     AND alert_type = $2
     AND status NOT IN ('resolved', 'dismissed')`,
    [rule.orgId, rule.alertType]
  );

  let existingAlert = null;
  for (const row of existingRes.rows) {
    // Match employee_id (both are the same ID, or both are null/undefined)
    const employeeMatch = (row.employee_id === rule.employeeId) ||
      (!row.employee_id && !rule.employeeId);
    if (!employeeMatch) continue;

    // Alert-type specific matching for domain/category/device details
    if (rule.alertType === "BLOCKED_DOMAIN_VISIT") {
      const domain = rule.domain;
      if (domain && row.trigger_reason.toLowerCase().includes(domain.toLowerCase())) {
        existingAlert = row;
        break;
      }
    } else if (rule.alertType === "BLOCKED_CATEGORY_VISIT") {
      const category = rule.category;
      if (category && row.trigger_reason.toLowerCase().includes(category.toLowerCase())) {
        existingAlert = row;
        break;
      }
    } else if (rule.alertType === "EXTENSION_DISABLED") {
      if (rule.deviceBrowser && rule.deviceOs &&
        row.trigger_reason.includes(rule.deviceBrowser) &&
        row.trigger_reason.includes(rule.deviceOs)) {
        existingAlert = row;
        break;
      }
    } else {
      // For other rules (social media, video streaming, etc.), match any unresolved alert
      existingAlert = row;
      break;
    }
  }

  if (existingAlert) {
    const newCount = (existingAlert.occurrence_count || 1) + 1;

    // Calculate time difference in minutes from when it first triggered
    const firstTriggered = new Date(existingAlert.triggered_at);
    const diffMs = new Date() - firstTriggered;
    const minutes = Math.max(1, Math.round(diffMs / (60 * 1000)));

    let newReason = existingAlert.trigger_reason;

    if (rule.alertType === "BLOCKED_DOMAIN_VISIT") {
      newReason = `${employeeName} visited ${rule.domain} ${newCount} times in ${minutes} minutes`;
    } else if (rule.alertType === "BLOCKED_CATEGORY_VISIT") {
      newReason = `${employeeName} visited restricted site: ${rule.category || "restricted"} ${newCount} times in ${minutes} minutes`;
    } else {
      // Strip any existing suffix of the format " (X occurrences)"
      const baseReason = existingAlert.trigger_reason.replace(/\s\(\d+\soccurrences\)$/, "");
      newReason = `${baseReason} (${newCount} occurrences)`;
    }

    // Update the existing alert in database
    await store.pool.query(
      `UPDATE alerts 
       SET occurrence_count = $1, 
           trigger_reason = $2
       WHERE id = $3`,
      [newCount, newReason, existingAlert.id]
    );

    // Broadcast updated alert via WebSocket so UI changes immediately
    hub.broadcastAlert(rule.orgId, {
      id: existingAlert.id,
      alert_type: rule.alertType,
      severity: rule.severity,
      trigger_reason: newReason,
      employee_id: rule.employeeId,
      device_id: rule.deviceId || null,
      triggered_at: existingAlert.triggered_at,
      occurrence_count: newCount,
      status: existingAlert.status
    });

    return null;
  }

  // Format initial alert reasons beautifully incorporating employee name
  let finalTriggerReason = rule.triggerReason;
  if (rule.alertType === "BLOCKED_DOMAIN_VISIT") {
    const timeMatch = rule.triggerReason.match(/at\s(\d{2}:\d{2}\s?(?:AM|PM)?)/i);
    const timeStr = timeMatch ? timeMatch[1] : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    finalTriggerReason = `${employeeName} visited ${rule.domain} at ${timeStr}`;
  } else if (rule.alertType === "BLOCKED_CATEGORY_VISIT") {
    finalTriggerReason = `${employeeName} visited restricted site: ${rule.category || "restricted"} - ${rule.domain}`;
  }

  const alert = await store.createAlert({
    orgId: rule.orgId,
    employeeId: rule.employeeId,
    eventId: rule.eventId,
    deviceId: rule.deviceId || null,
    alertType: rule.alertType,
    severity: rule.severity,
    triggerReason: finalTriggerReason
  });

  // Real-time WebSocket Delivery
  hub.broadcastAlert(rule.orgId, {
    id: alert.id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    trigger_reason: alert.trigger_reason,
    employee_id: alert.employee_id,
    device_id: alert.device_id || null,
    triggered_at: alert.triggered_at,
    occurrence_count: 1
  });

  // Email Delivery (Brevo SMTP transactional email)
  // Only send emails for HIGH severity alerts — otherwise admin inbox gets spammed
  if (rule.severity === "high" || rule.severity === "critical") {
    try {
      // Find the organization admin
      const adminRes = await store.pool.query(
        "SELECT email, full_name FROM users WHERE org_id = $1 AND role = 'admin' LIMIT 1",
        [rule.orgId]
      );
      const admin = adminRes.rows[0];
      const adminEmail = admin?.email;
      const adminName = admin?.full_name || "Admin";

      // Find employee name if employee_id is set
      let employeeName = "Unassigned Device";
      if (rule.employeeId) {
        const empRes = await store.pool.query(
          "SELECT full_name FROM users WHERE id = $1",
          [rule.employeeId]
        );
        if (empRes.rows.length > 0) {
          employeeName = empRes.rows[0].full_name;
        }
      }

      // Fetch device browser/OS metadata if event exists
      let deviceInfo = "Chrome / Windows";
      if (rule.eventId) {
        const eventRes = await store.pool.query(
          `SELECT e.device_id, d.browser, d.os 
           FROM events e 
           LEFT JOIN devices d ON d.id = e.device_id 
           WHERE e.id = $1 LIMIT 1`,
          [rule.eventId]
        );
        if (eventRes.rows.length > 0 && eventRes.rows[0].browser) {
          deviceInfo = `${eventRes.rows[0].browser} / ${eventRes.rows[0].os}`;
        }
      }

      if (adminEmail && process.env.BREVO_API_KEY) {
        const timeFormatted = new Date(alert.triggered_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const alertTypeFormatted = alert.alert_type.replace(/_/g, " ");

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            sender: {
              name: process.env.BREVO_SENDER_NAME || "Broditor",
              email: process.env.BREVO_SENDER_EMAIL || "noreply@yourdomain.com"
            },
            to: [
              {
                email: adminEmail,
                name: adminName
              }
            ],
            subject: `🔴 [Broditor Alert] ${alert.alert_type} - ${employeeName}`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 24px;">🔴 Critical Compliance Alert</h1>
                </div>
                <div style="padding: 24px; color: #1a202c; line-height: 1.6;">
                  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #4a5568; width: 120px;">Alert Type:</td>
                      <td style="padding: 8px 0; color: #1a202c;">${alertTypeFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Employee:</td>
                      <td style="padding: 8px 0; color: #1a202c;">${employeeName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Detail:</td>
                      <td style="padding: 8px 0; color: #ef4444; font-weight: 500;">${alert.trigger_reason}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Device:</td>
                      <td style="padding: 8px 0; color: #1a202c;">${deviceInfo}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #4a5568;">Time:</td>
                      <td style="padding: 8px 0; color: #1a202c;">${timeFormatted}</td>
                    </tr>
                  </table>
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="http://localhost:3000/alerts/${alert.id}" style="background-color: #ef4444; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);">View Alert in Dashboard →</a>
                  </div>
                </div>
                <div style="background-color: #f7fafc; padding: 16px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7;">
                  This is an automated security notification from Broditor. Please do not reply directly to this email.
                </div>
              </div>
            `
          })
        });

        if (response.ok) {
          console.log(`[EMAIL SENT] Successfully sent Brevo transactional email to ${adminEmail} for ${rule.alertType}`);
        } else {
          const errText = await response.text();
          console.error(`[EMAIL ERROR] Brevo API responded with status ${response.status}: ${errText}`);
        }
      } else {
        console.warn(`[EMAIL WARN] Could not send email. AdminEmail: ${adminEmail}, HasApiKey: ${Boolean(process.env.BREVO_API_KEY)}`);
      }
    } catch (err) {
      console.error("[EMAIL ERROR] Failed to send Brevo transactional email:", err);
    }
  }

  return alert;
}

async function runAlertPipeline(store, hub, event, blocklistMatch, employee_id) {
  const alerts = [];
  //console.log("employeeid", employee_id)
  // Standardize property names to handle camelCase/snake_case/lowercase resiliently
  if (event) {
    event.employee_id = employee_id || null;
    event.device_id = event.device_id || event.deviceId || event.deviceid || null;
    event.org_id = event.org_id || event.orgId || event.orgid || null;
  }

  // Bulletproof fallback to resolve employee_id from devices if not set on the event
  if (!event.employee_id && event.device_id) {
    try {
      const devRes = await store.pool.query(
        "SELECT employee_id FROM devices WHERE id = $1 AND org_id = $2 LIMIT 1",
        [event.device_id, event.org_id]
      );
      if (devRes.rows.length > 0 && devRes.rows[0].employee_id) {
        event.employee_id = devRes.rows[0].employee_id;
      }
    } catch (err) {
      console.error("Failed to query employee_id from devices in alert pipeline:", err);
    }
  }

  const occurredDate = new Date(event.occurred_at);
  const timeStr = occurredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hour = occurredDate.getHours();
  const minutes = occurredDate.getMinutes();

  // Load dynamic organization settings
  let settings = {};
  try {
    const orgRes = await store.pool.query(
      "SELECT settings FROM organizations WHERE id = $1",
      [event.org_id]
    );
    settings = orgRes.rows[0]?.settings || {};
  } catch (err) {
    console.error(`Failed to load settings for organization ${event.org_id}:`, err);
  }

  // Work Hours parser
  const [startH, startM] = (settings.work_hours_start || "08:00").split(":").map(Number);
  const [endH, endM] = (settings.work_hours_end || "19:00").split(":").map(Number);

  const localTimeMinutes = hour * 60 + minutes;
  const workStartMinutes = startH * 60 + startM;
  const workEndMinutes = endH * 60 + endM;

  const isOutsideWorkHours = localTimeMinutes < workStartMinutes || localTimeMinutes >= workEndMinutes;
  const isInsideWorkHours = !isOutsideWorkHours;

  // Rule 1 — Blocked Domain Visit (HIGH)
  if (blocklistMatch) {
    const created = await createAlertForRule(store, hub, {
      orgId: event.org_id,
      employeeId: employee_id,
      eventId: event.id,
      deviceId: event.device_id || null,
      alertType: "BLOCKED_DOMAIN_VISIT",
      severity: "high",
      triggerReason: `Visited blocked domain: ${event.domain} at ${timeStr}`,
      domain: event.domain
    });
    if (created) alerts.push(created);
  }

  // Rule 2 — Large Download (HIGH)
  const downloadBytes = Number(event.metadata?.download_bytes || 0);
  const largeDownloadThresholdBytes = (settings.large_download_mb || 50) * 1024 * 1024;
  const TRUSTED_DOMAINS = ["google.com", "microsoft.com", "github.com"];
  if (event.event_type === "download" && downloadBytes > largeDownloadThresholdBytes && !TRUSTED_DOMAINS.includes(event.domain)) {
    const sizeMB = (downloadBytes / (1024 * 1024)).toFixed(1);
    const filename = event.metadata?.filename || "unknown file";
    const created = await createAlertForRule(store, hub, {
      orgId: event.org_id,
      employeeId: event.employee_id,
      eventId: event.id,
      deviceId: event.device_id || null,
      alertType: "LARGE_DOWNLOAD",
      severity: "high",
      triggerReason: `Downloaded ${sizeMB}MB file '${filename}' from ${event.domain}`
    });
    if (created) alerts.push(created);
  }

  // Rule 4 — Outside Work Hours (MEDIUM)
  if (isOutsideWorkHours && ["tabs_updated", "navigation_completed"].includes(event.event_type)) {
    const created = await createAlertForRule(store, hub, {
      orgId: event.org_id,
      employeeId: event.employee_id,
      eventId: event.id,
      deviceId: event.device_id || null,
      alertType: "OUTSIDE_WORK_HOURS",
      severity: "medium",
      triggerReason: `Browser activity detected outside work hours at ${timeStr}`
    });
    if (created) alerts.push(created);
  }

  // Rule 5 — Blocked Category Visit (MEDIUM)
  // Check if the event's category exists in the org's blocklist (category match)
  // Skip if we already matched the exact domain (Rule 1) to avoid duplicate alert noise
  if (!blocklistMatch && event.category && event.category !== "general" && event.category !== "productive") {
    const categoryBlocked = await store.pool.query(
      "SELECT 1 FROM blocklist WHERE org_id = $1 AND category = $2 LIMIT 1",
      [event.org_id, event.category]
    );

    if (categoryBlocked.rows.length > 0) {
      const created = await createAlertForRule(store, hub, {
        orgId: event.org_id,
        employeeId: event.employee_id,
        eventId: event.id,
        deviceId: event.device_id || null,
        alertType: "BLOCKED_CATEGORY_VISIT",
        severity: "medium",
        triggerReason: `Visited ${event.category} site: ${event.domain}`,
        domain: event.domain,
        category: event.category
      });
      if (created) alerts.push(created);
    }
  }

  // Cumulative Checks
  if (event.employee_id && event.dwell_seconds > 0) {
    // startOfDay relative to event's occurred day
    const startOfDay = new Date(event.occurred_at);
    startOfDay.setHours(0, 0, 0, 0);

    // Rule 6 — Excessive Social Media (LOW)
    if (event.category === "social") {
      const socialDwell = await store.pool.query(
        "SELECT SUM(dwell_seconds)::int as total FROM events WHERE org_id = $1 AND employee_id = $2 AND category = 'social' AND occurred_at >= $3",
        [event.org_id, event.employee_id, startOfDay.toISOString()]
      );
      const totalSocial = socialDwell.rows[0]?.total || 0;
      if (totalSocial > 1800) {
        const created = await createAlertForRule(store, hub, {
          orgId: event.org_id,
          employeeId: event.employee_id,
          eventId: event.id,
          deviceId: event.device_id || null,
          alertType: "EXCESSIVE_SOCIAL_MEDIA",
          severity: "low",
          triggerReason: `Spent ${Math.floor(totalSocial / 60)} min on social media today`
        });
        if (created) alerts.push(created);
      }
    }

    // Rule 7 — Excessive Video (LOW)
    if (event.category === "video" && isInsideWorkHours) {
      const videoEvents = await store.pool.query(
        "SELECT dwell_seconds, occurred_at FROM events WHERE org_id = $1 AND employee_id = $2 AND category = 'video' AND occurred_at >= $3",
        [event.org_id, event.employee_id, startOfDay.toISOString()]
      );

      let totalVideo = 0;
      for (const row of videoEvents.rows) {
        const rowDate = new Date(row.occurred_at);
        const rowH = rowDate.getHours();
        const rowM = rowDate.getMinutes();
        const rowTimeMin = rowH * 60 + rowM;
        if (rowTimeMin >= workStartMinutes && rowTimeMin < workEndMinutes) {
          totalVideo += row.dwell_seconds || 0;
        }
      }

      if (totalVideo > 1800) {
        const created = await createAlertForRule(store, hub, {
          orgId: event.org_id,
          employeeId: event.employee_id,
          eventId: event.id,
          deviceId: event.device_id || null,
          alertType: "EXCESSIVE_VIDEO",
          severity: "low",
          triggerReason: `Spent ${Math.floor(totalVideo / 60)} min on video streaming during work hours`
        });
        if (created) alerts.push(created);
      }
    }
  }

  // Rule 8 — Excessive Idle (LOW)
  const isIdleEvent = event.event_type === "idle" && (event.metadata?.state === "idle" || event.metadata?.state === undefined);
  const idleDuration = event.dwell_seconds || event.metadata?.duration || event.metadata?.dwell_seconds || 0;
  if (isIdleEvent && idleDuration > 2700 && isInsideWorkHours) {
    const created = await createAlertForRule(store, hub, {
      orgId: event.org_id,
      employeeId: event.employee_id,
      eventId: event.id,
      deviceId: event.device_id || null,
      alertType: "EXCESSIVE_IDLE",
      severity: "low",
      triggerReason: `Employee idle for ${Math.floor(idleDuration / 60)} min during work hours`
    });
    if (created) alerts.push(created);
  }

  return alerts;
}

// Rule 3 — Extension Disabled (HIGH)
async function checkExtensionDisabled(store, hub) {
  try {
    console.log("[INACTIVITY SWEEP] Starting checkExtensionDisabled execution...");
    const orgsRes = await store.pool.query("SELECT id, name, settings FROM organizations");
    for (const org of orgsRes.rows) {
      const settings = org.settings || {};

      const hour = new Date().getHours();
      const minutes = new Date().getMinutes();

      const [startH, startM] = (settings.work_hours_start || "08:00").split(":").map(Number);
      const [endH, endM] = (settings.work_hours_end || "19:00").split(":").map(Number);

      const localTimeMinutes = hour * 60 + minutes;
      const workStartMinutes = startH * 60 + startM;
      const workEndMinutes = endH * 60 + endM;

      const isOutsideWorkHours = localTimeMinutes < workStartMinutes || localTimeMinutes >= workEndMinutes;
      console.log(`[INACTIVITY SWEEP] Org "${org.name}" (${org.id}) local time is ${hour}:${minutes}. Work hours: ${settings.work_hours_start || "08:00"} - ${settings.work_hours_end || "19:00"}. Outside work hours: ${isOutsideWorkHours}`);

      if (isOutsideWorkHours) {
        console.log(`[INACTIVITY SWEEP] Skipping org "${org.name}" because it is outside working hours.`);
        continue;
      }

      // Extension appears disabled — no activity for 60+ min
      const inactiveDevices = await store.pool.query(
        `SELECT d.*, u.full_name as employee_name
         FROM devices d
         LEFT JOIN users u ON u.id = d.employee_id
         WHERE d.org_id = $1
         AND d.last_seen_at < NOW() - INTERVAL '60 minutes'
         AND d.last_seen_at > NOW() - INTERVAL '7 days'`,
        [org.id]
      );

      console.log(`[INACTIVITY SWEEP] Found ${inactiveDevices.rows.length} inactive devices for org "${org.name}".`);

      for (const device of inactiveDevices.rows) {
        const lastSeenTimeStr = new Date(device.last_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log(`[INACTIVITY SWEEP] Device ${device.id} (Employee: ${device.employee_name || 'Unassigned'}) last seen at ${device.last_seen_at} (inactive > 60m). Triggering alert...`);

        await createAlertForRule(store, hub, {
          orgId: device.org_id,
          employeeId: device.employee_id,
          eventId: null,
          deviceId: device.id,
          alertType: "EXTENSION_DISABLED",
          severity: "high",
          triggerReason: `Extension appears disabled — no activity from ${device.browser} / ${device.os} since ${lastSeenTimeStr}`,
          deviceBrowser: device.browser,
          deviceOs: device.os
        });
      }
    }
  } catch (err) {
    console.error("Failed in checkExtensionDisabled scheduler:", err);
  }
}

module.exports = {
  runAlertPipeline,
  checkExtensionDisabled
};
