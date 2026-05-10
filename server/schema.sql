create extension if not exists "pgcrypto";

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'companies'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'organizations'
  ) then
    alter table companies rename to organizations;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'user');
  end if;

  if not exists (select 1 from pg_type where typname = 'org_plan') then
    create type org_plan as enum ('starter', 'growth', 'enterprise');
  end if;

  if not exists (select 1 from pg_type where typname = 'org_status') then
    create type org_status as enum ('active', 'trial', 'suspended');
  end if;
end $$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan org_plan not null default 'starter',
  status org_status not null default 'active',
  extension_api_key_hash text not null default 'UNCONFIGURED',
  extension_download_count integer not null default 0,
  extension_last_downloaded_at timestamptz,
  settings jsonb not null default jsonb_build_object(
    'idle_threshold_seconds', 60,
    'sync_interval_minutes', 5,
    'blocklist_sync_minutes', 30,
    'incognito_monitoring', false,
    'monitoring_enabled', true
  ),
  created_at timestamptz not null default now()
);

alter table organizations add column if not exists plan org_plan not null default 'starter';
alter table organizations alter column plan set default 'starter';
alter table organizations add column if not exists status org_status not null default 'active';
alter table organizations add column if not exists extension_api_key_hash text not null default 'UNCONFIGURED';
alter table organizations add column if not exists extension_download_count integer not null default 0;
alter table organizations add column if not exists extension_last_downloaded_at timestamptz;
alter table organizations add column if not exists settings jsonb not null default jsonb_build_object(
  'idle_threshold_seconds', 60,
  'sync_interval_minutes', 5,
  'blocklist_sync_minutes', 30,
  'incognito_monitoring', false,
  'monitoring_enabled', true
);

create unique index if not exists organizations_name_lower_idx on organizations ((lower(name)));

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'company_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'org_id'
  ) then
    alter table users rename column company_id to org_id;
  end if;
end $$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  password text not null,
  role user_role not null,
  created_at timestamptz not null default now()
);

create unique index if not exists users_email_lower_idx on users ((lower(email)));
create index if not exists users_org_id_idx on users (org_id);

create table if not exists devices (
  id uuid primary key,
  employee_id uuid references users(id) on delete set null,
  org_id uuid not null references organizations(id) on delete cascade,
  device_fingerprint text not null,
  browser text not null,
  os text not null,
  registered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists devices_org_employee_idx on devices (org_id, employee_id);
create index if not exists devices_last_seen_idx on devices (last_seen_at desc);

create table if not exists blocklist (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  domain text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists blocklist_org_domain_idx on blocklist (org_id, lower(domain));

create table if not exists events (
  id uuid not null,
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid references users(id) on delete set null,
  device_id uuid references devices(id) on delete set null,
  event_type text not null,
  url text,
  domain text,
  page_title text,
  dwell_seconds integer,
  category text,
  risk_level text not null default 'low',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  primary key (id, occurred_at)
) partition by range (occurred_at);

create or replace function create_monthly_events_partition(target_date date)
returns void
language plpgsql
as $$
declare
  partition_start date := date_trunc('month', target_date)::date;
  partition_end date := (date_trunc('month', target_date) + interval '1 month')::date;
  partition_name text := format('events_%s', to_char(partition_start, 'YYYY_MM'));
begin
  execute format(
    'create table if not exists %I partition of events for values from (%L) to (%L)',
    partition_name,
    partition_start,
    partition_end
  );

  execute format(
    'create index if not exists %I on %I (org_id, employee_id, occurred_at)',
    partition_name || '_org_employee_occurred_idx',
    partition_name
  );

  execute format(
    'create index if not exists %I on %I (org_id, occurred_at desc)',
    partition_name || '_org_occurred_idx',
    partition_name
  );

  execute format(
    'create index if not exists %I on %I (org_id, domain)',
    partition_name || '_org_domain_idx',
    partition_name
  );
end;
$$;

select create_monthly_events_partition(current_date);
select create_monthly_events_partition((current_date + interval '1 month')::date);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  employee_id uuid references users(id) on delete set null,
  event_id uuid,
  alert_type text not null,
  severity text not null,
  status text not null default 'open',
  trigger_reason text not null,
  assigned_to uuid references users(id) on delete set null,
  note text,
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists alerts_org_status_idx on alerts (org_id, status, triggered_at desc);
create index if not exists alerts_org_employee_idx on alerts (org_id, employee_id, triggered_at desc);
