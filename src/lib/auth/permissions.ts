import type { Role } from "@/generated/prisma/enums";

export const PERMISSIONS = [
  "content.manage", // pages, homepage, highlights, statistics, programs, staff, admissions, FAQs
  "news.manage",
  "events.manage",
  "gallery.manage",
  "media.manage",
  "navigation.manage",
  "messages.manage",
  "settings.manage", // site settings & SEO defaults
  "theme.manage",
  "users.manage",
  "audit.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/** To add a role: extend the Role enum in schema.prisma and add its entry here. */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: [
    "content.manage",
    "news.manage",
    "events.manage",
    "gallery.manage",
    "media.manage",
    "navigation.manage",
    "messages.manage",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
};
