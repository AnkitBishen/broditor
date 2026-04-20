require("./env");

const { Pool } = require("pg");

function normalize(value) {
  return String(value || "").trim();
}

class PostgresStore {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required.");
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  async ping() {
    await this.pool.query("select 1");
  }

  async ensureEventPartitions(date = new Date()) {
    await this.pool.query("select create_monthly_events_partition($1::date)", [date]);
  }

  async findOrganizationByName(name) {
    const result = await this.pool.query(
      "select * from organizations where lower(name) = lower($1) limit 1",
      [normalize(name)]
    );
    return result.rows[0] ?? null;
  }

  async createOrganization({ name, extensionApiKeyHash, plan = "enterprise", status = "active" }) {
    const result = await this.pool.query(
      `insert into organizations (name, extension_api_key_hash, plan, status)
       values ($1, $2, $3, $4)
       returning *`,
      [normalize(name), extensionApiKeyHash, plan, status]
    );
    return result.rows[0];
  }

  async getOrganizationById(id) {
    const result = await this.pool.query("select * from organizations where id = $1 limit 1", [id]);
    return result.rows[0] ?? null;
  }

  async updateOrganizationExtensionApiKey(orgId, extensionApiKeyHash) {
    const result = await this.pool.query(
      `update organizations
       set extension_api_key_hash = $2
       where id = $1
       returning *`,
      [orgId, extensionApiKeyHash]
    );
    return result.rows[0] ?? null;
  }

  async getOrganizationByApiKey(orgId) {
    const result = await this.pool.query(
      "select * from organizations where id = $1 limit 1",
      [orgId]
    );
    return result.rows[0] ?? null;
  }

  async findUserByEmail(email) {
    const result = await this.pool.query(
      "select * from users where lower(email) = lower($1) limit 1",
      [normalize(email)]
    );
    return result.rows[0] ?? null;
  }

  async countUsersByOrganization(orgId) {
    const result = await this.pool.query(
      "select count(*)::int as count from users where org_id = $1",
      [orgId]
    );
    return result.rows[0]?.count ?? 0;
  }

  async createUser({ orgId, fullName, email, passwordHash, role }) {
    const result = await this.pool.query(
      `insert into users (org_id, full_name, email, password, role)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [orgId, normalize(fullName), normalize(email).toLowerCase(), passwordHash, role]
    );
    return result.rows[0];
  }

  async getUserWithOrganizationByEmail(email) {
    const result = await this.pool.query(
      `select u.*, o.name as org_name, o.plan, o.status, o.settings
       from users u
       join organizations o on o.id = u.org_id
       where lower(u.email) = lower($1)
       limit 1`,
      [normalize(email)]
    );
    return result.rows[0] ?? null;
  }

  async getUserWithOrganizationById(id) {
    const result = await this.pool.query(
      `select u.*, o.name as org_name, o.plan, o.status, o.settings
       from users u
       join organizations o on o.id = u.org_id
       where u.id = $1
       limit 1`,
      [id]
    );
    return result.rows[0] ?? null;
  }

  async getUsersByOrganization(orgId) {
    const result = await this.pool.query(
      `select u.*, o.name as org_name
       from users u
       join organizations o on o.id = u.org_id
       where u.org_id = $1
       order by u.created_at asc`,
      [orgId]
    );
    return result.rows;
  }

  async registerDevice({ id, employeeId = null, orgId, deviceFingerprint, browser, os }) {
    const result = await this.pool.query(
      `insert into devices (id, employee_id, org_id, device_fingerprint, browser, os, registered_at, last_seen_at)
       values ($1, $2, $3, $4, $5, $6, now(), now())
       on conflict (id)
       do update set
         employee_id = coalesce(excluded.employee_id, devices.employee_id),
         device_fingerprint = excluded.device_fingerprint,
         browser = excluded.browser,
         os = excluded.os,
         last_seen_at = now()
       returning *`,
      [id, employeeId, orgId, deviceFingerprint, browser, os]
    );
    return result.rows[0];
  }

  async touchDevice(deviceId) {
    await this.pool.query(
      "update devices set last_seen_at = now() where id = $1",
      [deviceId]
    );
  }

  async getBlocklist(orgId) {
    const result = await this.pool.query(
      "select id, org_id, domain, category, created_at from blocklist where org_id = $1 order by domain asc",
      [orgId]
    );
    return result.rows;
  }

  async listExistingEventIds(orgId, ids) {
    if (!ids.length) {
      return [];
    }

    const result = await this.pool.query(
      "select distinct id from events where org_id = $1 and id = any($2::uuid[])",
      [orgId, ids]
    );
    return result.rows.map((row) => row.id);
  }

  async insertEvents(events) {
    const inserted = [];

    for (const event of events) {
      const result = await this.pool.query(
        `insert into events (
          id, org_id, employee_id, device_id, event_type, url, domain, page_title,
          dwell_seconds, category, risk_level, metadata, occurred_at, received_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, now())
        returning id, org_id, employee_id, device_id, event_type, url, domain, page_title,
          dwell_seconds, category, risk_level, metadata, occurred_at, received_at`,
        [
          event.id,
          event.orgId,
          event.employeeId,
          event.deviceId,
          event.eventType,
          event.url,
          event.domain,
          event.pageTitle,
          event.dwellSeconds,
          event.category,
          event.riskLevel,
          JSON.stringify(event.metadata || {}),
          event.occurredAt
        ]
      );
      inserted.push(result.rows[0]);
    }

    return inserted;
  }

  async countRiskyDomainsForEmployee(orgId, employeeId, since) {
    if (!employeeId) {
      return 0;
    }

    const result = await this.pool.query(
      `select count(*)::int as count
       from events
       where org_id = $1
         and employee_id = $2
         and risk_level in ('medium', 'high', 'critical')
         and occurred_at >= $3`,
      [orgId, employeeId, since]
    );
    return result.rows[0]?.count ?? 0;
  }

  async createAlert({ orgId, employeeId = null, eventId = null, alertType, severity, triggerReason, assignedTo = null, note = null }) {
    const result = await this.pool.query(
      `insert into alerts (org_id, employee_id, event_id, alert_type, severity, trigger_reason, assigned_to, note)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [orgId, employeeId, eventId, alertType, severity, triggerReason, assignedTo, note]
    );
    return result.rows[0];
  }

