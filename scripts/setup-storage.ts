/**
 * Creates or updates the Supabase Storage buckets defined in src/lib/storage-config.ts.
 * Idempotent — safe to run against local and production projects.
 *   npm run storage:setup
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { BUCKETS, type BucketName } from "../src/lib/storage-config";

config({ path: [".env.local", ".env"], quiet: true });

export async function ensureBuckets(log = console.log) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: existing, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const names = new Set(existing.map((b) => b.id));

  for (const [name, cfg] of Object.entries(BUCKETS) as [BucketName, (typeof BUCKETS)[BucketName]][]) {
    const options = {
      public: cfg.public,
      allowedMimeTypes: [...cfg.allowedMimeTypes],
      fileSizeLimit: cfg.maxBytes,
    };
    const result = names.has(name)
      ? await supabase.storage.updateBucket(name, options)
      : await supabase.storage.createBucket(name, options);
    if (result.error) throw new Error(`Bucket ${name}: ${result.error.message}`);
    log(`${names.has(name) ? "Updated" : "Created"} bucket "${name}" (${cfg.public ? "public" : "private"})`);
  }
}

// Run directly: tsx scripts/setup-storage.ts
if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/setup-storage.ts")) {
  ensureBuckets().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
