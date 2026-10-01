import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string; // resolved in the sidebar
  permission?: Permission;
};

export type AdminNavGroup = { label?: string; items: AdminNavItem[] };

/**
 * Admin sidebar. Items are filtered by the signed-in role before rendering; the
 * pages themselves re-check permissions on the server.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin", icon: "layout-dashboard" }] },
  {
    label: "Content",
    items: [
      { label: "Homepage", href: "/admin/homepage", icon: "home", permission: "content.manage" },
      { label: "Pages", href: "/admin/pages", icon: "file-text", permission: "content.manage" },
      { label: "News", href: "/admin/news", icon: "newspaper", permission: "news.manage" },
      { label: "Events", href: "/admin/events", icon: "calendar-days", permission: "events.manage" },
      { label: "Programs", href: "/admin/programs", icon: "graduation-cap", permission: "content.manage" },
      { label: "Highlights", href: "/admin/highlights", icon: "sparkles", permission: "content.manage" },
      { label: "Statistics", href: "/admin/statistics", icon: "list-ordered", permission: "content.manage" },
      { label: "Staff", href: "/admin/staff", icon: "users", permission: "content.manage" },
      { label: "FAQs", href: "/admin/faqs", icon: "help-circle", permission: "content.manage" },
    ],
  },
  {
    label: "Media",
    items: [
      { label: "Media library", href: "/admin/media", icon: "image", permission: "media.manage" },
      { label: "Gallery", href: "/admin/gallery", icon: "images", permission: "gallery.manage" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Navigation", href: "/admin/navigation", icon: "navigation", permission: "navigation.manage" },
      { label: "Theme", href: "/admin/theme", icon: "palette", permission: "theme.manage" },
      { label: "Site settings", href: "/admin/settings", icon: "settings", permission: "settings.manage" },
      { label: "SEO", href: "/admin/seo", icon: "search", permission: "settings.manage" },
    ],
  },
  {
    label: "Messages",
    items: [{ label: "Contact messages", href: "/admin/messages", icon: "mail", permission: "messages.manage" }],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: "user-cog", permission: "users.manage" },
      { label: "Activity log", href: "/admin/activity", icon: "scroll-text", permission: "audit.view" },
      { label: "My account", href: "/admin/account", icon: "circle-user" },
    ],
  },
];
