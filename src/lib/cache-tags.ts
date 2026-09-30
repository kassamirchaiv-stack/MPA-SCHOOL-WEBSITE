/** Cache tags for public data. Admin mutations call updateTag() with these. */
export const TAGS = {
  settings: "site-settings",
  theme: "theme",
  navigation: "navigation",
  homepage: "homepage",
  pages: "pages",
  highlights: "highlights",
  statistics: "statistics",
  programs: "programs",
  news: "news",
  events: "events",
  gallery: "gallery",
  staff: "staff",
  faqs: "faqs",
  media: "media",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];
