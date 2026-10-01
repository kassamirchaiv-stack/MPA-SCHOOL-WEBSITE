import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/session";
import { PageHeader } from "@/components/admin/page-header";
import { UserManager } from "./user-manager";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireAdminPage("users.manage");
  const users = await db.adminUser.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader
        title="Users"
        description="People who can sign in to this admin. Super admins can manage everything; admins can manage website content but not users, theme or site settings."
      />
      <UserManager
        currentUserId={me.id}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
