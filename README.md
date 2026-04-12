# Browser Activity Audit & Compliance Platform

A B2B SaaS UI with a multi-tenant authentication and authorization system built on Next.js App Router, React, Tailwind CSS, Express, JWT, and PostgreSQL-ready storage.

## What is implemented

- Public landing page, registration page, and login page
- Multi-tenant registration flow:
  Each company is created once and reused for later users
  The first user in a company becomes `admin`
  Later users become `user`
- JWT authentication with 1-day expiry
- HTTP-only cookie session handling on the Next.js side
- Protected route enforcement in `proxy.ts`
- Role-based authorization for admin-only and shared routes
- Frontend auth context for global session state
- Admin and user dashboards backed by protected Express endpoints
- PostgreSQL schema for `companies` and `users`
- In-memory fallback storage when `DATABASE_URL` is not set, so local development still works

## Key routes

Frontend:

- `/`
- `/register`
- `/login`
- `/dashboard/admin`
- `/dashboard/user`

Backend:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/admin/dashboard`
- `GET /api/user/dashboard`

## Environment variables

Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
API_JWT_SECRET=change-this-in-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/browser_audit
```

`DATABASE_URL` is optional for local testing because the Express API falls back to memory storage when it is absent.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Start the backend in a second terminal:

```bash
npm run server
```

4. Optional: run both at once:

```bash
npm run dev:all
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000`

## PostgreSQL setup

If you want the backend to persist users and companies in Postgres:

1. Create a database named `browser_audit`
2. Point `DATABASE_URL` at that database
3. Run the schema in [server/schema.sql](d:\project\auditor\server\schema.sql)

Example:

```bash
psql "$DATABASE_URL" -f server/schema.sql
```

## How the auth flow works

1. A user registers with full name, work email, organization, and password
2. The Express API creates or reuses the company
3. The password is hashed with `bcryptjs`
4. The first company user is assigned `admin`, later users get `user`
5. Login issues a JWT containing `userId`, `role`, and `company_id`
6. Next.js stores that token in an HTTP-only cookie
7. `proxy.ts` verifies the token and blocks unauthorized routes
8. Admin users can reach admin-only routes; standard users are redirected to their allowed dashboard

## Files to look at

- [server/index.js](d:\project\auditor\server\index.js)
- [server/auth-middleware.js](d:\project\auditor\server\auth-middleware.js)
- [server/store.js](d:\project\auditor\server\store.js)
- [server/schema.sql](d:\project\auditor\server\schema.sql)
- [proxy.ts](d:\project\auditor\proxy.ts)
- [app/api/session/login/route.ts](d:\project\auditor\app\api\session\login\route.ts)
- [app/api/session/register/route.ts](d:\project\auditor\app\api\session\register\route.ts)
- [app/api/session/me/route.ts](d:\project\auditor\app\api\session\me\route.ts)
- [components/AuthProvider.tsx](d:\project\auditor\components\AuthProvider.tsx)
- [app/dashboard/admin/page.tsx](d:\project\auditor\app\dashboard\admin\page.tsx)
- [app/dashboard/user/page.tsx](d:\project\auditor\app\dashboard\user\page.tsx)

## Security notes

- The app uses HTTP-only cookie storage for the JWT rather than `localStorage`
- Passwords are hashed before storage
- The proxy protects frontend routes
- Express middleware protects backend routes
- Role checks are enforced separately from authentication
