import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission, type Permission } from "./permissions";

export type CurrentAdmin = {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Data access layer entry point: verifies the Supabase session and that the user
 * is an active admin. Returns null for visitors. Memoised per request.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  const admin = await db.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!admin?.active) return null;
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
});

/** For pages: redirect visitors to the login screen. */
export async function requireAdminPage(permission?: Permission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (permission && !hasPermission(admin.role, permission)) redirect("/admin?denied=1");
  return admin;
}

/** For server actions and route handlers: throw instead of redirecting. */
export async function requirePermission(permission: Permission): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AuthorizationError("Your session has expired. Please sign in again.");
  if (!hasPermission(admin.role, permission)) throw new AuthorizationError();
  return admin;
}
