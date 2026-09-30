import { describe, expect, it } from "vitest";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";

describe("role permissions", () => {
  it("gives SUPER_ADMIN every permission", () => {
    for (const permission of PERMISSIONS) expect(hasPermission("SUPER_ADMIN", permission)).toBe(true);
  });

  it("lets ADMIN manage content but not users, theme, settings or audit logs", () => {
    expect(hasPermission("ADMIN", "news.manage")).toBe(true);
    expect(hasPermission("ADMIN", "messages.manage")).toBe(true);
    expect(hasPermission("ADMIN", "media.manage")).toBe(true);
    expect(hasPermission("ADMIN", "users.manage")).toBe(false);
    expect(hasPermission("ADMIN", "theme.manage")).toBe(false);
    expect(hasPermission("ADMIN", "settings.manage")).toBe(false);
    expect(hasPermission("ADMIN", "audit.view")).toBe(false);
  });
});
