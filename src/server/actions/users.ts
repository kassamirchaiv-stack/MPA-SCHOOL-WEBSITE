"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requiredText } from "@/lib/validation/common";
import { ActionError, adminAction } from "./_lib";

const password = z.string().min(12, "Use at least 12 characters").max(72, "Use at most 72 characters");

const createSchema = z.object({
  name: requiredText("Name", 120),
  email: z.email("Enter a valid email").transform((v) => v.trim().toLowerCase()),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  password,
});

/** Creates a Supabase Auth login and the matching admin record. */
export async function createAdminUser(input: z.input<typeof createSchema>) {
  return adminAction(input, {
    permission: "users.manage",
    schema: createSchema,
    run: async ({ name, email, role, password: pw }, admin) => {
      if (await db.adminUser.findUnique({ where: { email } })) {
        throw new ActionError("An admin with this email already exists.", { email: "Already an admin" });
      }
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { name } });
      if (error || !data.user) {
        throw new ActionError(
          error?.message.includes("already") ? "This email already has a login. Ask the developer to link it." : "Could not create the login.",
          { email: "Could not create" },
        );
      }
      const user = await db.adminUser.create({ data: { id: data.user.id, email, name, role } });
      await audit(admin, { action: "user.create", entity: "AdminUser", entityId: user.id, summary: `Added ${role === "SUPER_ADMIN" ? "super admin" : "admin"} ${email}` });
    },
  });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: requiredText("Name", 120),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  active: z.boolean(),
});

async function assertAnotherSuperAdmin(excludingId: string) {
  const others = await db.adminUser.count({ where: { role: "SUPER_ADMIN", active: true, id: { not: excludingId } } });
  if (others === 0) throw new ActionError("There must always be at least one active super admin.");
}

export async function updateAdminUser(input: z.input<typeof updateSchema>) {
  return adminAction(input, {
    permission: "users.manage",
    schema: updateSchema,
    run: async ({ id, name, role, active }, admin) => {
      const current = await db.adminUser.findUniqueOrThrow({ where: { id } });
      const losingSuperAdmin = current.role === "SUPER_ADMIN" && current.active && (role !== "SUPER_ADMIN" || !active);
      if (losingSuperAdmin) await assertAnotherSuperAdmin(id);
      if (id === admin.id && !active) throw new ActionError("You cannot deactivate your own account.");
      await db.adminUser.update({ where: { id }, data: { name, role, active } });
      if (!active) {
        // End their sessions so deactivation takes effect immediately.
        await createSupabaseAdminClient().auth.admin.signOut(id).catch(() => undefined);
      }
      await audit(admin, {
        action: "user.update",
        entity: "AdminUser",
        entityId: id,
        summary: `Updated ${current.email}: ${role === "SUPER_ADMIN" ? "super admin" : "admin"}, ${active ? "active" : "deactivated"}`,
      });
    },
  });
}

const resetSchema = z.object({ id: z.string().uuid(), password });

export async function resetAdminPassword(input: z.input<typeof resetSchema>) {
  return adminAction(input, {
    permission: "users.manage",
    schema: resetSchema,
    run: async ({ id, password: pw }, admin) => {
      const user = await db.adminUser.findUniqueOrThrow({ where: { id } });
      const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(id, { password: pw });
      if (error) throw new ActionError("Could not set the new password.");
      await audit(admin, { action: "user.reset_password", entity: "AdminUser", entityId: id, summary: `Reset the password for ${user.email}` });
    },
  });
}

export async function deleteAdminUser(input: { id: string }) {
  return adminAction(input, {
    permission: "users.manage",
    schema: z.object({ id: z.string().uuid() }),
    run: async ({ id }, admin) => {
      if (id === admin.id) throw new ActionError("You cannot delete your own account.");
      const user = await db.adminUser.findUniqueOrThrow({ where: { id } });
      if (user.role === "SUPER_ADMIN" && user.active) await assertAnotherSuperAdmin(id);
      await db.adminUser.delete({ where: { id } });
      await createSupabaseAdminClient().auth.admin.deleteUser(id).catch(() => undefined);
      await audit(admin, { action: "user.delete", entity: "AdminUser", entityId: id, summary: `Removed admin ${user.email}` });
    },
  });
}

// ─── Own account (any admin) ──────────────────────────────────────────────────

const ownPasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: password, confirm: z.string() })
  .refine((v) => v.newPassword === v.confirm, { message: "The passwords do not match", path: ["confirm"] });

export async function changeOwnPassword(input: z.input<typeof ownPasswordSchema>) {
  return adminAction(input, {
    permission: "content.manage",
    schema: ownPasswordSchema,
    run: async ({ currentPassword, newPassword }, admin) => {
      const supabase = await createSupabaseServerClient();
      // Re-check the current password before changing it.
      const check = await supabase.auth.signInWithPassword({ email: admin.email, password: currentPassword });
      if (check.error) throw new ActionError("Your current password is incorrect.", { currentPassword: "Incorrect password" });
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new ActionError("Could not change the password. Please try again.");
      await audit(admin, { action: "user.change_password", entity: "AdminUser", entityId: admin.id, summary: "Changed their own password" });
    },
  });
}
