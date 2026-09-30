# URL migration from the previous mpa.edu.et site

The previous site was a single page (`index.html`) with anchor sections, plus `admin.html`
and two PHP endpoints. Server redirects live in `next.config.ts`.

| Old URL | New URL | How |
|---|---|---|
| `/index.html` | `/` | 308 redirect (`next.config.ts`) |
| `/admin.html` | `/admin` | 308 redirect (`next.config.ts`) |
| `/content-api.php` | — | 410 Gone (route handler) — planned, Phase 4 |
| `/chat-api.php` | — | 410 Gone (route handler) — planned, Phase 4 |
| `/data/site-content.json`, `/data/school-kb.json` | — | 404 (content now lives in the database) |
| `/#about` | `/about` | client-side: fragments never reach the server — planned, Phase 4 |
| `/#academics` | `/programs` | client-side — planned |
| `/#life` | `/student-life` | client-side — planned |
| `/#digital` | `/about` | client-side — planned |
| `/#admissions` | `/admissions` | client-side — planned |
| `/#contact` | `/contact` | client-side — planned |
