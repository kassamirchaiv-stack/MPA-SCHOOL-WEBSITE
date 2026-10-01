# Merciful Paradise Academy — Website & CMS

Public website and administrator CMS for Merciful Paradise Academy (MPA), Tigray, Ethiopia.
It replaces the previous single-page site at mpa.edu.et. School staff manage all content at `/admin`
without touching code — see the **[Admin guide](docs/ADMIN-GUIDE.md)**.

**Scope:** public website + website CMS only. There are no student, parent or teacher accounts and no
school-management features (grades, attendance, fees, timetables).

## Stack

| Concern | Choice |
|---|---|
| App | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Styling | Tailwind CSS 4, design tokens as CSS variables (editable in Admin → Theme) |
| Database | Supabase Postgres via Prisma 7 (`@prisma/adapter-pg`) |
| Auth | Supabase Auth, roles `SUPER_ADMIN` / `ADMIN` |
| Files | Supabase Storage (direct browser uploads with signed URLs) |
| Forms / validation | React Hook Form + Zod (same schemas on client and server) |
| Rich text | Tiptap (stored as JSON, rendered server-side through a whitelist) |
| Tests | Vitest (unit), Playwright + axe (end-to-end, accessibility) |
| Hosting | Vercel |

## Project layout

```
prisma/              schema, migrations, seed script, original MPA images used by the seed
scripts/             build preflight, storage bucket setup, RLS check
src/app/(site)/      public website (home, about, programs, news, events, gallery, contact, …)
src/app/admin/       admin CMS: login, dashboard and every management section; preview/
src/components/      public/, admin/, ui/
src/lib/             auth & permissions, Supabase clients, theme, SEO, storage config, validation
src/server/queries/  cached public reads ("use cache" + cache tags)
src/server/actions/  server actions — all admin writes go through adminAction() in _lib.ts
src/proxy.ts         refreshes the admin session; redirects signed-out visitors
tests/               unit tests; tests/e2e/ end-to-end, accessibility and link checks
docs/                admin guide, URL migration map
```

## Getting started

Requirements: Node.js 20.9+ (developed on 24), npm, and a Supabase project (or Docker for a local
Supabase stack via `npx supabase start`).

```bash
npm install
cp .env.example .env.local        # fill it in — see "Environment variables"
npm run db:deploy                 # create the tables
npm run db:seed                   # storage buckets, MPA content and images, first super admin
npm run dev                       # http://localhost:3000 — admin at /admin
```

The seed is idempotent and never overwrites edits made in the admin. After it has created your
account you can remove `SEED_ADMIN_PASSWORD` from `.env.local`.

## Environment variables

See [`.env.example`](.env.example) for comments on each.

| Variable | Where | Notes |
|---|---|---|
| `DATABASE_URL` | local + Vercel | Supabase → Connect → **Transaction pooler** (port 6543) |
| `DIRECT_URL` | local + Vercel | Supabase → Connect → **Session pooler** (port 5432). Not the `db.<ref>.supabase.co` host: it is IPv6-only and unreachable from Vercel. |
| `NEXT_PUBLIC_SUPABASE_URL` | local + Vercel | `https://<ref>.supabase.co` — nothing after `.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local + Vercel | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | local + Vercel | service_role / secret key — server only, mark Sensitive |
| `NEXT_PUBLIC_SITE_URL` | local + Vercel | canonical URLs, sitemap, Open Graph (no trailing slash) |
| `SITE_INDEXING` | local + Vercel | `true` only on the final domain; otherwise every page is `noindex` |
| `IP_HASH_SECRET` | local + Vercel | any long random string (contact-form rate limiting) |
| `DATABASE_POOL_MAX` | optional | connections per server instance, default 5 |
| `SEED_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | local only | used once by `npm run db:seed` |

Passwords in connection strings must be URL-encoded: `/` → `%2F`, `@` → `%40`, `#` → `%23`, `?` → `%3F`.

