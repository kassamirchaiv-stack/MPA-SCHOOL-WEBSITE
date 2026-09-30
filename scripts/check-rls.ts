/**
 * Fails if any table in the public schema has row level security disabled.
 * Run after adding migrations: npm run db:check-rls
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const client = new pg.Client({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query<{ tablename: string }>(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity ORDER BY tablename",
  );
  await client.end();
  if (rows.length > 0) {
    console.error(`RLS is disabled on: ${rows.map((r) => r.tablename).join(", ")}`);
    process.exit(1);
  }
  console.log("RLS is enabled on every public table.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
