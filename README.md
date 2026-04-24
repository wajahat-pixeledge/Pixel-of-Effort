# LOE Tracker

Level of Effort tracking web app built with:

- Next.js App Router + TypeScript
- Supabase Auth + Postgres
- Row Level Security (RLS)
- Tailwind CSS + shadcn-style UI primitives

## Core behavior implemented

- Admin can create projects
- Admin can assign projects to approved users
- Users can log time against assigned projects
- Users can also log non-project categories (`time_off`, `office_process`, `free_open`)
- Time entry supports optional comment and status flag
- Admin can review users, approve/reject access, and change roles
- Admin can manage access rules (`domain`, `email`, `pattern`)
- Admin can edit/deactivate projects and manage assignment active dates
- First user is bootstrapped as approved admin

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Set:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; do not expose in client code)

3. Apply SQL migration in Supabase:

- File: `supabase/migrations/202604230001_initial_schema.sql`
- File: `supabase/migrations/202604230002_access_rules_audit_and_rls.sql`

4. Run app:

```bash
npm run dev
```

## Folder structure

```text
app/
  (auth)/
    pending/
    sign-in/
  (protected)/
    admin/
      projects/
      users/
    dashboard/
    layout.tsx
  auth/callback/
  _actions/

components/
  forms/
  layout/
  shared/
  ui/

lib/
  auth.ts
  constants.ts
  database.types.ts
  db/
  supabase/
  validations/

supabase/
  migrations/
```

`app/(protected)/layout.tsx` provides the shared navigation shell for both user and admin views so role-specific routes can grow without repeating layout code.

## Notes on access model

- Sign-in uses Supabase OTP magic links.
- New users are:
  - auto-approved if their email matches an active access rule
  - otherwise created as `pending` until admin approval
- Users without approved access are redirected to `/pending`.

## Security approach

- All write paths are server actions with Zod validation.
- Access control is enforced by RLS policies in Postgres.
- Admin-only operations are protected both in app logic and by RLS.
