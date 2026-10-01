/**
 * Runs before `next build`. Public pages are prerendered from the database, so a
 * build without a configured, migrated and seeded database would either crash
 * with an obscure error or bake empty pages into the cache. Fail early instead,
 * with instructions.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: [".env.local", ".env"], quiet: true });

const REQUIRED = [
  ["DATABASE_URL", "Supabase → Connect → Transaction pooler (port 6543)"],
  ["DIRECT_URL", "Supabase → Connect → Session pooler (port 5432)"],
  ["NEXT_PUBLIC_SUPABASE_URL", "Supabase → Project Settings → API → Project URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase → Project Settings → API → anon / publishable key"],
  ["SUPABASE_SERVICE_ROLE_KEY", "Supabase → Project Settings → API → service_role / secret key"],
  ["NEXT_PUBLIC_SITE_URL", "The public URL, e.g. https://<project>.vercel.app"],
  ["IP_HASH_SECRET", "Any long random string"],
] as const;

function fail(lines: string[]): never {
  console.error(["", "✖ Build preflight failed", "", ...lines, "", "See README → Deployment.", ""].join("\n"));
  process.exit(1);
}

async function main() {
  const missing = REQUIRED.filter(([name]) => !process.env[name]);
  if (missing.length > 0) {
    fail([
      "Missing environment variables (Vercel → Project → Settings → Environment Variables):",
      ...missing.map(([name, hint]) => `  • ${name} — ${hint}`),
    ]);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15_000 });
  try {
    await client.connect();
  } catch (error) {
    const err = error as Error & { code?: string };
    fail([
      `Could not connect to the database with DATABASE_URL: ${err.message || err.code || String(error)}`,
      "Check the password and that you used the Transaction pooler string (port 6543).",
    ]);
  }
  try {
    const { rows } = await client.query<{ exists: boolean }>(
      `SELECT to_regclass('public."SiteSettings"') IS NOT NULL AS exists`,
    );
    if (!rows[0]?.exists) fail(["The database has no tables. Run the migrations: npm run db:deploy"]);
    const settings = await client.query(`SELECT 1 FROM "SiteSettings" WHERE id = 1`);
    if (settings.rowCount === 0) fail(["The database is empty. Seed it once: npm run db:seed"]);
  } finally {
    await client.end();
  }
  console.log("✓ Build preflight: environment and database look good.");
}

main().catch((error) => fail([String(error)]));