## Deployment (Vercel + Supabase)

Public pages are prerendered from the database, so **the database must be migrated and seeded
before the first build**. Every build runs `scripts/preflight.ts`, which stops with a clear message if
a variable is missing or the database is not ready.

1. **Database (once, from your machine):** put the production values and `SEED_ADMIN_*` in
   `.env.local`, then `npm run db:deploy` and `npm run db:seed`.
2. **Vercel → Project → Settings → Environment Variables:** add every "local + Vercel" variable above.
3. **Deploy:** push to `main`. `vercel.json` runs `npm run vercel-build` — pending migrations
   (`prisma migrate deploy`), the preflight, then the build.
4. **Check:** open `/`, sign in at `/admin`, and look at Admin → SEO → Health check.

`vercel.json` pins server functions to `pdx1` (Portland), next to the Supabase database in `us-west-2`
(Oregon). If the database moves, change `regions` to the closest Vercel region.

`NEXT_PUBLIC_*` values are compiled into the build — redeploy after changing them.

### Moving to the school's own domain

1. Vercel → Project → Domains: add the domain and set the DNS records it shows.
2. Set `NEXT_PUBLIC_SITE_URL=https://<domain>` and `SITE_INDEXING=true`, then redeploy.
3. In Supabase → Authentication → URL configuration, set the Site URL to the new domain.
4. Old URLs (`/index.html`, `/admin.html`, `/#admissions` …) are redirected — see
   [docs/url-migration.md](docs/url-migration.md).

## Security model

- Only admins have accounts. A Supabase Auth user must also have an `AdminUser` row to enter `/admin`.
- Every admin page and server action checks permissions on the server (`requireAdminPage()` /
  `adminAction()`); the proxy redirect is only a convenience. Permissions live in
  `src/lib/auth/permissions.ts` — add a role there and in the `Role` enum.
- Postgres is reached only through Prisma on the server. RLS is enabled on every table with no
  policies and the Data API roles are revoked, so the public anon key cannot read or write tables.
  After adding a migration run `npm run db:check-rls`.
- Uploads: the server issues short-lived signed upload URLs per bucket and re-checks the stored file's
  real type and size before registering it. SVG and executables are rejected.
- Rich text is rendered through a whitelist (no raw HTML); links are sanitised; theme values are
  validated hex colours and enums — there is no custom CSS input.
- The contact form has a honeypot, a minimum fill time and a per-IP (HMAC-hashed) hourly limit.
- Every admin change is written to the activity log.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Next.js (build runs the preflight) |
| `npm run lint`, `npm run typecheck` | Static checks |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests — see below |
| `npm run db:migrate` | Create + apply a migration in development |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Seed MPA content (idempotent) |
| `npm run db:check-rls` | Verify RLS is on for every table |
| `npm run storage:setup` | Create/update storage buckets |

## Testing

```bash
npm run build && npm run start -- -p 3100   # in one terminal
npm run test:e2e                            # in another
```

The suite covers every public page on desktop and mobile, accessibility (axe, WCAG 2.1 AA) on public
and admin pages, no horizontal scrolling from 320 px to 1920 px, a crawl of every internal link, and
admin flows (login, permissions, article lifecycle, FAQ, media upload, theme, contact inbox).

Admin tests create **temporary accounts and test content in the configured Supabase project** and
delete them afterwards (also on failure). Set `E2E_ADMIN=0` to run only the public tests.

## Content notes

- Seed content comes from the previous site's `site-content.json` and chatbot knowledge base (the
  chatbot was retired; its answers became FAQs).
- Five photos on the old site were generic stock images and its favicon was Bootstrap's logo; none of
  these were migrated. The favicon is generated from the MPA logo. Upload real photos in the admin.
- Known limitation: unknown **top-level** addresses (e.g. `/xyz`) show the not-found page with
  `noindex` but HTTP 200, because custom CMS pages live at `/<slug>`. Deeper paths return 404.
