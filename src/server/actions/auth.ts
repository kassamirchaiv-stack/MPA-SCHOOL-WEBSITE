"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth/session";

const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export type SignInResult = { error: string } | undefined;

export async function signIn(input: z.input<typeof signInSchema>): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password, next } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password." };

  const admin = await db.adminUser.findUnique({ where: { id: data.user.id } });
  if (!admin?.active) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the website admin." };
  }

  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await audit(admin, { action: "auth.login", entity: "AdminUser", entityId: admin.id, summary: "Signed in" });

  // Only follow redirects back into the admin area.
  redirect(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
}

export async function signOut() {
  const admin = await getCurrentAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  if (admin) await audit(admin, { action: "auth.logout", entity: "AdminUser", entityId: admin.id, summary: "Signed out" });
  redirect("/admin/login");
}
