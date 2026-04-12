async function createAlertForRule(store, hub, rule) {
  const alert = await store.createAlert({
    orgId: rule.orgId,
    employeeId: rule.employeeId,
    eventId: rule.eventId,
    alertType: rule.alertType,
    severity: rule.severity,
    triggerReason: rule.triggerReason
  });

  hub.broadcastAlert(rule.orgId, alert);
  return alert;
}

async function runAlertPipeline(store, hub, event, blocklistMatch) {
  const alerts = [];

  if (blocklistMatch) {
    alerts.push(
      await createAlertForRule(store, hub, {
        orgId: event.org_id,
        employeeId: event.employee_id,
        eventId: event.id,
        alertType: "blocked_domain_visited",
        severity: "high",
        triggerReason: `Domain ${event.domain} matched blocklist category ${blocklistMatch.category}`
      })
    );
  }

  const downloadBytes = Number(event.metadata?.download_bytes || 0);
  if (event.event_type === "download" && downloadBytes > 50 * 1024 * 1024) {
    alerts.push(
      await createAlertForRule(store, hub, {
        orgId: event.org_id,
        employeeId: event.employee_id,
        eventId: event.id,
        alertType: "large_download",
        severity: "high",
        triggerReason: `Download exceeded 50MB (${downloadBytes} bytes)`
      })
    );
  }

  const occurredHour = new Date(event.occurred_at).getHours();
  if (occurredHour < 7 || occurredHour > 19) {
    alerts.push(
      await createAlertForRule(store, hub, {
        orgId: event.org_id,
        employeeId: event.employee_id,
        eventId: event.id,
        alertType: "after_hours_activity",
        severity: "medium",
        triggerReason: `Activity detected outside business hours at ${occurredHour}:00`
      })
    );
  }

  if (event.employee_id) {
    const riskyCount = await store.countRiskyDomainsForEmployee(
      event.org_id,
      event.employee_id,
      new Date(new Date(event.occurred_at).getTime() - 10 * 60 * 1000).toISOString()
    );

    if (riskyCount >= 3) {
      alerts.push(
        await createAlertForRule(store, hub, {
          orgId: event.org_id,
          employeeId: event.employee_id,
          eventId: event.id,
          alertType: "multiple_risky_domains",
          severity: "high",
          triggerReason: "Employee hit 3 or more risky events within a 10 minute window"
        })
      );
    }
  }

  return alerts;
}

module.exports = {
  runAlertPipeline
};
