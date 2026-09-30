import type { Permission } from "@/lib/auth/permissions";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name, resolved in the sidebar
  permission?: Permission;
};

export type AdminNavGroup = { label?: string; items: AdminNavItem[] };

/**
 * Admin sidebar. Items are filtered by the signed-in role before rendering; the
 * pages themselves re-check permissions on the server.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin", icon: "layout-dashboard" }] },
];
