/**
 * Built-in pages: their content is editable in Admin → Pages, but they live at
 * fixed addresses and cannot be deleted or renamed.
 */
export const SYSTEM_PAGES: Record<string, { path: string; label: string }> = {
  about: { path: "/about", label: "About MPA" },
  campuses: { path: "/about/campuses", label: "Our Campuses" },
  leadership: { path: "/about/leadership", label: "Leadership & Staff" },
  programs: { path: "/programs", label: "Programs (listing)" },
  "student-life": { path: "/student-life", label: "Student Life" },
  admissions: { path: "/admissions", label: "Admissions" },
  faq: { path: "/faq", label: "FAQ (listing)" },
  news: { path: "/news", label: "News (listing)" },
  events: { path: "/events", label: "Events (listing)" },
  gallery: { path: "/gallery", label: "Gallery (listing)" },
  contact: { path: "/contact", label: "Contact" },
  privacy: { path: "/privacy", label: "Privacy Policy" },
};

/** Top-level addresses already taken by the application. */
const RESERVED = new Set([
  ...Object.keys(SYSTEM_PAGES),
  "admin",
  "api",
  "preview",
  "sitemap.xml",
  "robots.txt",
  "index",
  "home",
  "search",
  "content-api.php",
  "chat-api.php",
]);

export function isSystemPage(slug: string) {
  return slug in SYSTEM_PAGES;
}

export function isReservedSlug(slug: string) {
  return RESERVED.has(slug);
}

/** Public address of a page. Custom pages are served at /<slug>. */
export function pagePath(slug: string) {
  return SYSTEM_PAGES[slug]?.path ?? `/${slug}`;
}
