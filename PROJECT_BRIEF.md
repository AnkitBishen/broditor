# Browser Activity Audit & Compliance Platform - Project Brief

## Overview

Browser Activity Audit & Compliance Platform is a multi-tenant B2B SaaS project for monitoring browser activity, collecting audit events from a Chrome extension, surfacing compliance alerts, and giving admins and users role-based dashboards.

The project combines:

- A Next.js App Router frontend for authentication, dashboards, activity, alerts, team, profile, and settings screens.
- An Express API server for authentication, tenant management, event ingestion, dashboard queries, alert workflows, and extension configuration.
- A PostgreSQL schema for organizations, users, devices, blocklists, partitioned browser events, and alerts.
- A Manifest V3 Chrome extension that captures browser activity and sends it to the backend.
- A WebSocket path for live high-risk event delivery.

## Technology Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Express 5, Node.js, JWT, bcryptjs
- Database: PostgreSQL via `pg`
- Browser extension: Chrome Manifest V3, ES modules, `chrome.storage`, tabs, webNavigation, idle, downloads, alarms, windows APIs
- Realtime: `ws`
- Tooling: npm scripts, concurrently, PostCSS, Tailwind

## Runtime Commands

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Run the backend API:

```bash
npm run server
```

Run both together:

```bash
npm run dev:all
```

Build the Next.js app:

```bash
npm run build
```

## Environment

Configuration is defined in `.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
API_JWT_SECRET=change-this-in-production
DATABASE_URL=postgresql://postgres:mypass@localhost:5432/browser_audit
```

`NEXT_PUBLIC_API_BASE_URL` points frontend session/API helpers at the Express API. `API_JWT_SECRET` signs user and extension JWTs. `DATABASE_URL` enables PostgreSQL persistence.

## Frontend Application

The frontend lives under `app/`, `components/`, and `lib/`.

Major routes:

- `/` - public landing/onboarding page
- `/register` - organization and user registration
- `/login` - login and redirect handling
- `/dashboard` - role-aware dashboard redirect
- `/dashboard/admin` - admin dashboard
- `/dashboard/user` - user dashboard
- `/activity` - browser activity timeline and filtering
- `/alerts` - alert list, filtering, and operational alert views
- `/analytics` - analytics dashboard
- `/team` - admin/team management UI
- `/users/[id]` - user detail view
- `/profile` - current user profile
- `/settings` - settings page

Core frontend pieces:

- `proxy.ts` protects routes and redirects users based on session and role.
- `components/AuthProvider.tsx` exposes global auth state and auth actions.
- `components/AppShell.tsx`, `Navbar.tsx`, and `Sidebar.tsx` provide authenticated layout/navigation.
- `components/Card.tsx`, `Badge.tsx`, `Table.tsx`, `BarList.tsx`, `LineChart.tsx`, `Modal.tsx`, and loading components form the dashboard UI kit.
- `lib/session-cookie.ts`, `lib/auth.ts`, and `lib/routing.ts` handle token/session and route authorization logic.
- `lib/server-api.ts` and `lib/api.ts` connect server components/client code to backend APIs.
- `lib/mock-data.ts` provides local fallback/sample dashboard and activity data.

## Authentication And Authorization

The app supports multi-tenant registration and role-based access:

1. A user registers with name, email, organization, and password.
2. The backend creates or reuses the organization.
3. The first user in an organization becomes `admin`.
4. Later users become `user`.
5. Passwords are hashed with `bcryptjs`.
6. Login returns a JWT with user, role, and organization claims.
7. Next.js stores the JWT in an HTTP-only session cookie.
8. `proxy.ts` verifies route access before pages load.
9. Express middleware separately enforces API authentication and role checks.

Important modules:

- `server/auth-middleware.js` verifies bearer tokens, ingestion tokens, and admin/user permissions.
- `server/index.js` issues user and extension JWTs.
- `lib/routing.ts` defines protected/admin route behavior.
- `app/api/session/*` routes bridge browser sessions to the backend auth API.

## Backend API

The backend entrypoint is `server/index.js`.

Core backend responsibilities:

- User registration and login
- Extension credential verification
- Device registration
- Remote extension config delivery
- Browser event batch ingestion
- Event normalization, deduplication, categorization, and risk scoring
- Dashboard summary/top-domain/heatmap/recent-alert queries
- Activity timeline and employee activity/session queries
- Alert listing, assignment, status updates, and notes
- Admin dashboard and extension API key rotation
- User dashboard
- WebSocket server creation for live risk events

