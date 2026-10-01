# URL migration from the previous mpa.edu.et site

The previous site was a single page (`index.html`) with anchor sections, plus `admin.html`, two PHP
endpoints and two JSON data files. All of them are handled:

| Old URL | New URL | How |
|---|---|---|
| `/index.html` | `/` | 308 redirect (`next.config.ts`) |
| `/admin.html` | `/admin` | 308 redirect (`next.config.ts`) |
| `/content-api.php` | — | 410 Gone (`src/app/content-api.php/route.ts`) |
| `/chat-api.php` | — | 410 Gone (`src/app/chat-api.php/route.ts`) |
| `/data/site-content.json`, `/data/school-kb.json` | — | 404 (content now lives in the database) |
| `/#about` | `/about` | client-side redirect on the homepage (`legacy-hash-redirect.tsx`) |
| `/#academics` | `/programs` | client-side redirect |
| `/#life` | `/student-life` | client-side redirect |
| `/#digital` | `/about` | client-side redirect |
| `/#admissions` | `/admissions` | client-side redirect |
| `/#contact` | `/contact` | client-side redirect |

URL fragments (`#…`) are never sent to the server, which is why the anchor redirects run in the
browser.

## Content mapping

| Old content | New location |
|---|---|
| Branding, contact, meta | Admin → Site settings, Theme, SEO |
| Hero | Homepage → Hero slides |
| Announcements (2) | News, category "Announcements" |
| Stats (4) | Statistics |
| About, history | Pages → About MPA |
| Vision, mission, values | Site settings |
| Academic programmes (3) | Programs |
| "Why choose MPA" features (4) | Highlights → Why MPA |
| Events cards (Parents' Day, Student Activities) | Highlights → Student life (they had no dates) |
| Admission steps | Highlights → Admission steps (the app-download step was dropped: the app link is hidden) |
| Campuses (from stats and chatbot) | Highlights → Campuses |
| Chatbot knowledge base (16 answers) | FAQs (13 published, grouped by category) |
| "AI-Augmented Digital" section | Not migrated (described the retired chatbot) |
| Stock photos (5) and Bootstrap favicon | Not migrated — not MPA images |
