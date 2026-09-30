# Merciful Paradise Academy — Website & CMS

Public website and administrator CMS for Merciful Paradise Academy (MPA), Tigray, Ethiopia.
It replaces the previous single-page site at mpa.edu.et.

> **Status:** Phase 3 (foundation) complete — auth, database, theme system, global layout.
> Public pages (Phase 4) and the full admin CMS (Phase 5) are in progress.

## Stack

| Concern | Choice |
|---|---|
| App | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS 4, design tokens as CSS variables (editable in Admin → Theme) |
| Database | Supabase Postgres via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Supabase Auth (`@supabase/ssr`), roles `SUPER_ADMIN` / `ADMIN` |
| Files | Supabase Storage |
| Forms / validation | React Hook Form + Zod |
| Rich text | Tiptap (stored as JSON, rendered server-side through a whitelist) |
| Hosting | Vercel |

## Project layout

```
prisma/            schema, migrations, seed script, original MPA images used by the seed
scripts/           storage bucket setup, RLS check
src/app/(site)/    public website
src/app/admin/     admin CMS (login + dashboard)
src/components/    public/, admin/, ui/
src/lib/           auth, permissions, supabase clients, theme, storage config, helpers
src/server/        queries/ (cached public reads) and actions/ (server actions)
src/proxy.ts       refreshes the admin session and redirects signed-out visitors
tests/             unit tests (Vitest)
```

## Getting started (local)

Requirements: Node.js 20.9+ (developed on 24), npm, and **either** Docker Desktop for a local
Supabase stack **or** a Supabase cloud project used for development.

```bash
npm install
cp .env.example .env.local        # then fill it in — see below
npm run db:deploy                 # apply migrations
npm run db:seed                   # storage buckets, MPA content, first super admin
npm run dev                       # http://localhost:3000 — admin at /admin
```

### Option A — local Supabase (Docker)

```bash
npx supabase init                 # once
npx supabase start                # prints API URL, anon key, service_role key, DB URL
```

Use the printed values in `.env.local`. `DATABASE_URL` and `DIRECT_URL` are both the printed DB URL
(`postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

### Option B — Supabase cloud project

In the Supabase dashboard: **Connect** → copy the *Transaction pooler* string into `DATABASE_URL`
and the *Session pooler* (or direct) string into `DIRECT_URL`. **Project Settings → API** gives the
URL, anon key and service_role key.

## Environment variables

See [`.env.example`](.env.example) for the full list with comments.

| Variable | Where it is used |
|---|---|
| `DATABASE_URL` | Runtime queries (pooled connection) |
| `DIRECT_URL` | Prisma migrations (direct/session connection) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth (browser + server) and public image URLs |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only: uploads, seeding. Never expose it. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, Open Graph |
| `SITE_INDEXING` | `true` only on the final production domain; otherwise every page is `noindex` |
| `IP_HASH_SECRET` | Hashing contact-form IPs for rate limiting |
| `SEED_ADMIN_*` | Seed only — creates the first super admin |

## Security model

- Only admins have accounts. Each Supabase Auth user must also have an `AdminUser` row to enter `/admin`.
- Every server action and admin page calls `requirePermission()` / `requireAdminPage()`
  (`src/lib/auth/session.ts`). The proxy redirect is a convenience, not the security boundary.
- The app talks to Postgres only through Prisma on the server. Row Level Security is enabled on every
  table with **no policies**, and the API roles are revoked, so the public anon key cannot read or write
  tables. After adding a migration, run `npm run db:check-rls`.
- Theme settings accept only validated hex colours and enums — no custom CSS.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint`, `npm run typecheck`, `npm test` | Quality checks |
| `npm run db:migrate` | Create + apply a migration in development |
| `npm run db:deploy` | Apply migrations (production / CI) |
| `npm run db:seed` | Seed MPA content (idempotent; never overwrites admin edits) |
| `npm run db:check-rls` | Verify RLS is enabled on all tables |
| `npm run storage:setup` | Create/update storage buckets |

## Content notes

- Seed content comes from the previous site's `site-content.json` and chatbot knowledge base
  (the chatbot itself was retired; its answers became FAQs).
- Five photos on the old site were generic stock images, not MPA photos, and were not migrated.
  Upload real photos in the admin.

Deployment (Vercel) documentation will be completed in Phase 8.