Important API groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify`
- `GET /api/me`
- `POST /api/devices/register`
- `GET /api/config/blocklist`
- `GET /api/config/settings`
- `POST /api/events/batch`
- `GET /api/dashboard/*`
- `GET /api/activity/*`
- `GET /api/alerts`
- `PATCH /api/alerts/:id`
- `POST /api/alerts/:id/assign`
- `POST /api/alerts/:id/note`
- `GET /api/admin/dashboard`
- `POST /api/admin/extension-key/rotate`
- `GET /api/user/dashboard`

Supporting services:

- `server/services/enrichment.js` derives domain, category, and risk level.
- `server/services/alert-engine.js` creates alerts from risky events.
- `server/services/websocket-hub.js` handles live WebSocket event routing.
- `server/store.js` abstracts persistence and dashboard queries.

## Database Model

The schema is in `server/schema.sql`.

Primary tables:

- `organizations` - tenant record, plan/status, extension API key hash, settings
- `users` - organization users with `admin` or `user` role
- `devices` - registered extension devices
- `blocklist` - organization-specific blocked or risky domains
- `events` - partitioned browser audit events
- `alerts` - generated compliance/security alerts

Notable database behavior:

- Uses `pgcrypto` for UUID generation.
- Uses enum types for user roles, organization plans, and organization status.
- Browser events are partitioned by month using `create_monthly_events_partition`.
- Indexes support tenant-scoped user, event, domain, and alert queries.

## Chrome Extension

The active extension lives in `extension/`.

Manifest:

- Manifest V3
- Background service worker: `service-worker.js`
- Module service worker enabled with `"type": "module"`
- Options page: `options.html`
- Managed storage schema: `managed_schema.json`
- Permissions include storage, tabs, webNavigation, idle, downloads, alarms, and windows.

Extension modules:

- `extension/options.html` renders the setup UI.
- `extension/options.js` runs the options page logic.
- `extension/config.js` reads managed policy config or locally saved options config.
- `extension/storage.js` wraps local storage for tokens, device ID, queues, blocklist, settings, and WebSocket backoff.
- `extension/api.js` verifies credentials, registers devices, syncs queued events, and refreshes remote config.
- `extension/websocket.js` connects to `/events/live` and emits live risk events.
- `extension/service-worker.js` captures tab/navigation/download/idle/dwell events and queues or emits them.

Extension activation flow:

1. Admin gets organization ID and extension API key.
2. User/admin enters credentials in the options page.
3. Options script saves config to `chrome.storage.local`.
4. Extension verifies credentials with `/api/auth/verify`.
5. Extension registers the browser/device.
6. Extension refreshes blocklist and settings.
7. Extension starts the live WebSocket connection.
8. Service worker captures browser activity and syncs batches to `/api/events/batch`.

There is also an `extension-/` directory with an older or alternate extension copy. The graph analysis found semantic overlap between `extension-/service-worker.js` and `extension/service-worker.js`, and between their config resolvers. Treat `extension/` as the active implementation unless intentionally comparing or migrating from `extension-/`.

## Event And Alert Flow

1. The extension captures activity from browser APIs.
2. The service worker builds normalized event payloads.
3. Events are queued locally in extension storage.
4. The queue flushes periodically or after enough events accumulate.
5. The backend normalizes and deduplicates incoming events.
6. The backend derives domain/category/risk metadata.
7. High-risk/blocklisted activity can create alerts.
8. Critical or high-risk events are broadcast through the WebSocket hub.
9. Dashboard, activity, alert, and user detail pages query tenant-scoped data.

## Security Model

- User JWTs are stored in HTTP-only cookies on the Next.js side.
- Extension credentials are separate from user login credentials.
- Extension API keys are hashed before storage.
- Extension ingestion uses JWTs with `token_type: "extension"`.
- User-facing backend routes require authenticated user JWTs.
- Admin-only routes require the `admin` role.
- Tenant scoping is enforced through organization IDs in tokens and store queries.

## Project Map From Graph Analysis

The generated graph in `graphify-out/` found:

- 457 nodes
- 763 edges
- 30 communities
- Strong core nodes around `PostgresStore`, `cx()`, UI primitives, session helpers, routing helpers, and API fetch helpers.

Important graph communities:

- `service-worker.js / api.js` - extension capture, config, device registration, queue sync, and WebSocket behavior
- `index.js / auth-middleware.js` - Express API, auth, role checks, ingestion verification
- `Postgres Store / Alert Rule Pipeline` - data access, event persistence, enrichment, alerting
- `App Shell / Auth Context Value` - frontend authenticated shell and global auth state
- `Team Client / Team Response` - team/admin user management views
- `Activity Filtering Experience / Session Gate Proxy` - monitoring UI and session route protection

Notable graph findings:

- The active extension and `extension-/` appear to have overlapping runtime/config concepts.
- Route protection appears in both frontend proxy logic and backend middleware, which is intentional defense in depth.
- Extension event capture and live-risk WebSocket emission form a distinct pipeline.
- Several communities have low cohesion scores, especially `service-worker.js / api.js` and `index.js / auth-middleware.js`, suggesting future refactors could split large modules by responsibility.

## Current Outputs And Generated Files

The graphify run produced:

- `graphify-out/graph.html` - interactive graph visualization
- `graphify-out/graph.json` - raw graph data
- `graphify-out/GRAPH_REPORT.md` - graph audit report

These files are useful for architecture navigation and future codebase questions.

## Known Notes

- `extension/options.html` now loads `extension/options.js` externally because Chrome extension CSP blocks inline scripts.
- `README.md` still describes the original auth/dashboard foundation, while the current codebase also includes extension ingestion, activity monitoring, alerts, devices, blocklists, and realtime behavior.
- `DATABASE_URL` is present in `.env.example`; confirm whether local development should use PostgreSQL only or retain memory fallback behavior in documentation.
- The backend CORS origin is currently hardcoded to `http://localhost:3000`.
- The extension has broad `<all_urls>` host permissions, which matches audit capture needs but should be reviewed before production release.