  async listRecentAlerts(orgId, limit = 10) {
    const result = await this.pool.query(
      `select a.*, u.full_name as employee_name
       from alerts a
       left join users u on u.id = a.employee_id
       where a.org_id = $1
       order by a.triggered_at desc
       limit $2`,
      [orgId, limit]
    );
    return result.rows;
  }

  async listAlerts(orgId, filters = {}) {
    const clauses = ["a.org_id = $1"];
    const values = [orgId];

    if (filters.status) {
      values.push(filters.status);
      clauses.push(`a.status = $${values.length}`);
    }

    if (filters.severity) {
      values.push(filters.severity);
      clauses.push(`a.severity = $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      clauses.push(`a.alert_type = $${values.length}`);
    }

    if (filters.employeeId) {
      values.push(filters.employeeId);
      clauses.push(`a.employee_id = $${values.length}`);
    }

    const result = await this.pool.query(
      `select a.*, u.full_name as employee_name, assignee.full_name as assigned_to_name
       from alerts a
       left join users u on u.id = a.employee_id
       left join users assignee on assignee.id = a.assigned_to
       where ${clauses.join(" and ")}
       order by a.triggered_at desc
       limit 100`,
      values
    );
    return result.rows;
  }

  async updateAlertStatus(orgId, alertId, status) {
    const result = await this.pool.query(
      `update alerts
       set status = $3,
           resolved_at = case when $3 in ('resolved', 'dismissed') then now() else resolved_at end
       where id = $1 and org_id = $2
       returning *`,
      [alertId, orgId, status]
    );
    return result.rows[0] ?? null;
  }

  async assignAlert(orgId, alertId, assignedTo) {
    const result = await this.pool.query(
      `update alerts set assigned_to = $3
       where id = $1 and org_id = $2
       returning *`,
      [alertId, orgId, assignedTo]
    );
    return result.rows[0] ?? null;
  }

  async addAlertNote(orgId, alertId, note) {
    const result = await this.pool.query(
      `update alerts
       set note = case when coalesce(note, '') = '' then $3 else note || E'\n' || $3 end
       where id = $1 and org_id = $2
       returning *`,
      [alertId, orgId, note]
    );
    return result.rows[0] ?? null;
  }

  async getDashboardSummary(orgId) {
    const [activeEmployees, alertsToday, violationsWeek, productiveTime] = await Promise.all([
      this.pool.query(
        `select count(distinct employee_id)::int as count
         from events
         where org_id = $1 and occurred_at >= now() - interval '24 hours' and employee_id is not null`,
        [orgId]
      ),
      this.pool.query(
        `select count(*)::int as count
         from alerts
         where org_id = $1 and triggered_at >= date_trunc('day', now())`,
        [orgId]
      ),
      this.pool.query(
        `select count(*)::int as count
         from alerts
         where org_id = $1 and triggered_at >= now() - interval '7 days'`,
        [orgId]
      ),
      this.pool.query(
        `select coalesce(avg(dwell_seconds), 0)::int as avg_seconds
         from events
         where org_id = $1 and dwell_seconds is not null and category = 'productive' and occurred_at >= now() - interval '7 days'`,
        [orgId]
      )
    ]);

    return {
      activeEmployees: activeEmployees.rows[0]?.count ?? 0,
      alertsToday: alertsToday.rows[0]?.count ?? 0,
      violationsThisWeek: violationsWeek.rows[0]?.count ?? 0,
      avgProductiveTimeSeconds: productiveTime.rows[0]?.avg_seconds ?? 0
    };
  }

  async getTopDomains(orgId) {
    const result = await this.pool.query(
      `select domain,
              count(*)::int as visits,
              count(distinct employee_id)::int as employee_count,
              coalesce(sum(dwell_seconds), 0)::int as total_dwell_seconds
       from events
       where org_id = $1
         and occurred_at >= date_trunc('day', now())
         and domain is not null
       group by domain
       order by total_dwell_seconds desc, visits desc
       limit 10`,
      [orgId]
    );
    return result.rows;
  }

  async getHeatmap(orgId) {
    const result = await this.pool.query(
      `select to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD') as day,
              extract(hour from occurred_at)::int as hour,
              count(*)::int as count
       from events
       where org_id = $1
         and occurred_at >= now() - interval '7 days'
       group by 1, 2
       order by 1 asc, 2 asc`,
      [orgId]
    );
    return result.rows;
  }

  async getActivityTimeline(orgId, filters = {}) {
    const clauses = ["e.org_id = $1"];
    const values = [orgId];

    if (filters.employeeId) {
      values.push(filters.employeeId);
      clauses.push(`e.employee_id = $${values.length}`);
    }

    if (filters.category) {
      values.push(filters.category);
      clauses.push(`e.category = $${values.length}`);
    }

    if (filters.riskLevel) {
      values.push(filters.riskLevel);
      clauses.push(`e.risk_level = $${values.length}`);
    }

    if (filters.dateFrom) {
      values.push(filters.dateFrom);
      clauses.push(`e.occurred_at >= $${values.length}`);
    }

    if (filters.dateTo) {
      values.push(filters.dateTo);
      clauses.push(`e.occurred_at <= $${values.length}`);
    }

    const result = await this.pool.query(
      `select e.*, u.full_name as employee_name
       from events e
       left join users u on u.id = e.employee_id
       where ${clauses.join(" and ")}
       order by occurred_at desc
       limit 250`,
      values
    );
    return result.rows;
  }

  async getEmployeeActivitySummary(orgId, employeeId) {
    const [totals, topDomains] = await Promise.all([
      this.pool.query(
        `select coalesce(sum(dwell_seconds), 0)::int as total_active_seconds,
                coalesce(avg(case when category = 'productive' then 1 else 0 end) * 100, 0)::int as productive_ratio
         from events
         where org_id = $1 and employee_id = $2`,
        [orgId, employeeId]
      ),
      this.pool.query(
        `select domain, coalesce(sum(dwell_seconds), 0)::int as total_dwell_seconds
         from events
         where org_id = $1 and employee_id = $2 and domain is not null
         group by domain
         order by total_dwell_seconds desc
         limit 5`,
        [orgId, employeeId]
      )
    ]);

    return {
      totalActiveSeconds: totals.rows[0]?.total_active_seconds ?? 0,
      productiveRatio: totals.rows[0]?.productive_ratio ?? 0,
      topDomains: topDomains.rows
    };
  }

  async getEmployeeSession(orgId, employeeId, eventId, windowMinutes = 30) {
    const anchor = await this.pool.query(
      `select occurred_at
       from events
       where org_id = $1 and employee_id = $2 and id = $3
       order by occurred_at desc
       limit 1`,
      [orgId, employeeId, eventId]
    );

    if (!anchor.rows[0]) {
      return [];
    }

    const result = await this.pool.query(
      `select *
       from events
       where org_id = $1
         and employee_id = $2
         and occurred_at between $3::timestamptz - ($4 || ' minutes')::interval
                             and $3::timestamptz + ($4 || ' minutes')::interval
       order by occurred_at asc`,
      [orgId, employeeId, anchor.rows[0].occurred_at, windowMinutes]
    );

    return result.rows;
  }
}

async function createStore() {
  const store = new PostgresStore();
  await store.ping();
  await store.ensureEventPartitions(new Date());
  return store;
}

module.exports = {
  createStore
};
