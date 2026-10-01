/**
 * Temporary admin accounts for the admin end-to-end tests. They are created
 * before the run and removed afterwards together with everything they made, so
 * the suite can run against a real Supabase project without leaving traces.
 */
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

config({ path: [".env.local", ".env"], quiet: true });

export const E2E_PREFIX = "E2E test";
export const E2E_DOMAIN = "e2e.mpa-test.invalid";
export const SUPER = { email: `super@${E2E_DOMAIN}`, name: "E2E Super Admin" };
export const EDITOR = { email: `editor@${E2E_DOMAIN}`, name: "E2E Editor" };

function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
}

async function withDb<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function createTestAdmins() {
  await removeTestData();
  const supabase = supabaseAdmin();
  const accounts = [
    { ...SUPER, role: "SUPER_ADMIN", password: randomBytes(18).toString("base64url") },
    { ...EDITOR, role: "ADMIN", password: randomBytes(18).toString("base64url") },
  ];
  for (const account of accounts) {
    const { data, error } = await supabase.auth.admin.createUser({ email: account.email, password: account.password, email_confirm: true });
    if (error || !data.user) throw new Error(`Could not create ${account.email}: ${error?.message}`);
    await withDb((c) =>
      c.query(`INSERT INTO "AdminUser" (id, email, name, role, active, "updatedAt") VALUES ($1, $2, $3, $4, true, now())`, [
        data.user!.id,
        account.email,
        account.name,
        account.role,
      ]),
    );
  }
  return { superPassword: accounts[0].password, editorPassword: accounts[1].password };
}

/** Deletes the test accounts and every record whose title/name marks it as test data. */
export async function removeTestData() {
  const supabase = supabaseAdmin();
  await withDb(async (c) => {
    const like = `${E2E_PREFIX}%`;
    const media = await c.query<{ bucket: string; path: string }>(`SELECT bucket, path FROM "Media" WHERE title LIKE $1 OR filename LIKE $2`, [like, "e2e-%"]);
    for (const m of media.rows) await supabase.storage.from(m.bucket).remove([m.path]);
    await c.query(`DELETE FROM "Media" WHERE title LIKE $1 OR filename LIKE $2`, [like, "e2e-%"]);
    await c.query(`DELETE FROM "Article" WHERE title LIKE $1`, [like]);
    await c.query(`DELETE FROM "Event" WHERE title LIKE $1`, [like]);
    await c.query(`DELETE FROM "Faq" WHERE question LIKE $1`, [like]);
    await c.query(`DELETE FROM "ContactSubmission" WHERE email LIKE $1`, [`%@${E2E_DOMAIN}`]);
    await c.query(`DELETE FROM "AuditLog" WHERE "userEmail" LIKE $1`, [`%@${E2E_DOMAIN}`]);
    const users = await c.query<{ id: string }>(`SELECT id FROM "AdminUser" WHERE email LIKE $1`, [`%@${E2E_DOMAIN}`]);
    await c.query(`DELETE FROM "AdminUser" WHERE email LIKE $1`, [`%@${E2E_DOMAIN}`]);
    for (const u of users.rows) await supabase.auth.admin.deleteUser(u.id);
  });
  // Auth users whose AdminUser row was already gone.
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
  for (const u of data?.users ?? []) if (u.email?.endsWith(`@${E2E_DOMAIN}`)) await supabase.auth.admin.deleteUser(u.id);
}

export async function readTheme(): Promise<Record<string, string>> {
  return withDb(async (c) => (await c.query(`SELECT * FROM "ThemeSettings" WHERE id = 1`)).rows[0]);
}

export async function restoreTheme(theme: Record<string, string>) {
  await withDb((c) =>
    c.query(`UPDATE "ThemeSettings" SET "colorPrimary" = $1, "updatedAt" = now() WHERE id = 1`, [theme.colorPrimary]),
  );
}
